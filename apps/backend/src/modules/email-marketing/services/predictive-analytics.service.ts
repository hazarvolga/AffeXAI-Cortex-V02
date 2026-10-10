import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailCampaign } from '../entities/email-campaign.entity';
import { EmailLog } from '../entities/email-log.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { EmailOpenHistory } from '../entities/email-open-history.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface CampaignPrediction {
  expectedOpenRate: number;
  expectedClickRate: number;
  expectedConversionRate: number;
  confidenceScore: number;
  riskFactors: string[];
  recommendations: string[];
  performanceScore: number; // 0-100
}

export interface EngagementScore {
  subscriberId: string;
  score: number; // 0-100
  category: 'highly-engaged' | 'moderately-engaged' | 'at-risk' | 'inactive';
  lastEngagement: Date | null;
  totalInteractions: number;
}

export interface ChurnRisk {
  subscriberId: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  daysInactive: number;
  predictedChurnDate: Date;
  retentionActions: string[];
}

export interface AIInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedAction?: string;
}

@Injectable()
export class PredictiveAnalyticsService {
  constructor(
    @InjectRepository(EmailCampaign)
    private readonly campaignRepository: Repository<EmailCampaign>,
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
    @InjectRepository(EmailOpenHistory)
    private readonly openHistoryRepository: Repository<EmailOpenHistory>,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    return this.tenantService.getTenantId() || 'default';
  }

  /**
   * Kampanya performansını tahmin et
   */
  async predictCampaignPerformance(
    campaignId: string,
    subscriberIds: string[],
  ): Promise<CampaignPrediction> {
    const tenantId = this.getTenantId();
    // Geçmiş kampanya performanslarını al
    const historicalCampaigns = await this.campaignRepository.find({
      where: { status: 'sent', tenantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    // Ortalama açılma ve tıklama oranlarını hesapla
    let totalOpenRate = 0;
    let totalClickRate = 0;
    let campaignCount = 0;

    for (const campaign of historicalCampaigns) {
      if (campaign.sentCount > 0) {
        totalOpenRate += (campaign.openedCount || 0) / campaign.sentCount;
        totalClickRate += (campaign.clickedCount || 0) / campaign.sentCount;
        campaignCount++;
      }
    }

    const avgOpenRate = campaignCount > 0 ? totalOpenRate / campaignCount : 0.25;
    const avgClickRate = campaignCount > 0 ? totalClickRate / campaignCount : 0.05;

    // Abone engagement skorlarını hesapla
    const engagementScores = await Promise.all(
      subscriberIds.slice(0, 100).map(id => this.calculateEngagementScore(id))
    );

    const avgEngagement = engagementScores.reduce((acc, s) => acc + s.score, 0) / engagementScores.length;

    // Tahminleri hesapla
    const engagementMultiplier = avgEngagement / 50; // 50 is baseline
    const expectedOpenRate = Math.min(avgOpenRate * engagementMultiplier, 0.6);
    const expectedClickRate = Math.min(avgClickRate * engagementMultiplier, 0.2);
    const expectedConversionRate = expectedClickRate * 0.15; // %15 conversion from clicks

    // Risk faktörleri
    const riskFactors: string[] = [];
    if (avgEngagement < 30) {
      riskFactors.push('Düşük abone etkileşimi');
    }
    if (subscriberIds.length > 10000) {
      riskFactors.push('Büyük gönderim listesi - spam riski');
    }
    if (campaignCount < 5) {
      riskFactors.push('Yetersiz geçmiş veri');
    }

    // Öneriler
    const recommendations: string[] = [];
    if (expectedOpenRate < 0.2) {
      recommendations.push('Konu satırını A/B test ile optimize edin');
    }
    if (avgEngagement < 40) {
      recommendations.push('İnaktif aboneleri segmentleyip özel kampanya gönderin');
    }
    recommendations.push('En optimal gönderim zamanını kullanın');

    // Performans skoru
    const performanceScore = Math.round(
      (expectedOpenRate * 40 + expectedClickRate * 40 + expectedConversionRate * 20) * 100
    );

    // Güven skoru
    const confidenceScore = Math.min(campaignCount / 10, 1); // Max confidence at 10+ campaigns

    return {
      expectedOpenRate: Math.round(expectedOpenRate * 100) / 100,
      expectedClickRate: Math.round(expectedClickRate * 100) / 100,
      expectedConversionRate: Math.round(expectedConversionRate * 100) / 100,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      riskFactors,
      recommendations,
      performanceScore,
    };
  }

  /**
   * Abone engagement skorunu hesapla
   */
  async calculateEngagementScore(subscriberId: string): Promise<EngagementScore> {
    const tenantId = this.getTenantId();
    const subscriber = await this.subscriberRepository.findOne({
      where: { id: subscriberId, tenantId },
    });

    if (!subscriber) {
      return {
        subscriberId,
        score: 0,
        category: 'inactive',
        lastEngagement: null,
        totalInteractions: 0,
      };
    }

    // Email loglarını al
    const logs = await this.emailLogRepository.find({
      where: { recipientEmail: subscriber.email, tenantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    // Metrikleri hesapla
    const totalOpens = subscriber.opens || 0;
    const totalClicks = subscriber.clicks || 0;
    const lastOpenedLog = logs.find(log => log.openedAt);
    const lastEngagement = lastOpenedLog ? lastOpenedLog.openedAt : null;

    // Skor hesapla (0-100)
    let score = 0;

    // Açılma oranı (max 40 puan)
    if (logs.length > 0) {
      const openRate = totalOpens / logs.length;
      score += Math.min(openRate * 100, 40);
    }

    // Tıklama oranı (max 40 puan)
    if (totalOpens > 0) {
      const clickRate = totalClicks / totalOpens;
      score += Math.min(clickRate * 100, 40);
    }

    // Son aktivite (max 20 puan)
    if (lastEngagement) {
      const daysSinceEngagement = Math.floor(
        (Date.now() - lastEngagement.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceEngagement < 7) score += 20;
      else if (daysSinceEngagement < 30) score += 15;
      else if (daysSinceEngagement < 60) score += 10;
      else if (daysSinceEngagement < 90) score += 5;
    }

    // Kategori belirleme
    let category: EngagementScore['category'];
    if (score >= 70) category = 'highly-engaged';
    else if (score >= 40) category = 'moderately-engaged';
    else if (score >= 20) category = 'at-risk';
    else category = 'inactive';

    return {
      subscriberId,
      score: Math.round(score),
      category,
      lastEngagement,
      totalInteractions: totalOpens + totalClicks,
    };
  }

  /**
   * Churn (kayıp) riskini hesapla
   */
  async calculateChurnRisk(subscriberId: string): Promise<ChurnRisk> {
    const engagement = await this.calculateEngagementScore(subscriberId);

    // İnaktif gün sayısını hesapla
    const daysInactive = engagement.lastEngagement
      ? Math.floor((Date.now() - engagement.lastEngagement.getTime()) / (1000 * 60 * 60 * 24))
      : 365;

    // Risk skoru hesapla (0-100)
    let riskScore = 0;

    // İnaktivite bazlı risk (max 50 puan)
    if (daysInactive >= 90) riskScore += 50;
    else if (daysInactive >= 60) riskScore += 35;
    else if (daysInactive >= 30) riskScore += 20;
    else if (daysInactive >= 14) riskScore += 10;

    // Engagement bazlı risk (max 50 puan)
    riskScore += Math.max(0, 50 - engagement.score);

    // Risk seviyesi
    let riskLevel: ChurnRisk['riskLevel'];
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    // Tahmini kayıp tarihi
    const daysUntilChurn = Math.max(7, 120 - daysInactive);
    const predictedChurnDate = new Date();
    predictedChurnDate.setDate(predictedChurnDate.getDate() + daysUntilChurn);

    // Retention aksiyonları
    const retentionActions: string[] = [];
    if (riskLevel === 'critical') {
      retentionActions.push('Acil win-back kampanyası gönderin');
      retentionActions.push('%50 indirim kuponu sunun');
    } else if (riskLevel === 'high') {
      retentionActions.push('Kişiselleştirilmiş re-engagement emaili gönderin');
      retentionActions.push('Anket ile geri bildirim isteyin');
    } else if (riskLevel === 'medium') {
      retentionActions.push('Özel içerik veya teklif gönderin');
      retentionActions.push('Email sıklığını optimize edin');
    } else {
      retentionActions.push('Mevcut engagement stratejisini sürdürün');
    }

    return {
      subscriberId,
      riskScore: Math.round(riskScore),
      riskLevel,
      daysInactive,
      predictedChurnDate,
      retentionActions,
    };
  }

  /**
   * AI destekli içgörüler oluştur
   */
  async generateAIInsights(campaignId?: string): Promise<AIInsight[]> {
    const tenantId = this.getTenantId();
    const insights: AIInsight[] = [];

    // Son 30 günün performans trendleri
    const recentCampaigns = await this.campaignRepository.find({
      where: { status: 'sent', tenantId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (recentCampaigns.length >= 3) {
      // Açılma oranı trendi
      const openRates = recentCampaigns.map(c =>
        c.sentCount > 0 ? (c.openedCount || 0) / c.sentCount : 0
      );

      const avgOpenRate = openRates.reduce((a, b) => a + b, 0) / openRates.length;
      const recentOpenRate = openRates[0];

      if (recentOpenRate > avgOpenRate * 1.2) {
        insights.push({
          type: 'trend',
          title: 'Açılma Oranları Artışta',
          description: `Son kampanyanız ortalamadan %${Math.round((recentOpenRate / avgOpenRate - 1) * 100)} daha iyi performans gösterdi.`,
          impact: 'high',
          actionable: true,
          suggestedAction: 'Bu başarılı stratejiyi devam ettirin ve A/B test ile optimize edin.',
        });
      } else if (recentOpenRate < avgOpenRate * 0.8) {
        insights.push({
          type: 'warning',
          title: 'Açılma Oranları Düşüşte',
          description: `Son kampanyanız ortalamadan %${Math.round((1 - recentOpenRate / avgOpenRate) * 100)} düşük performans gösterdi.`,
          impact: 'high',
          actionable: true,
          suggestedAction: 'Konu satırlarını gözden geçirin ve gönderim zamanını optimize edin.',
        });
      }
    }

    // Segment fırsatları
    const totalSubscribers = await this.subscriberRepository.count({
      where: { tenantId }
    });
    const activeSubscribers = await this.subscriberRepository.count({
      where: { status: 'active', tenantId },
    });

    if (activeSubscribers < totalSubscribers * 0.7) {
      insights.push({
        type: 'opportunity',
        title: 'İnaktif Abone Fırsatı',
        description: `Abonelerinizin %${Math.round((1 - activeSubscribers / totalSubscribers) * 100)}'ü inaktif durumda.`,
        impact: 'medium',
        actionable: true,
        suggestedAction: 'Re-engagement kampanyası başlatarak inaktif aboneleri geri kazanın.',
      });
    }

    // En iyi gönderim zamanı
    const openHistory = await this.openHistoryRepository
      .createQueryBuilder('history')
      .select('history.hourOfDay', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('history.tenantId = :tenantId', { tenantId })
      .andWhere('history.hourOfDay IS NOT NULL')
      .groupBy('history.hourOfDay')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();

    if (openHistory.length > 0) {
      const bestHours = openHistory.map(h => `${h.hour}:00`).join(', ');
      insights.push({
        type: 'opportunity',
        title: 'Optimal Gönderim Zamanları',
        description: `Aboneleriniz en çok şu saatlerde email açıyor: ${bestHours}`,
        impact: 'medium',
        actionable: true,
        suggestedAction: 'Kampanyalarınızı bu saatlerde planlayın.',
      });
    }

    // Anomali tespiti
    if (recentCampaigns.length > 0) {
      const lastCampaign = recentCampaigns[0];
      if (lastCampaign.bounceCount && lastCampaign.sentCount > 0) {
        const bounceRate = lastCampaign.bounceCount / lastCampaign.sentCount;
        if (bounceRate > 0.05) {
          insights.push({
            type: 'anomaly',
            title: 'Yüksek Bounce Oranı Tespit Edildi',
            description: `Son kampanyanızda %${Math.round(bounceRate * 100)} bounce oranı görüldü.`,
            impact: 'high',
            actionable: true,
            suggestedAction: 'Email listesini temizleyin ve email validation kullanın.',
          });
        }
      }
    }

    return insights;
  }

  /**
   * Dashboard için özet metrikleri al
   */
  async getDashboardMetrics(): Promise<{
    averageEngagementScore: number;
    atRiskSubscribers: number;
    predictedMonthlyGrowth: number;
    topPerformingSegments: Array<{ name: string; score: number }>;
    insights: AIInsight[];
  }> {
    const tenantId = this.getTenantId();
    // Rastgele 100 abonenin engagement skorunu hesapla
    const sampleSubscribers = await this.subscriberRepository.find({
      where: { status: 'active', tenantId },
      take: 100,
    });

    const engagementScores = await Promise.all(
      sampleSubscribers.map(s => this.calculateEngagementScore(s.id))
    );

    const averageEngagementScore = Math.round(
      engagementScores.reduce((acc, s) => acc + s.score, 0) / engagementScores.length
    );

    const atRiskCount = engagementScores.filter(s => s.category === 'at-risk').length;
    const atRiskSubscribers = Math.round((atRiskCount / engagementScores.length) * 100);

    // Büyüme tahmini (basit linear projection)
    const currentMonth = await this.subscriberRepository.count({
      where: { status: 'active', tenantId },
    });
    const predictedMonthlyGrowth = Math.round(currentMonth * 0.05); // %5 büyüme tahmini

    // Top performing segments (simulated)
    const topPerformingSegments = [
      { name: 'VIP Müşteriler', score: 85 },
      { name: 'Yeni Kayıtlar', score: 72 },
      { name: 'Aktif Alıcılar', score: 68 },
    ];

    // AI insights
    const insights = await this.generateAIInsights();

    return {
      averageEngagementScore,
      atRiskSubscribers,
      predictedMonthlyGrowth,
      topPerformingSegments,
      insights: insights.slice(0, 5), // Top 5 insights
    };
  }
}