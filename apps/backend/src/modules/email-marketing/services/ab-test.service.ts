import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailCampaign } from '../entities/email-campaign.entity';
import { EmailCampaignVariant, VariantStatus } from '../entities/email-campaign-variant.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { CreateAbTestDto, SendAbTestDto, UpdateVariantDto } from '../dto/ab-test.dto';
import { AbTestStatisticsService } from './ab-test-statistics.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { Organization } from '../../organizations/entities/organization.entity';

/**
 * A/B Test Service
 * Manages creation, execution, and analysis of email campaign A/B tests
 */
@Injectable()
export class AbTestService {
  private readonly logger = new Logger(AbTestService.name);

  constructor(
    @InjectRepository(EmailCampaign)
    private campaignRepo: Repository<EmailCampaign>,
    @InjectRepository(EmailCampaignVariant)
    private variantRepo: Repository<EmailCampaignVariant>,
    @InjectRepository(Subscriber)
    private subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Organization)
    private organizationRepo: Repository<Organization>,
    private statsService: AbTestStatisticsService,
    private tenantService: TenantService,
  ) { }

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Create a new A/B test for a campaign
   */
  async createAbTest(dto: CreateAbTestDto): Promise<EmailCampaign> {
    this.logger.log(`Creating A/B test for campaign ${dto.campaignId}`);

    const tenantId = this.getActiveTenantId();
    // 1. Validate campaign exists and is not already an A/B test
    const campaign = await this.campaignRepo.findOne({
      where: { id: dto.campaignId, tenantId },
      relations: ['variants'],
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    if (campaign.isAbTest && campaign.variants?.length > 0) {
      throw new BadRequestException('Campaign already has an A/B test configured');
    }

    // 2. Validate split percentages sum to 100
    const totalSplit = dto.variants.reduce((sum, v) => sum + v.splitPercentage, 0);
    if (Math.abs(totalSplit - 100) > 0.01) {
      throw new BadRequestException(
        `Split percentages must sum to 100% (current total: ${totalSplit.toFixed(2)}%)`,
      );
    }

    // 3. Validate variant labels are unique
    const labels = dto.variants.map((v) => v.label);
    const uniqueLabels = new Set(labels);
    if (labels.length !== uniqueLabels.size) {
      throw new BadRequestException('Variant labels must be unique');
    }

    // 4. Validate variant labels are valid (A-E)
    const validLabels = ['A', 'B', 'C', 'D', 'E'];
    const invalidLabels = labels.filter((l) => !validLabels.includes(l));
    if (invalidLabels.length > 0) {
      throw new BadRequestException(`Invalid variant labels: ${invalidLabels.join(', ')}. Must be A-E.`);
    }

    // 5. Update campaign with A/B test configuration
    campaign.isAbTest = true;
    campaign.testType = dto.testType;
    campaign.winnerCriteria = dto.winnerCriteria;
    campaign.autoSelectWinner = dto.autoSelectWinner;
    campaign.testDuration = dto.testDuration;
    campaign.confidenceLevel = dto.confidenceLevel;
    campaign.minSampleSize = dto.minSampleSize;
    campaign.testStatus = 'draft';

    await this.campaignRepo.save(campaign);

    // 6. Create variants
    const variants = dto.variants.map((variantDto) =>
      this.variantRepo.create({
        campaignId: campaign.id,
        variantLabel: variantDto.label,
        subject: variantDto.subject || campaign.subject,
        content: variantDto.content || campaign.content,
        fromName: variantDto.fromName,
        sendTimeOffset: variantDto.sendTimeOffset || 0,
        splitPercentage: variantDto.splitPercentage,
        status: VariantStatus.DRAFT,
      }),
    );

    await this.variantRepo.save(variants);

    this.logger.log(`Created A/B test with ${variants.length} variants for campaign ${campaign.id}`);

    // 7. Return campaign with variants
    const result = await this.campaignRepo.findOne({
      where: { id: campaign.id, tenantId },
      relations: ['variants'],
    });

    if (!result) {
      throw new Error(`Campaign ${campaign.id} not found after creation`);
    }

    return result;
  }

  /**
   * Update a variant's content
   */
  async updateVariant(campaignId: string, variantId: string, dto: UpdateVariantDto): Promise<EmailCampaignVariant> {
    const tenantId = this.getActiveTenantId();
    const variant = await this.variantRepo.findOne({
      where: { id: variantId, campaignId, tenantId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    // Only allow updates if variant is still in draft/testing status
    if (variant.status === VariantStatus.WINNER || variant.status === VariantStatus.LOSER) {
      throw new BadRequestException('Cannot update variant after test is completed');
    }

    // Update fields
    if (dto.subject !== undefined) variant.subject = dto.subject;
    if (dto.content !== undefined) variant.content = dto.content;
    if (dto.fromName !== undefined) variant.fromName = dto.fromName;
    if (dto.splitPercentage !== undefined) {
      // Validate total split percentage still equals 100%
      const allVariants = await this.variantRepo.find({ where: { campaignId, tenantId } });
      const otherVariantsTotal = allVariants
        .filter(v => v.id !== variantId)
        .reduce((sum, v) => sum + v.splitPercentage, 0);
      const newTotal = otherVariantsTotal + dto.splitPercentage;

      if (Math.abs(newTotal - 100) > 0.01) {
        throw new BadRequestException(
          `Split percentages must sum to 100% (current total with update: ${newTotal.toFixed(2)}%)`
        );
      }

      variant.splitPercentage = dto.splitPercentage;
    }

    return this.variantRepo.save(variant);
  }

  /**
   * Get A/B test results with statistical analysis
   */
  async getAbTestResults(campaignId: string) {
    const tenantId = this.getActiveTenantId();
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, tenantId },
      relations: ['variants'],
    });

    if (!campaign || !campaign.isAbTest) {
      throw new NotFoundException('A/B test not found for this campaign');
    }

    if (!campaign.variants || campaign.variants.length === 0) {
      throw new BadRequestException('No variants found for this A/B test');
    }

    // Calculate rates for each variant (will be done in entity lifecycle hooks)
    const variantsWithStats = campaign.variants.map((v) => {
      v.calculateRates(); // Ensure rates are up-to-date
      return {
        id: v.id,
        label: v.variantLabel,
        status: v.status,
        subject: v.subject,
        content: v.content,
        fromName: v.fromName,
        splitPercentage: v.splitPercentage,
        sentCount: v.sentCount,
        openedCount: v.openedCount,
        clickedCount: v.clickedCount,
        conversionCount: v.conversionCount,
        revenue: v.revenue,
        bounceCount: v.bounceCount,
        unsubscribeCount: v.unsubscribeCount,
        openRate: v.openRate || 0,
        clickRate: v.clickRate || 0,
        conversionRate: v.conversionRate || 0,
      };
    });

    // Determine which metric to use for statistical analysis
    const metricMap = {
      open_rate: 'open',
      click_rate: 'click',
      conversion_rate: 'conversion',
      revenue: 'conversion', // Use conversion count for revenue-based tests
    };
    const metric = metricMap[campaign.winnerCriteria] || 'open';

    // Perform statistical analysis
    const statistics = this.statsService.calculateChiSquare(
      campaign.variants,
      metric as 'open' | 'click' | 'conversion',
    );

    // Check if minimum sample size reached
    const hasMinSample = this.statsService.hasMinimumSampleSize(
      campaign.variants,
      campaign.minSampleSize,
    );

    // Calculate confidence intervals for each variant
    const confidenceIntervals = campaign.variants.map((v) => ({
      label: v.variantLabel,
      interval: this.statsService.calculateConfidenceInterval(
        v,
        metric as 'open' | 'click' | 'conversion',
        campaign.confidenceLevel,
      ),
    }));

    // Check if test duration has elapsed
    const testDurationElapsed = campaign.sentAt
      ? this.statsService.hasTestDurationElapsed(campaign.sentAt, campaign.testDuration)
      : false;

    // Determine if we can declare a winner
    const canDeclareWinner =
      hasMinSample && statistics.isSignificant && testDurationElapsed;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        testType: campaign.testType,
        winnerCriteria: campaign.winnerCriteria,
        testStatus: campaign.testStatus,
        autoSelectWinner: campaign.autoSelectWinner,
        winnerSelectionDate: campaign.winnerSelectionDate,
        selectedWinnerId: campaign.selectedWinnerId,
        testDuration: campaign.testDuration,
        confidenceLevel: campaign.confidenceLevel,
        minSampleSize: campaign.minSampleSize,
        sentAt: campaign.sentAt,
      },
      variants: variantsWithStats,
      statistics: {
        ...statistics,
        hasMinimumSample: hasMinSample,
        testDurationElapsed,
        canDeclareWinner,
      },
      confidenceIntervals,
    };
  }

  /**
   * Manually select a winner for the A/B test
   */
  async selectWinner(campaignId: string, variantId: string): Promise<EmailCampaign> {
    const tenantId = this.getActiveTenantId();
    this.logger.log(`Selecting winner for campaign ${campaignId}: variant ${variantId}`);

    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, tenantId },
      relations: ['variants'],
    });

    if (!campaign || !campaign.isAbTest) {
      throw new NotFoundException('A/B test not found');
    }

    const winner = campaign.variants.find((v) => v.id === variantId);
    if (!winner) {
      throw new NotFoundException('Variant not found');
    }

    // Update variant statuses
    for (const variant of campaign.variants) {
      variant.status = variant.id === variantId ? VariantStatus.WINNER : VariantStatus.LOSER;
      await this.variantRepo.save(variant);
    }

    // Update campaign with winner
    campaign.selectedWinnerId = variantId;
    campaign.winnerSelectionDate = new Date();
    campaign.testStatus = 'completed';

    // Apply winner's content to campaign
    campaign.subject = winner.subject;
    campaign.content = winner.content;

    await this.campaignRepo.save(campaign);

    this.logger.log(`Winner selected for campaign ${campaign.id}: Variant ${winner.variantLabel}`);

    return campaign;
  }

  /**
   * Send A/B test - distribute variants to subscribers
   */
  async sendAbTest(dto: SendAbTestDto) {
    const tenantId = this.getActiveTenantId();
    this.logger.log(`Sending email marketing A/B test for campaign ${dto.campaignId}`);

    const campaign = await this.campaignRepo.findOne({
      where: { id: dto.campaignId, tenantId },
      relations: ['variants'],
    });

    if (!campaign || !campaign.isAbTest) {
      throw new NotFoundException('A/B test not found');
    }

    if (!campaign.variants || campaign.variants.length === 0) {
      throw new BadRequestException('No variants configured for this A/B test');
    }

    // Get subscribers
    let subscribers: Subscriber[];

    if (dto.subscriberIds && dto.subscriberIds.length > 0) {
      // Use specified subscribers
      subscribers = await this.subscriberRepo.find({
        where: { id: In(dto.subscriberIds), status: 'active', tenantId } as any,
      });
    } else if (dto.segmentIds && dto.segmentIds.length > 0) {
      // NOTE: Segment-based subscriber retrieval planned for future release
      // Currently returns clear error message to users
      throw new BadRequestException('Segment-based sending not yet implemented');
    } else {
      // Use all active subscribers
      subscribers = await this.subscriberRepo.find({
        where: { status: 'active', tenantId } as any,
      });
    }

    if (subscribers.length === 0) {
      throw new BadRequestException('No active subscribers found');
    }

    // Shuffle subscribers for randomization
    const shuffled = this.shuffleArray([...subscribers]);

    // Distribute subscribers to variants based on split percentage
    const distributions = this.distributeToVariants(shuffled, campaign.variants);

    // Update variant statuses to TESTING
    for (const variant of campaign.variants) {
      variant.status = VariantStatus.TESTING;
      await this.variantRepo.save(variant);
    }

    // Update campaign status
    campaign.testStatus = 'testing';
    campaign.sentAt = new Date();
    await this.campaignRepo.save(campaign);

    this.logger.log(`A/B test started for campaign ${campaign.id}. Total recipients: ${subscribers.length}`);

    // Return distribution summary
    return {
      message: 'A/B test sending initiated',
      totalRecipients: subscribers.length,
      distributions: distributions.map((d) => ({
        variantLabel: d.variant.variantLabel,
        variantId: d.variant.id,
        recipientCount: d.subscribers.length,
        splitPercentage: d.variant.splitPercentage,
      })),
      campaign: {
        id: campaign.id,
        name: campaign.name,
        testStatus: campaign.testStatus,
        sentAt: campaign.sentAt,
      },
    };

    // Note: Actual email sending would be handled by email queue/service
    // This method just sets up the test and distribution
  }

  /**
   * Auto-select winner based on statistical significance
   * Runs as a cron job every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoSelectWinners() {
    this.logger.debug('Running auto-select winners cron job');

    const activeOrganizations = await this.organizationRepo.find({ where: { isActive: true } });

    for (const org of activeOrganizations) {
      await this.tenantService.runWithTenant({ tenantId: org.slug, source: 'system' }, async () => {
        // Find all testing campaigns with auto-select enabled for this tenant
        const testingCampaigns = await this.campaignRepo.find({
          where: {
            isAbTest: true,
            autoSelectWinner: true,
            testStatus: 'testing',
            tenantId: org.slug,
          },
          relations: ['variants'],
        });

        if (testingCampaigns.length === 0) {
          return;
        }

        this.logger.log(`Found ${testingCampaigns.length} campaigns to check for auto-select for tenant ${org.slug}`);

        for (const campaign of testingCampaigns) {
          try {
            // Check if test duration has passed
            if (!campaign.sentAt) continue;

            const testDurationElapsed = this.statsService.hasTestDurationElapsed(
              campaign.sentAt,
              campaign.testDuration,
            );

            if (!testDurationElapsed) {
              continue;
            }

            // Get test results
            const results = await this.getAbTestResults(campaign.id);

            // Auto-select if we can declare a winner
            if (results.statistics.canDeclareWinner && results.statistics.winner) {
              const winnerVariant = campaign.variants.find(
                (v) => v.variantLabel === results.statistics.winner,
              );

              if (winnerVariant) {
                await this.selectWinner(campaign.id, winnerVariant.id);
                this.logger.log(
                  `Auto-selected winner for campaign ${campaign.id}: Variant ${results.statistics.winner}`,
                );
              }
            }
          } catch (error) {
            this.logger.error(`Error auto-selecting winner for campaign ${campaign.id}:`, error);
          }
        }
      });
    }
  }

  /**
   * Get A/B test summary for a campaign
   */
  async getAbTestSummary(campaignId: string) {
    const tenantId = this.getActiveTenantId();
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, tenantId },
      relations: ['variants', 'selectedWinner'],
    });

    if (!campaign || !campaign.isAbTest) {
      throw new NotFoundException('A/B test not found');
    }

    return {
      id: campaign.id,
      name: campaign.name,
      testType: campaign.testType,
      winnerCriteria: campaign.winnerCriteria,
      testStatus: campaign.testStatus,
      variantCount: campaign.variants?.length || 0,
      hasWinner: campaign.hasWinner(),
      winner: campaign.selectedWinner
        ? {
          id: campaign.selectedWinner.id,
          label: campaign.selectedWinner.variantLabel,
          subject: campaign.selectedWinner.subject,
        }
        : null,
      winnerSelectionDate: campaign.winnerSelectionDate,
      sentAt: campaign.sentAt,
      testDuration: campaign.testDuration,
    };
  }

  /**
   * Delete an A/B test (and all its variants)
   */
  async deleteAbTest(campaignId: string): Promise<void> {
    const tenantId = this.getActiveTenantId();
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, tenantId },
      relations: ['variants'],
    });

    if (!campaign || !campaign.isAbTest) {
      throw new NotFoundException('A/B test not found');
    }

    // Cannot delete if test is already sent
    if (campaign.testStatus === 'testing' || campaign.testStatus === 'completed') {
      throw new BadRequestException('Cannot delete A/B test that has been sent');
    }

    // Delete variants (cascade will handle this, but being explicit)
    await this.variantRepo.remove(campaign.variants);

    // Reset campaign A/B test fields
    campaign.isAbTest = false;
    campaign.testType = '' as any;
    campaign.winnerCriteria = '' as any;
    campaign.autoSelectWinner = true;
    campaign.winnerSelectionDate = new Date() as any;
    campaign.selectedWinnerId = '' as any;
    campaign.testDuration = 0 as any;
    campaign.testStatus = 'draft';

    await this.campaignRepo.save(campaign);

    this.logger.log(`Deleted A/B test for campaign ${campaignId}`);
  }

  /**
   * Distribute subscribers to variants based on split percentages
   */
  private distributeToVariants(
    subscribers: Subscriber[],
    variants: EmailCampaignVariant[],
  ): Array<{ variant: EmailCampaignVariant; subscribers: Subscriber[] }> {
    const distributions: Array<{ variant: EmailCampaignVariant; subscribers: Subscriber[] }> = [];
    let currentIndex = 0;

    // Sort variants by label to ensure consistent distribution
    const sortedVariants = [...variants].sort((a, b) => a.variantLabel.localeCompare(b.variantLabel));

    for (let i = 0; i < sortedVariants.length; i++) {
      const variant = sortedVariants[i];
      let count: number;

      // For the last variant, assign all remaining subscribers
      if (i === sortedVariants.length - 1) {
        count = subscribers.length - currentIndex;
      } else {
        count = Math.floor(subscribers.length * (variant.splitPercentage / 100));
      }

      const assigned = subscribers.slice(currentIndex, currentIndex + count);
      currentIndex += count;

      distributions.push({ variant, subscribers: assigned });
    }

    return distributions;
  }

  /**
   * Fisher-Yates shuffle algorithm for randomization
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
