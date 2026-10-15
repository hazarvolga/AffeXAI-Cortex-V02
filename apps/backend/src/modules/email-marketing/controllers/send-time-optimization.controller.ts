import { PermissionsGuard } from "../../../core/auth/guards/permissions.guard";
import { RequirePermissions } from "../../../core/auth/decorators/permissions.decorator";
import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../core/auth/decorators/current-user.decorator";
import { SendTimeOptimizationService } from "../services/send-time-optimization.service";

@Controller("email-marketing/optimization")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("marketing.manage")
export class SendTimeOptimizationController {
  constructor(
    private readonly optimizationService: SendTimeOptimizationService,
  ) {}

  /**
   * Get optimal send time for a specific subscriber
   */
  @Get("subscriber/:subscriberId")
  async getSubscriberOptimalTime(@Param("subscriberId") subscriberId: string) {
    const result =
      await this.optimizationService.calculateOptimalTimeForSubscriber(
        subscriberId,
      );

    return {
      subscriberId: result.subscriberId,
      optimalTime: {
        hour: result.optimalHour,
        dayOfWeek: result.optimalDayOfWeek,
        dayName: this.getDayName(result.optimalDayOfWeek),
        formatted: `${this.getDayName(result.optimalDayOfWeek)} ${result.optimalHour}:00`,
      },
      confidence: Math.round(result.confidence * 100),
      timezone: result.timezone,
      basedOnDataPoints: result.basedOnDataPoints,
      recommendation: this.getRecommendation(result.confidence),
    };
  }

  /**
   * Get optimal send times for a campaign
   */
  @Post("campaign/calculate")
  async calculateCampaignOptimalTime(
    @Body() body: { campaignId: string; subscriberIds: string[] },
  ) {
    const result =
      await this.optimizationService.calculateOptimalTimeForCampaign(
        body.subscriberIds,
      );

    return {
      campaignId: body.campaignId,
      globalOptimalTime: result.globalTime,
      individualOptimization: {
        enabled: true,
        subscriberCount: body.subscriberIds.length,
        optimizedCount: result.individualTimes.size,
      },
      estimatedImpact: {
        openRateIncrease: "15-25%",
        clickRateIncrease: "10-15%",
      },
    };
  }

  /**
   * Get global optimal send time statistics
   */
  @Get("global-stats")
  async getGlobalOptimalTime() {
    const result = await this.optimizationService.calculateGlobalOptimalTime();

    const slot = `${this.getDayName(result.dayOfWeek)} ${result.hour}:00`;
    return {
      globalOptimal: {
        hour: result.hour,
        dayOfWeek: result.dayOfWeek,
        dayName: this.getDayName(result.dayOfWeek),
        formatted: slot,
        // Not measured: sends per slot are not recorded, only opens.
        averageOpenRate:
          result.averageOpenRate === null
            ? null
            : Math.round(result.averageOpenRate * 100),
        basedOnOpens: result.basedOnOpens,
      },
      insights: [
        {
          type: "best_time",
          message:
            result.basedOnOpens > 0
              ? `En çok açılma ${slot} diliminde (${result.basedOnOpens} açılma)`
              : "Henüz açılma verisi yok; varsayılan zaman gösteriliyor",
        },
      ],
    };
  }

  /**
   * Get recommendations for a segment
   */
  @Get("segment/:segmentId/recommendations")
  async getSegmentRecommendations(@Param("segmentId") segmentId: string) {
    const result =
      await this.optimizationService.getSegmentOptimalTimes(segmentId);

    return {
      segmentId,
      scope: result.scope,
      basedOnOpens: result.basedOnOpens,
      recommendations: result.recommendations,
      lastUpdated: new Date(),
    };
  }

  /**
   * Helper to get day name
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

  /**
   * Get recommendation based on confidence
   */
  private getRecommendation(confidence: number): string {
    if (confidence >= 0.8) {
      return "Yüksek güvenilirlik - Kişiselleştirilmiş zamanlama önerilir";
    } else if (confidence >= 0.5) {
      return "Orta güvenilirlik - Segment bazlı zamanlama önerilir";
    } else {
      return "Düşük güvenilirlik - Global zamanlama önerilir";
    }
  }
}
