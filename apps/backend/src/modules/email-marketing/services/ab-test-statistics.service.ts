import { Injectable } from '@nestjs/common';
import { EmailCampaignVariant } from '../entities/email-campaign-variant.entity';

/**
 * Statistical result for A/B test
 */
export interface StatisticalResult {
  isSignificant: boolean;
  pValue: number;
  confidenceLevel: number;
  chiSquare: number;
  degreesOfFreedom: number;
  winner?: string; // variant label
  message: string;
  details: {
    sampleSizes: Record<string, number>;
    successRates: Record<string, number>;
    expectedValues: Record<string, number>;
    observedValues: Record<string, number>;
  };
}

/**
 * Confidence interval for a variant
 */
export interface ConfidenceInterval {
  rate: number;
  lower: number;
  upper: number;
  margin: number;
  sampleSize: number;
}

/**
 * A/B Test Statistics Service
 * Provides statistical analysis for email campaign A/B testing
 */
@Injectable()
export class AbTestStatisticsService {
  /**
   * Calculate chi-square test for A/B test significance
   * 
   * Chi-square test determines if there's a statistically significant
   * difference between the observed frequencies (actual results) and
   * expected frequencies (if all variants performed equally).
   * 
   * H0 (Null Hypothesis): No difference between variants
   * H1 (Alternative Hypothesis): Significant difference exists
   * 
   * @param variants Array of campaign variants with metrics
   * @param metric Metric to test (open, click, conversion)
   * @returns Statistical result with significance determination
   */
  calculateChiSquare(
    variants: EmailCampaignVariant[],
    metric: 'open' | 'click' | 'conversion',
  ): StatisticalResult {
    // Extract success/failure data for each variant
    const data = variants.map((v) => ({
      label: v.variantLabel,
      success: this.getSuccessCount(v, metric),
      failure: this.getFailureCount(v, metric),
      total: this.getTotalCount(v, metric),
    }));

    // Calculate totals
    const totalSuccess = data.reduce((sum, d) => sum + d.success, 0);
    const totalFailure = data.reduce((sum, d) => sum + d.failure, 0);
    const totalObservations = totalSuccess + totalFailure;

    // Expected success rate across all variants
    const expectedSuccessRate = totalSuccess / totalObservations;

    // Calculate chi-square statistic
    // χ² = Σ[(O - E)² / E]
    // where O = observed frequency, E = expected frequency
    let chiSquare = 0;
    const details = {
      sampleSizes: {} as Record<string, number>,
      successRates: {} as Record<string, number>,
      expectedValues: {} as Record<string, number>,
      observedValues: {} as Record<string, number>,
    };

    for (const d of data) {
      // Expected values if null hypothesis is true
      const expectedSuccess = d.total * expectedSuccessRate;
      const expectedFailure = d.total * (1 - expectedSuccessRate);

      // Chi-square contribution for this variant
      // Add both success and failure components
      const successContribution = Math.pow(d.success - expectedSuccess, 2) / expectedSuccess;
      const failureContribution = Math.pow(d.failure - expectedFailure, 2) / expectedFailure;
      
      chiSquare += successContribution + failureContribution;

      // Store details for reporting
      details.sampleSizes[d.label] = d.total;
      details.successRates[d.label] = d.total > 0 ? (d.success / d.total) * 100 : 0;
      details.expectedValues[d.label] = expectedSuccess;
      details.observedValues[d.label] = d.success;
    }

    // Degrees of freedom = (rows - 1) * (columns - 1)
    // For A/B test: (variants - 1) * (outcomes - 1)
    // outcomes = 2 (success/failure), so df = variants - 1
    const degreesOfFreedom = data.length - 1;

    // Calculate p-value from chi-square and df
    const pValue = this.calculatePValue(chiSquare, degreesOfFreedom);

    // Determine statistical significance
    // Common thresholds: p < 0.05 (95% confidence), p < 0.01 (99% confidence)
    const isSignificant = pValue < 0.05;

    // Find winner (variant with highest success rate)
    const rates = data.map((d) => ({
      label: d.label,
      rate: d.total > 0 ? d.success / d.total : 0,
    }));
    const winnerData = rates.reduce((max, r) => (r.rate > max.rate ? r : max), rates[0]);

    // Construct result message
    let message: string;
    if (isSignificant) {
      message = `Variant ${winnerData.label} is the statistically significant winner (p=${pValue.toFixed(4)}, χ²=${chiSquare.toFixed(2)}). There is strong evidence that the differences between variants are real and not due to chance.`;
    } else {
      message = `No statistically significant difference found (p=${pValue.toFixed(4)}, χ²=${chiSquare.toFixed(2)}). The observed differences may be due to random variation. Consider collecting more data or running the test longer.`;
    }

    return {
      isSignificant,
      pValue,
      confidenceLevel: (1 - pValue) * 100,
      chiSquare,
      degreesOfFreedom,
      winner: isSignificant ? winnerData.label : undefined,
      message,
      details,
    };
  }

  /**
   * Check if test has minimum sample size for all variants
   * 
   * Rule of thumb: Need at least 100 observations per variant for
   * reliable statistical analysis, though 50 is acceptable minimum.
   */
  hasMinimumSampleSize(variants: EmailCampaignVariant[], minSampleSize: number): boolean {
    return variants.every((v) => v.sentCount >= minSampleSize);
  }

  /**
   * Calculate confidence interval for a variant's success rate
   * 
   * Uses Wilson score interval (better than normal approximation for small samples)
   * 
   * @param variant Campaign variant
   * @param metric Metric to calculate interval for
   * @param confidenceLevel Confidence level (90, 95, or 99)
   * @returns Confidence interval
   */
  calculateConfidenceInterval(
    variant: EmailCampaignVariant,
    metric: 'open' | 'click' | 'conversion',
    confidenceLevel: number = 95,
  ): ConfidenceInterval {
    const successCount = this.getSuccessCount(variant, metric);
    const total = this.getTotalCount(variant, metric);

    if (total === 0) {
      return {
        rate: 0,
        lower: 0,
        upper: 0,
        margin: 0,
        sampleSize: 0,
      };
    }

    const rate = successCount / total;

    // Z-score for confidence level
    const zScore = this.getZScore(confidenceLevel);

    // Wilson score interval
    // More accurate than normal approximation, especially for small samples
    const denominator = 1 + (zScore * zScore) / total;
    const centre = (rate + (zScore * zScore) / (2 * total)) / denominator;
    const margin = (zScore / denominator) * Math.sqrt((rate * (1 - rate)) / total + (zScore * zScore) / (4 * total * total));

    const lower = Math.max(0, centre - margin);
    const upper = Math.min(1, centre + margin);

    return {
      rate: rate * 100,
      lower: lower * 100,
      upper: upper * 100,
      margin: margin * 100,
      sampleSize: total,
    };
  }

  /**
   * Calculate required sample size for a given effect size
   * 
   * @param baselineRate Expected baseline conversion rate (0-1)
   * @param minimumDetectableEffect Minimum effect size to detect (e.g., 0.1 = 10% relative increase)
   * @param confidenceLevel Confidence level (90, 95, or 99)
   * @param power Statistical power (typically 0.8 = 80%)
   * @returns Required sample size per variant
   */
  calculateRequiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    confidenceLevel: number = 95,
    power: number = 0.8,
  ): number {
    const zAlpha = this.getZScore(confidenceLevel);
    const zBeta = this.getZScore(power * 100);

    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minimumDetectableEffect);

    const pooledP = (p1 + p2) / 2;

    // Formula for sample size calculation
    const numerator = Math.pow(zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  }

  /**
   * Determine if enough time has passed to stop the test
   * 
   * @param startDate Test start date
   * @param durationHours Test duration in hours
   * @returns Whether test duration has elapsed
   */
  hasTestDurationElapsed(startDate: Date, durationHours: number): boolean {
    const now = new Date();
    const elapsedHours = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return elapsedHours >= durationHours;
  }

  /**
   * Calculate effect size (Cohen's h) between two variants
   * Measures practical significance (how big the difference is)
   * 
   * Cohen's h interpretation:
   * - 0.2: Small effect
   * - 0.5: Medium effect
   * - 0.8: Large effect
   */
  calculateEffectSize(variant1: EmailCampaignVariant, variant2: EmailCampaignVariant, metric: 'open' | 'click' | 'conversion'): number {
    const p1 = this.getSuccessCount(variant1, metric) / this.getTotalCount(variant1, metric);
    const p2 = this.getSuccessCount(variant2, metric) / this.getTotalCount(variant2, metric);

    // Cohen's h = 2 * (arcsin(√p1) - arcsin(√p2))
    const cohensH = 2 * (Math.asin(Math.sqrt(p1)) - Math.asin(Math.sqrt(p2)));

    return Math.abs(cohensH);
  }

  /**
   * Get success count based on metric
   */
  private getSuccessCount(variant: EmailCampaignVariant, metric: 'open' | 'click' | 'conversion'): number {
    switch (metric) {
      case 'open':
        return variant.openedCount;
      case 'click':
        return variant.clickedCount;
      case 'conversion':
        return variant.conversionCount;
      default:
        return 0;
    }
  }

  /**
   * Get failure count based on metric
   */
  private getFailureCount(variant: EmailCampaignVariant, metric: 'open' | 'click' | 'conversion'): number {
    const total = this.getTotalCount(variant, metric);
    const success = this.getSuccessCount(variant, metric);
    return total - success;
  }

  /**
   * Get total count based on metric
   */
  private getTotalCount(variant: EmailCampaignVariant, metric: 'open' | 'click' | 'conversion'): number {
    switch (metric) {
      case 'open':
        return variant.sentCount; // Opens out of sent emails
      case 'click':
        return variant.openedCount; // Clicks out of opened emails
      case 'conversion':
        return variant.clickedCount; // Conversions out of clicked emails
      default:
        return 0;
    }
  }

  /**
   * Calculate p-value from chi-square statistic and degrees of freedom
   * 
   * Uses chi-square distribution lookup table approximation
   * For production, consider using a statistical library like jstat
   */
  private calculatePValue(chiSquare: number, df: number): number {
    // Chi-square critical values table (p-value thresholds)
    // Format: [df][p-value] = critical value
    const criticalValues: Record<number, Record<string, number>> = {
      1: { '0.10': 2.706, '0.05': 3.841, '0.01': 6.635, '0.001': 10.828 },
      2: { '0.10': 4.605, '0.05': 5.991, '0.01': 9.210, '0.001': 13.816 },
      3: { '0.10': 6.251, '0.05': 7.815, '0.01': 11.345, '0.001': 16.266 },
      4: { '0.10': 7.779, '0.05': 9.488, '0.01': 13.277, '0.001': 18.467 },
      5: { '0.10': 9.236, '0.05': 11.070, '0.01': 15.086, '0.001': 20.515 },
      6: { '0.10': 10.645, '0.05': 12.592, '0.01': 16.812, '0.001': 22.458 },
      7: { '0.10': 12.017, '0.05': 14.067, '0.01': 18.475, '0.001': 24.322 },
      8: { '0.10': 13.362, '0.05': 15.507, '0.01': 20.090, '0.001': 26.125 },
      9: { '0.10': 14.684, '0.05': 16.919, '0.01': 21.666, '0.001': 27.877 },
      10: { '0.10': 15.987, '0.05': 18.307, '0.01': 23.209, '0.001': 29.588 },
    };

    // Handle degrees of freedom outside table
    if (!criticalValues[df]) {
      // For df > 10, use approximation
      if (chiSquare > 20) return 0.001;
      if (chiSquare > 15) return 0.01;
      if (chiSquare > 10) return 0.05;
      return 0.10;
    }

    const cv = criticalValues[df];

    // Determine p-value range
    if (chiSquare >= cv['0.001']) return 0.001;
    if (chiSquare >= cv['0.01']) return 0.005; // Midpoint between 0.01 and 0.001
    if (chiSquare >= cv['0.05']) return 0.025; // Midpoint between 0.05 and 0.01
    if (chiSquare >= cv['0.10']) return 0.075; // Midpoint between 0.10 and 0.05
    return 0.15; // Not significant
  }

  /**
   * Get z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    // Common z-scores for confidence levels
    const zScores: Record<number, number> = {
      80: 1.282,
      85: 1.440,
      90: 1.645,
      95: 1.960,
      99: 2.576,
      99.9: 3.291,
    };

    return zScores[confidenceLevel] || 1.96; // Default to 95%
  }
}
