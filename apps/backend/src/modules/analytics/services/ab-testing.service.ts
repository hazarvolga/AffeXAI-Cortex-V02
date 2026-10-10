import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ABTest, ABTestVariant, ABTestStatus } from '../entities';
import { CreateABTestDto, UpdateABTestDto } from '../dto';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class ABTestingService {
  constructor(
    @InjectRepository(ABTest)
    private readonly abTestRepository: Repository<ABTest>,
    @InjectRepository(ABTestVariant)
    private readonly variantRepository: Repository<ABTestVariant>,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Create a new A/B test
   */
  async createTest(dto: CreateABTestDto): Promise<ABTest> {
    const tenantId = this.tenantService.getTenantId();
    // Create test
    const test = this.abTestRepository.create({
      ...dto,
      periodStart: new Date(dto.periodStart),
      periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
      tenantId,
    });

    const savedTest = await this.abTestRepository.save(test);

    // Create variants
    const variants = dto.variants.map((v) =>
      this.variantRepository.create({
        testId: savedTest.id,
        name: v.name,
        description: v.description || null,
        componentConfig: v.componentConfig,
        trafficAllocation: v.trafficAllocation,
      }),
    );

    await this.variantRepository.save(variants);

    return this.getTestById(savedTest.id);
  }

  /**
   * Get all tests
   */
  async getAllTests(status?: ABTestStatus): Promise<ABTest[]> {
    const tenantId = this.tenantService.getTenantId();
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.abTestRepository.find({
      where,
      relations: ['variants'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get test by ID
   */
  async getTestById(id: string): Promise<ABTest> {
    const tenantId = this.tenantService.getTenantId();
    const where: any = { id };
    where.tenantId = tenantId;

    const test = await this.abTestRepository.findOne({
      where,
      relations: ['variants'],
    });

    if (!test) {
      throw new NotFoundException(`A/B Test with ID ${id} not found`);
    }

    return test;
  }

  /**
   * Update test
   */
  async updateTest(id: string, dto: UpdateABTestDto): Promise<ABTest> {
    const test = await this.getTestById(id);

    if (dto.name) test.name = dto.name;
    if (dto.description !== undefined) test.description = dto.description;
    if (dto.status) test.status = dto.status;
    if (dto.periodEnd) test.periodEnd = new Date(dto.periodEnd);
    if (dto.winnerVariantId) test.winnerVariantId = dto.winnerVariantId;
    if (dto.confidenceLevel) test.confidenceLevel = dto.confidenceLevel;

    await this.abTestRepository.save(test);

    return this.getTestById(id);
  }

  /**
   * Delete test
   */
  async deleteTest(id: string): Promise<void> {
    const test = await this.getTestById(id);
    await this.abTestRepository.remove(test);
  }

  /**
   * Start test (change status to running)
   */
  async startTest(id: string): Promise<ABTest> {
    return this.updateTest(id, { status: ABTestStatus.RUNNING });
  }

  /**
   * Pause test
   */
  async pauseTest(id: string): Promise<ABTest> {
    return this.updateTest(id, { status: ABTestStatus.PAUSED });
  }

  /**
   * Complete test
   */
  async completeTest(id: string, winnerVariantId?: string): Promise<ABTest> {
    const updates: UpdateABTestDto = {
      status: ABTestStatus.COMPLETED,
      periodEnd: new Date().toISOString(),
    };

    if (winnerVariantId) {
      updates.winnerVariantId = winnerVariantId;
    }

    return this.updateTest(id, updates);
  }

  /**
   * Track variant impression
   */
  async trackImpression(variantId: string): Promise<void> {
    await this.variantRepository.increment(
      { id: variantId, tenantId: this.tenantService.getTenantId() },
      'impressions',
      1,
    );
  }

  /**
   * Track variant interaction
   */
  async trackInteraction(variantId: string): Promise<void> {
    await this.variantRepository.increment(
      { id: variantId, tenantId: this.tenantService.getTenantId() },
      'interactions',
      1,
    );
  }

  /**
   * Track variant conversion
   */
  async trackConversion(variantId: string, engagementTime?: number): Promise<void> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, tenantId: this.tenantService.getTenantId() },
    });

    if (!variant) return;

    // Increment conversion count
    variant.conversions += 1;

    // Update conversion rate
    if (variant.impressions > 0) {
      variant.conversionRate = variant.conversions / variant.impressions;
    }

    // Update average engagement time if provided
    if (engagementTime) {
      const totalTime = variant.averageEngagementTime * (variant.conversions - 1);
      variant.averageEngagementTime = (totalTime + engagementTime) / variant.conversions;
    }

    await this.variantRepository.save(variant);

    // Update test statistical significance
    await this.updateStatisticalSignificance(variant.testId);
  }

  /**
   * Calculate and update statistical significance
   */
  private async updateStatisticalSignificance(testId: string): Promise<void> {
    const test = await this.getTestById(testId);

    if (test.variants.length < 2) return;

    // Sort variants by conversion rate
    const sortedVariants = [...test.variants].sort(
      (a, b) => b.conversionRate - a.conversionRate,
    );

    const best = sortedVariants[0];
    const secondBest = sortedVariants[1];

    // Simple z-test for proportions
    const p1 = best.conversionRate;
    const p2 = secondBest.conversionRate;
    const n1 = best.impressions;
    const n2 = secondBest.impressions;

    if (n1 < 30 || n2 < 30) {
      // Not enough sample size
      test.confidenceLevel = 0;
      test.sampleSize = n1 + n2;
      await this.abTestRepository.save(test);
      return;
    }

    // Pooled proportion
    const p = (best.conversions + secondBest.conversions) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));

    if (se === 0) {
      test.confidenceLevel = 0;
      test.sampleSize = n1 + n2;
      await this.abTestRepository.save(test);
      return;
    }

    // Z-score
    const z = Math.abs(p1 - p2) / se;

    // Convert z-score to confidence level (simplified)
    // z > 1.96 = 95% confidence
    // z > 2.58 = 99% confidence
    let confidenceLevel = 0;
    if (z > 2.58) {
      confidenceLevel = 99;
    } else if (z > 1.96) {
      confidenceLevel = 95;
    } else if (z > 1.645) {
      confidenceLevel = 90;
    } else if (z > 1.28) {
      confidenceLevel = 80;
    } else {
      confidenceLevel = Math.min(75, z * 50);
    }

    test.confidenceLevel = confidenceLevel;
    test.sampleSize = n1 + n2;

    await this.abTestRepository.save(test);
  }

  /**
   * Get variant for user (traffic allocation logic)
   */
  async getVariantForUser(testId: string): Promise<ABTestVariant | null> {
    const test = await this.getTestById(testId);

    if (test.status !== ABTestStatus.RUNNING) {
      return null;
    }

    // Random number 0-100
    const random = Math.random() * 100;
    let cumulative = 0;

    // Select variant based on traffic allocation
    for (const variant of test.variants) {
      cumulative += variant.trafficAllocation;
      if (random <= cumulative) {
        return variant;
      }
    }

    // Fallback to first variant
    return test.variants[0] || null;
  }
}
