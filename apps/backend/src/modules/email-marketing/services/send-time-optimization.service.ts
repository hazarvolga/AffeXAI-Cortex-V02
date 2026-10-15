import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmailOpenHistory } from "../entities/email-open-history.entity";
import { Subscriber } from "../entities/subscriber.entity";
import { TenantService } from "../../../core/tenant/tenant.service";

interface OptimalTimeResult {
  subscriberId: string;
  optimalHour: number; // 0-23
  optimalDayOfWeek: number; // 0-6
  confidence: number; // 0-1
  timezone: string;
  basedOnDataPoints: number;
}

interface GlobalOptimalTime {
  hour: number;
  dayOfWeek: number;
  /** Opens are recorded, sends per slot are not, so no open rate can be measured yet. */
  averageOpenRate: number | null;
  basedOnOpens: number;
}

@Injectable()
export class SendTimeOptimizationService {
  constructor(
    @InjectRepository(EmailOpenHistory)
    private readonly openHistoryRepository: Repository<EmailOpenHistory>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
    private readonly tenantService: TenantService,
  ) {}

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException("Tenant context required");
    return tenantId;
  }

  /**
   * Her abone için kişiselleştirilmiş optimal gönderim zamanı hesaplar
   */
  async calculateOptimalTimeForSubscriber(
    subscriberId: string,
    minDataPoints = 5,
  ): Promise<OptimalTimeResult> {
    const tenantId = this.getTenantId();
    // Abonenin email açma geçmişini al
    const history = await this.openHistoryRepository.find({
      where: { subscriberId, tenantId },
      order: { openedAt: "DESC" },
      take: 100, // Son 100 açılmayı al
    });

    if (history.length < minDataPoints) {
      // Yeterli veri yoksa global ortalamayı kullan
      const globalOptimal = await this.calculateGlobalOptimalTime();
      return {
        subscriberId,
        optimalHour: globalOptimal.hour,
        optimalDayOfWeek: globalOptimal.dayOfWeek,
        confidence: 0.3, // Düşük güven skoru
        timezone: "UTC",
        basedOnDataPoints: history.length,
      };
    }

    // Saat bazlı açılma dağılımı
    const hourDistribution: Record<number, number> = {};
    const dayDistribution: Record<number, number> = {};
    let mostCommonTimezone = "UTC";

    history.forEach((record) => {
      if (record.hourOfDay !== null) {
        hourDistribution[record.hourOfDay] =
          (hourDistribution[record.hourOfDay] || 0) + 1;
      }
      if (record.dayOfWeek !== null) {
        dayDistribution[record.dayOfWeek] =
          (dayDistribution[record.dayOfWeek] || 0) + 1;
      }
      if (record.timezone) {
        mostCommonTimezone = record.timezone;
      }
    });

    // En popüler saati bul
    const optimalHour = this.findOptimalValue(hourDistribution);
    const optimalDayOfWeek = this.findOptimalValue(dayDistribution);

    // Güven skorunu hesapla (veri noktası sayısına göre)
    const confidence = Math.min(history.length / 30, 1); // 30 veri noktasında tam güven

    return {
      subscriberId,
      optimalHour,
      optimalDayOfWeek,
      confidence,
      timezone: mostCommonTimezone,
      basedOnDataPoints: history.length,
    };
  }

  /**
   * Tüm kampanya için optimal gönderim zamanı hesaplar
   */
  async calculateOptimalTimeForCampaign(
    subscriberIds: string[],
  ): Promise<{ globalTime: Date; individualTimes: Map<string, Date> }> {
    const individualTimes = new Map<string, Date>();
    const allOptimalTimes: OptimalTimeResult[] = [];

    // Her abone için optimal zamanı hesapla
    for (const subscriberId of subscriberIds) {
      const optimalTime =
        await this.calculateOptimalTimeForSubscriber(subscriberId);
      allOptimalTimes.push(optimalTime);

      // Bireysel optimal zamanı hesapla
      const now = new Date();
      const targetDate = this.getNextOccurrence(
        optimalTime.optimalDayOfWeek,
        optimalTime.optimalHour,
      );
      individualTimes.set(subscriberId, targetDate);
    }

    // Global optimal zamanı hesapla (ağırlıklı ortalama)
    const globalOptimal = this.calculateWeightedAverage(allOptimalTimes);
    const globalTime = this.getNextOccurrence(
      globalOptimal.dayOfWeek,
      globalOptimal.hour,
    );

    return { globalTime, individualTimes };
  }

  /**
   * Global optimal gönderim zamanını hesaplar
   */
  async calculateGlobalOptimalTime(): Promise<GlobalOptimalTime> {
    const tenantId = this.getTenantId();
    const result = await this.openHistoryRepository
      .createQueryBuilder("history")
      .select("history.hourOfDay", "hour")
      .addSelect("history.dayOfWeek", "day")
      .addSelect("COUNT(*)", "count")
      .where("history.tenantId = :tenantId", { tenantId })
      .andWhere("history.hourOfDay IS NOT NULL")
      .andWhere("history.dayOfWeek IS NOT NULL")
      .groupBy("history.hourOfDay")
      .addGroupBy("history.dayOfWeek")
      .orderBy("count", "DESC")
      .limit(1)
      .getRawOne();

    if (!result) {
      // No opens yet: Tuesday 10:00 as a neutral default, marked as based on nothing.
      return { hour: 10, dayOfWeek: 2, averageOpenRate: null, basedOnOpens: 0 };
    }

    const totalOpens = await this.openHistoryRepository.count({
      where: { tenantId },
    });
    return {
      hour: parseInt(result.hour, 10),
      dayOfWeek: parseInt(result.day, 10),
      averageOpenRate: null,
      basedOnOpens: totalOpens,
    };
  }

  /**
   * Bir aboneye ait email açma geçmişini kaydeder
   */
  async recordEmailOpen(
    subscriberId: string,
    campaignId: string,
    metadata: {
      timezone?: string;
      deviceType?: string;
      emailClient?: string;
      ipAddress?: string;
      country?: string;
      city?: string;
    } = {},
  ): Promise<void> {
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();
    const tenantId = this.getTenantId();

    const openHistory = this.openHistoryRepository.create({
      subscriberId,
      campaignId,
      openedAt: now,
      hourOfDay,
      dayOfWeek,
      tenantId,
      ...metadata,
    });

    await this.openHistoryRepository.save(openHistory);
  }

  /**
   * Belirli bir segment için optimal gönderim zamanı önerileri
   */
  async getSegmentOptimalTimes(segmentId: string): Promise<{
    segmentId: string;
    scope: "tenant";
    basedOnOpens: number;
    recommendations: Array<{
      time: string;
      expectedOpenRate: number | null;
      reason: string;
    }>;
  }> {
    // Segment-level analysis does not exist yet; recommend from the tenant's opens and say so.
    const globalOptimal = await this.calculateGlobalOptimalTime();
    const reason =
      globalOptimal.basedOnOpens > 0
        ? `Kiracının ${globalOptimal.basedOnOpens} açılmasına göre; segment bazında analiz henüz yok`
        : "Henüz açılma verisi yok; varsayılan zaman";

    return {
      segmentId,
      scope: "tenant",
      basedOnOpens: globalOptimal.basedOnOpens,
      recommendations: [
        {
          time: `${this.getDayName(globalOptimal.dayOfWeek)} ${globalOptimal.hour}:00`,
          expectedOpenRate: null,
          reason,
        },
      ],
    };
  }

  /**
   * Dağılımdan optimal değeri bulur
   */
  private findOptimalValue(distribution: Record<number, number>): number {
    let maxCount = 0;
    let optimalValue = 0;

    Object.entries(distribution).forEach(([value, count]) => {
      if (count > maxCount) {
        maxCount = count;
        optimalValue = parseInt(value);
      }
    });

    return optimalValue;
  }

  /**
   * Ağırlıklı ortalama hesaplar
   */
  private calculateWeightedAverage(times: OptimalTimeResult[]): {
    hour: number;
    dayOfWeek: number;
  } {
    let totalWeight = 0;
    let weightedHour = 0;
    let weightedDay = 0;

    times.forEach((time) => {
      const weight = time.confidence * time.basedOnDataPoints;
      totalWeight += weight;
      weightedHour += time.optimalHour * weight;
      weightedDay += time.optimalDayOfWeek * weight;
    });

    if (totalWeight === 0) {
      return { hour: 10, dayOfWeek: 2 }; // Varsayılan
    }

    return {
      hour: Math.round(weightedHour / totalWeight),
      dayOfWeek: Math.round(weightedDay / totalWeight),
    };
  }

  /**
   * Bir sonraki belirtilen gün ve saati hesaplar
   */
  private getNextOccurrence(dayOfWeek: number, hour: number): Date {
    const now = new Date();
    const target = new Date();

    // Hedef saati ayarla
    target.setHours(hour, 0, 0, 0);

    // Hedef günü bul
    const currentDay = now.getDay();
    let daysToAdd = dayOfWeek - currentDay;

    if (daysToAdd < 0 || (daysToAdd === 0 && target <= now)) {
      daysToAdd += 7;
    }

    target.setDate(target.getDate() + daysToAdd);

    return target;
  }

  /**
   * Gün numarasından gün adını döndürür
   */
  private getDayName(dayNumber: number): string {
    const days = [
      "Pazar",
      "Pazartesi",
      "Salı",
      "Çarşamba",
      "Perşembe",
      "Cuma",
      "Cumartesi",
    ];
    return days[dayNumber];
  }
}
