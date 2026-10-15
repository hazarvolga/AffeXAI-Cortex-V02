import { Injectable, Logger } from "@nestjs/common";
import {
  BrandIntelligenceDto,
  BrandResonanceDto,
  SignalConvergenceDto,
  ReputationalFrictionDto,
  SourceQuality,
  TopologyDto,
  TrajectoryDto,
} from "./dto/brand-intelligence.dto";
import { splitTrajectory } from "./trajectory";
import { SocialMediaService } from "../social-media/social-media.service";
import { EmailCampaignService } from "../email-marketing/email-campaign.service";
import { TicketsService } from "../tickets/tickets.service";

function emptyTrajectory(): TrajectoryDto {
  const segment = (title: string) => ({
    title,
    description: "No data.",
    data: [] as number[],
  });
  return {
    sufficientData: false,
    historical: segment("Historical Coherence"),
    current: segment("Current Convergence"),
    projected: segment("Projected Trajectory"),
  };
}

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);

  constructor(
    private readonly socialMediaService: SocialMediaService,
    private readonly emailCampaignService: EmailCampaignService,
    private readonly ticketsService: TicketsService,
  ) {}

  async getBrandIntelligence(tenantId: string): Promise<BrandIntelligenceDto> {
    // Each source is read on its own: one missing source is reported, not hidden or invented.
    const [resonance, convergence, friction, trajectory] =
      await Promise.allSettled([
        this.calculateResonance(tenantId),
        this.calculateConvergence(tenantId),
        this.calculateFriction(tenantId),
        this.calculateTrajectory(tenantId),
      ]);
    const settled = [resonance, convergence, friction, trajectory];
    settled
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      )
      .forEach((result) =>
        this.logger.error(`Brand source unavailable: ${String(result.reason)}`),
      );
    if (settled.every((result) => result.status === "rejected")) {
      throw (resonance as PromiseRejectedResult).reason;
    }

    const value = <T>(result: PromiseSettledResult<T>): T | null =>
      result.status === "fulfilled" ? result.value : null;
    const quality = (result: PromiseSettledResult<unknown>): SourceQuality =>
      result.status === "fulfilled" ? "live" : "unavailable";
    const trajectoryValue = value(trajectory) ?? emptyTrajectory();

    return {
      resonance: value(resonance),
      convergence: value(convergence),
      friction: value(friction),
      trajectory: trajectoryValue,
      topology: this.calculateTopology(),
      dataQuality: {
        resonance: quality(resonance),
        convergence: quality(convergence),
        friction: quality(friction),
        trajectory:
          trajectory.status === "rejected"
            ? "unavailable"
            : trajectoryValue.sufficientData
              ? "live"
              : "insufficient",
        topology: "unavailable",
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * The 3D surface needs engagement history per platform, which is not
   * collected yet. Returning no points keeps the UI from drawing invented terrain.
   */
  private calculateTopology(): TopologyDto {
    return {
      points: [],
      config: {
        scale: 1.5,
        colorHigh: "#ff8c00", // Orange for peaks
        colorLow: "#13ecda", // Teal for valleys
      },
    };
  }

  private async calculateResonance(
    tenantId: string,
  ): Promise<BrandResonanceDto> {
    // Metric: Social Media Activity & Stability (Tenant-Specific)
    const stats =
      await this.socialMediaService.getGlobalEngagementStats(tenantId);

    // Define thresholds for "Brand Health"
    // E.g. > 1% Engagement Rate is "Excellent", 0.5% "Stable", < 0.1% "Concerning"
    // Also consider volume of posts.

    let status: "Stable" | "Volatile" | "Critical" = "Stable";
    if (stats.engagementRate > 2.0) {
      status = "Stable";
    } else if (stats.engagementRate < 0.1 && stats.totalPosts > 5) {
      status = "Critical";
    } else if (stats.engagementRate < 1.0) {
      status = "Volatile";
    }

    return {
      status,
      value: `${stats.engagementRate.toFixed(2)}%`,
      description: `Aggregated engagement across ${stats.totalPosts} posts. ${stats.totalImpressions} total impressions generated.`,
    };
  }

  private async calculateConvergence(
    tenantId: string,
  ): Promise<SignalConvergenceDto> {
    // Metric: Email Campaign Performance (Open Rate / Click Rate)
    const campaigns = await this.emailCampaignService.findAll();
    const total = campaigns.length;

    let avgOpenRate = 0;

    if (total > 0) {
      const stats = await Promise.all(
        campaigns.map((c) => this.emailCampaignService.getCampaignStats(c.id)),
      );
      const totalOpens = stats.reduce(
        (acc, curr) => acc + (curr.openRate || 0),
        0,
      );
      avgOpenRate = totalOpens / total;
    }

    const isHighPerformance = avgOpenRate > 30;

    return {
      title: isHighPerformance
        ? "Momentum sustained in primary markets."
        : "Convergence stabilizing in core vectors.",
      subtitle: `Average Open Rate: ${avgOpenRate.toFixed(1)}% across ${total} active campaigns.`,
      deltaDescription: isHighPerformance
        ? "High-density sentiment cluster identifies persistent growth."
        : "Market signals align with projected baseline trajectories.",
    };
  }

  private async calculateTrajectory(tenantId: string): Promise<TrajectoryDto> {
    // Real daily engagement over the last 14 days; nothing is synthesised.
    const history = await this.socialMediaService.getEngagementHistory(
      14,
      tenantId,
    );
    const series = splitTrajectory(history.map((h) => h.value));

    return {
      sufficientData: series.sufficientData,
      historical: {
        title: "Historical Coherence",
        description: "Observed engagement velocity over previous intervals.",
        data: series.historical,
      },
      current: {
        title: "Current Convergence",
        description: "Engagement over the most recent days.",
        data: series.current,
      },
      projected: {
        title: "Projected Trajectory",
        description:
          "Linear projection of observed engagement; a forecast, not a measurement.",
        data: series.projected,
      },
    };
  }

  private async calculateFriction(
    tenantId: string,
  ): Promise<ReputationalFrictionDto> {
    // Metric: Support Tickets (SLA Compliance & Volume)
    const stats = await this.ticketsService.getStats();
    const { slaCompliance, openTickets } = stats;

    // Determine status - Updated to match DTO type
    let status: "Monitored" | "Critical" | "Resolved" | "Stable" = "Stable";
    let color = "#22c55e"; // Green

    if (slaCompliance < 90 || openTickets > 50) {
      status = "Critical";
      color = "#ef4444"; // Red
    } else if (slaCompliance < 95 || openTickets > 20) {
      status = "Monitored";
      color = "#f9bc06"; // Amber
    }

    return {
      title:
        status === "Critical"
          ? "ELEVATED FRICTION DETECTED"
          : "REPUTATIONAL FRICTION AT MARGINS",
      description:
        status === "Critical"
          ? `SLA Compliance dropped to ${slaCompliance}%. Immediate intervention required to restore narrative trust.`
          : `While the core is stable, minor oscillations are detected (${openTickets} open tickets). These do not yet constitute a threat.`,
      status,
      indicatorColor: color,
      openTickets: openTickets,
    };
  }
}
