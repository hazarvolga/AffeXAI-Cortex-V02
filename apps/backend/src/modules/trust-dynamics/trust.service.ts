import { Injectable, Logger } from "@nestjs/common";
import { BrandService } from "../brand/brand.service";

@Injectable()
export class TrustService {
  private readonly logger = new Logger(TrustService.name);

  constructor(private readonly brandService: BrandService) {}

  async getTrustMetrics(tenantId: string) {
    try {
      this.logger.log("🔍 Fetching brand intelligence data...");
      const intelligence =
        await this.brandService.getBrandIntelligence(tenantId);

      if (!intelligence) {
        throw new Error("Brand intelligence is unavailable");
      }
      // A trust score needs all three sources; a partial one would read as a real score.
      if (
        !intelligence.resonance ||
        !intelligence.convergence ||
        !intelligence.friction
      ) {
        throw new Error(
          "Trust index needs resonance, convergence and friction sources",
        );
      }

      this.logger.log("✅ Brand intelligence data received");

      // Normalize metrics to 0-100 scale
      this.logger.log(
        `📊 Normalizing metrics - Resonance: ${intelligence.resonance.value}, Convergence: ${intelligence.convergence.subtitle}, Friction: ${intelligence.friction.openTickets}`,
      );

      const resonanceScore = this.normalizeResonance(
        intelligence.resonance.value,
      );
      const convergenceScore = this.normalizeConvergence(
        intelligence.convergence.subtitle,
      );
      const frictionScore = this.normalizeFriction(
        intelligence.friction.openTickets,
      );

      this.logger.log(
        `📈 Normalized scores - Resonance: ${resonanceScore}, Convergence: ${convergenceScore}, Friction: ${frictionScore}`,
      );

      // Weights: Resonance 40%, Convergence 35%, Friction 25% (Inverse)
      const trustIndex =
        resonanceScore * 0.4 +
        convergenceScore * 0.35 +
        (100 - frictionScore) * 0.25;

      this.logger.log(`🎯 Calculated Trust Index: ${trustIndex}`);

      // Trust is not stored over time yet, so there is one real point and no
      // forecast: a trend line would have to be invented.

      const result = {
        trustIndex: Math.round(trustIndex),
        components: {
          resonance: Math.round(resonanceScore),
          convergence: Math.round(convergenceScore),
          friction: Math.round(frictionScore),
        },
        forecast: {
          current: [Math.round(trustIndex)],
          projected: [] as number[],
        },
        history: "snapshot" as const,
        status: this.getTrustStatus(trustIndex),
      };

      this.logger.log(
        `✅ Trust metrics calculated successfully: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      // No sample fallback: a failure must not be shown as a trust score.
      this.logger.error(
        `❌ Failed to calculate trust metrics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private normalizeResonance(value: string): number {
    // e.g., "0.04%" -> Low resonance or high? Context matters.
    // Assuming this is engagement rate. Industry avg ~1-3%.
    // Let's scale: 0% = 0, 5% = 100.
    const num = parseFloat(value.replace("%", ""));
    return Math.min(Math.max((num / 5) * 100, 0), 100);
  }

  private normalizeConvergence(subtitle: string): number {
    // "Average Open Rate: 33.5% across..."
    const match = subtitle.match(/(\d+\.?\d*)%/);
    if (match) {
      const openRate = parseFloat(match[1]);
      // Scale: 0% = 0, 50% = 100
      return Math.min(Math.max((openRate / 50) * 100, 0), 100);
    }
    return 50; // Default average
  }

  private normalizeFriction(openTickets: number = 0): number {
    // 0 tickets = 0 friction/score (Good) -> Wait, we want 0-100 where 100 is MAX Friction (Bad).
    // 0 tickets = 0. 50 tickets = 100.
    return Math.min(Math.max((openTickets / 50) * 100, 0), 100);
  }

  private getTrustStatus(score: number): string {
    if (score >= 80) return "Elite";
    if (score >= 60) return "Strong";
    if (score >= 40) return "Moderate";
    return "Vulnerable";
  }
}
