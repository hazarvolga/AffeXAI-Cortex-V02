import { TenantService } from '../../../core/tenant/tenant.service';
import { requireFaqTenant } from './faq-review-policy';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { LearnedFaqEntry, FaqEntryStatus, FaqEntrySource } from '../entities/learned-faq-entry.entity';
import { LearningPattern } from '../entities/learning-pattern.entity';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { ChatDataExtractorService } from './chat-data-extractor.service';
import { TicketDataExtractorService } from './ticket-data-extractor.service';
import { DataNormalizerService } from './data-normalizer.service';
import { PatternRecognitionService } from './pattern-recognition.service';
import { FaqAiService } from './faq-ai.service';
import { ConfidenceCalculatorService } from './confidence-calculator.service';
import { BatchProcessorService } from './batch-processor.service';
import { PipelineStateService } from './pipeline-state.service';
import { ExtractionCriteria } from '../interfaces/data-extraction.interface';
import { StrategyService } from '../../strategy/services/strategy.service';


export interface LearningPipelineResult {
  processedItems: number;
  newFaqs: number;
  updatedPatterns: number;
  errors: string[];
  processingTime: number;
  status: 'completed' | 'partial' | 'failed';
}

export interface PipelineConfig {
  enableRealTimeProcessing: boolean;
  batchSize: number;
  processingInterval: number;
  maxDailyProcessingLimit: number;
  enableAutoPublishing: boolean;
  retentionPeriodDays?: number; // Add optional property
}

@Injectable()
export class FaqLearningService {
  private readonly logger = new Logger(FaqLearningService.name);
  // Removed singleton state properties in favor of DB-backed PipelineStateService per tenant

  constructor(
    @InjectRepository(LearnedFaqEntry)
    private faqRepository: Repository<LearnedFaqEntry>,
    @InjectRepository(LearningPattern)
    private patternRepository: Repository<LearningPattern>,
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
    private chatExtractor: ChatDataExtractorService,
    private ticketExtractor: TicketDataExtractorService,
    private dataNormalizer: DataNormalizerService,
    private patternRecognition: PatternRecognitionService,
    private faqAiService: FaqAiService,
    private confidenceCalculator: ConfidenceCalculatorService,
    private batchProcessor: BatchProcessorService,

    private pipelineStateService: PipelineStateService,
    private strategyService: StrategyService, // Reviewed publication delivery belongs to the durable outbox.
    private readonly tenantService:TenantService,
  ) { }

  async runLearningPipeline(criteria: ExtractionCriteria = {}, tenantId: string): Promise<LearningPipelineResult> {
    if(requireFaqTenant(this.tenantService)!==tenantId)throw new Error('Tenant mismatch');
    const isRunning = await this.pipelineStateService.isRunning(tenantId);
    if (isRunning) {
      throw new Error('Learning pipeline is already running for this tenant');
    }

    const startTime = Date.now();
    // Start pipeline tracking in DB
    await this.pipelineStateService.start(tenantId);

    const result: LearningPipelineResult = {
      processedItems: 0,
      newFaqs: 0,
      updatedPatterns: 0,
      errors: [],
      processingTime: 0,
      status: 'completed'
    };

    try {
      this.logger.log(`Starting FAQ learning pipeline for tenant ${tenantId}`);

      // Check daily processing limit
      const config = await this.getPipelineConfig(tenantId);
      if (!await this.checkDailyLimit(config, tenantId)) {
        throw new Error('Daily processing limit reached');
      }

      // Step 1: Extract data from chat and tickets
      // Pass tenantId to extractData (assuming extractors will be updated or accept criteria with tenant filter - actually extractors likely need refactor too but let's pass it for now via criteria injection if needed)
      // For now, we assume extractData uses the services which (hopefully) will be tenant aware or we pass tenantId via criteria
      const extractionCriteria = { ...criteria, tenantId }; // Ensure tenant context
      const extractedData = await this.extractData(extractionCriteria, config);
      result.processedItems = extractedData.length;

      if (extractedData.length === 0) {
        this.logger.log(`No new data to process for tenant ${tenantId}`);
        await this.pipelineStateService.stop(tenantId);
        return result;
      }

      // Step 2: Normalize and clean data
      const normalizedData = await this.normalizeData(extractedData);

      // Step 3: Identify patterns
      const patterns = await this.identifyPatterns(normalizedData, tenantId);
      result.updatedPatterns = patterns.length;

      // Step 4: Generate FAQs
      const newFaqs = await this.generateFaqs(normalizedData, patterns, tenantId);
      result.newFaqs = newFaqs.length;

      // Step 5: Save results
      await this.saveResults(newFaqs, patterns, tenantId);

      // Update processing statistics
      await this.updateProcessingStats(result, tenantId);
      await this.pipelineStateService.incrementTotalFaqs(tenantId, result.newFaqs);
      await this.pipelineStateService.incrementDailyCount(tenantId);

      this.logger.log(`Learning pipeline completed: ${result.newFaqs} new FAQs, ${result.updatedPatterns} patterns`);

    } catch (error) {
      this.logger.error('Learning pipeline failed:', error);
      result.errors.push(error.message);
      result.status = 'failed';
    } finally {
      result.processingTime = Date.now() - startTime;
      await this.pipelineStateService.stop(tenantId); // Always release lock
    }

    return result;
  }

  // Disabled global cron in multi-tenant mode
  // @Cron(CronExpression.EVERY_HOUR)
  async scheduledLearning(tenantId?: string): Promise<void> {
    if (!tenantId) {
      this.logger.warn('Scheduled learning called without tenantId - skipping in multi-tenant mode');
      return;
    }
    try {
      const config = await this.getPipelineConfig(tenantId);

      if (!config.enableRealTimeProcessing) {
        return;
      }

      const criteria: ExtractionCriteria = {
        dateRange: {
          from: new Date(Date.now() - 3600000), // Last hour
          to: new Date()
        },
        maxResults: config.batchSize,
        // tenantId is passed via argument
      };

      await this.runLearningPipeline(criteria, tenantId);
    } catch (error) {
      this.logger.error('Scheduled learning failed:', error);
    }
  }

  // Daily reset handled by PipelineStateService or per-tenant job
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyCounters(tenantId?: string): Promise<void> {
    if (tenantId) {
      await this.pipelineStateService.resetDailyCount(tenantId);
      this.logger.log(`Daily processing counters reset for tenant ${tenantId}`);
    }
  }

  async processRealTimeData(sourceType: 'chat' | 'ticket', sourceId: string, tenantId: string): Promise<void> {
    if(requireFaqTenant(this.tenantService)!==tenantId)throw new Error('Tenant mismatch');
    try {
      const config = await this.getPipelineConfig(tenantId);

      if (!config.enableRealTimeProcessing) {
        return;
      }

      this.logger.log(`Processing real-time data: ${sourceType}:${sourceId}`);

      // Extract single item
      const criteria: ExtractionCriteria = {
        maxResults: 1,
        tenantId,
        sourceIds:[sourceId]
      };

      let extractedData;
      if (sourceType === 'chat') {
        extractedData = await this.chatExtractor.extract(criteria);
      } else {
        extractedData = await this.ticketExtractor.extract(criteria);
      }

      const relevantData = extractedData.filter(d => d.id === sourceId);

      if (relevantData.length === 0) {
        return;
      }

      // Process single item through pipeline
      const normalizedData = await this.normalizeData(relevantData);
      const patterns = await this.identifyPatterns(normalizedData, tenantId);
      const newFaqs = await this.generateFaqs(normalizedData, patterns, tenantId);

      await this.saveResults(newFaqs, patterns, tenantId);

      this.logger.log(`Real-time processing completed for ${sourceType}:${sourceId}`);
    } catch (error) {
      this.logger.error(`Real-time processing failed for ${sourceType}:${sourceId}:`, error);
    }
  }

  async getPipelineStatus(tenantId: string): Promise<{
    isProcessing: boolean;
    dailyProcessingCount: number;
    lastRun?: Date;
    nextScheduledRun?: Date;
  }> {
    const state = await this.pipelineStateService.getState(tenantId);

    return {
      isProcessing: state.status === 'running',
      dailyProcessingCount: state.dailyProcessingCount,
      lastRun: state.lastRun,
      nextScheduledRun: state.nextScheduledRun
    };
  }

  private async extractData(criteria: ExtractionCriteria, config: PipelineConfig): Promise<any[]> {
    const batchCriteria = {
      ...criteria,
      maxResults: criteria.maxResults || config.batchSize
    };

    // Extract from both sources in parallel
    const [chatData, ticketData] = await Promise.all([
      this.chatExtractor.extract(batchCriteria).catch(error => {
        this.logger.warn('Chat extraction failed:', error);
        return [];
      }),
      this.ticketExtractor.extract(batchCriteria).catch(error => {
        this.logger.warn('Ticket extraction failed:', error);
        return [];
      })
    ]);

    return [...chatData, ...ticketData];
  }

  private async normalizeData(extractedData: any[]): Promise<any[]> {
    const normalizedData = [];

    for (const data of extractedData) {
      try {
        const normalized = await this.dataNormalizer.normalize(data);
        normalizedData.push(normalized);
      } catch (error) {
        this.logger.warn(`Failed to normalize data ${data.id}:`, error);
      }
    }

    return normalizedData;
  }

  private async identifyPatterns(normalizedData: any[], tenantId: string): Promise<any[]> {
    try {
      const patternData = normalizedData.map(d => ({
        id: d.id || crypto.randomUUID(),
        sourceId: d.sourceId,
        source: d.source,
        question: d.question,
        answer: d.answer || '',
        context: d.context,
        confidence: d.confidence || 50,
        keywords: d.keywords || [],
        category: d.category || 'General',
        extractedAt: d.extractedAt || new Date(),
        sessionDuration: d.sessionDuration,
        satisfactionScore: d.satisfactionScore,
        metadata: {
          timestamp: d.extractedAt || new Date(),
          ...d.metadata
        }
      }));

      return await this.patternRecognition.identifyPatterns(patternData, tenantId);
    } catch (error) {
      this.logger.error('Pattern identification failed:', error);
      return [];
    }
  }

  private async generateFaqs(normalizedData: any[], patterns: any[], tenantId: string): Promise<LearnedFaqEntry[]> {
    if(requireFaqTenant(this.tenantService)!==tenantId)throw new Error('Tenant mismatch');
    const faqs: LearnedFaqEntry[] = [];
    const config = await this.getPipelineConfig(tenantId);

    for (const data of normalizedData) {
      try {
        // Find relevant patterns
        const relevantPatterns = patterns.filter(p =>
          p.sources.some(s => s.id === data.sourceId)
        );

        // Calculate confidence
        const patternFrequency = relevantPatterns.length > 0 ?
          Math.max(...relevantPatterns.map(p => p.frequency)) : 1;

        const confidenceResult = await this.confidenceCalculator.calculateConfidence(
          data,
          patternFrequency
        );

        // Generate AI answer if confidence is sufficient
        if (confidenceResult.overallConfidence >= 50) {
          const aiResponse = await this.faqAiService.generateFaqAnswer({
            context: `Question: ${data.question}\nContext: ${data.context}`,
            questionPattern: data.question,
            category: data.category
          }, tenantId);

          const faq = new LearnedFaqEntry();
          faq.question = data.question;
          faq.answer = aiResponse.answer;
          faq.confidence = confidenceResult.overallConfidence;
          faq.status = FaqEntryStatus.PENDING_REVIEW;
          faq.source = data.source as FaqEntrySource;
          faq.sourceId = data.sourceId;
          faq.category = aiResponse.category || data.category;
          faq.keywords = aiResponse.keywords;
          faq.metadata = {
            ...data.metadata,
            confidenceFactors: confidenceResult.factors,
            aiMetadata: aiResponse.metadata
          };

          faq.tenantId = tenantId; // Set tenant
          faqs.push(faq);
        }
      } catch (error) {
        this.logger.warn(`Failed to generate FAQ for ${data.sourceId}:`, error);
      }
    }

    return faqs;
  }

  private async saveResults(faqs: LearnedFaqEntry[], patterns: any[], tenantId: string): Promise<void> {
    if(requireFaqTenant(this.tenantService)!==tenantId || faqs.some(faq=>faq.tenantId!==tenantId || Boolean(faq.id)))throw new Error('Tenant mismatch');
    if(faqs.length>0){
      // Ingestion creates proposals only. Publication is an explicit review transaction.
      const pending=faqs.map(faq=>Object.assign(new LearnedFaqEntry(),faq,{status:FaqEntryStatus.PENDING_REVIEW,reviewedBy:null,reviewedAt:null,publishedAt:null}));
      await this.faqRepository.save(pending);
    }
    // No direct Cortex emission: only a durable reviewed-publication event may deliver answers.

    // Save or update patterns
    for (const patternData of patterns) {
      try {
        const existingPattern = await this.patternRepository.findOne({
          where: { patternHash: patternData.patternHash, tenantId }
        });

        if (existingPattern) {
          existingPattern.frequency += 1;
          existingPattern.sources = [...existingPattern.sources, ...patternData.sources];
          await this.patternRepository.save(existingPattern);
        } else {
          const newPattern = this.patternRepository.create({ ...patternData, tenantId });
          await this.patternRepository.save(newPattern);
        }
      } catch (error) {
        this.logger.warn('Failed to save pattern:', error);
      }
    }
  }

  private async checkDailyLimit(config: PipelineConfig, tenantId: string): Promise<boolean> {
    const state = await this.pipelineStateService.getState(tenantId);

    // Reset if day changed (basic check, better handled by cron)
    const lastRun = state.lastRun || new Date();
    const today = new Date();
    if (lastRun.toDateString() !== today.toDateString()) {
      // Ideally we'd reset here or rely on cron. 
      // For safety, we trust the DB state.
    }

    return state.dailyProcessingCount < config.maxDailyProcessingLimit;
  }

  private async getPipelineConfig(tenantId: string): Promise<PipelineConfig> {
    try {
      const configs = await this.configRepository.find({
        where: [
          { configKey: 'advanced_settings', tenantId },
          { configKey: 'data_processing', tenantId }
        ]
      });

      const advancedSettings = configs.find(c => c.configKey === 'advanced_settings')?.configValue || {};
      const dataProcessing = configs.find(c => c.configKey === 'data_processing')?.configValue || {};

      return {
        enableRealTimeProcessing: advancedSettings.enableRealTimeProcessing || false,
        batchSize: dataProcessing.batchSize || 100,
        processingInterval: dataProcessing.processingInterval || 3600,
        maxDailyProcessingLimit: advancedSettings.maxDailyProcessingLimit || 1000,
        enableAutoPublishing: advancedSettings.enableAutoPublishing || false
      };
    } catch (error) {
      this.logger.error('Failed to load pipeline config:', error);
      return {
        enableRealTimeProcessing: false,
        batchSize: 100,
        processingInterval: 3600,
        maxDailyProcessingLimit: 1000,
        enableAutoPublishing: false
      };
    }
  }

  private async updateProcessingStats(result: LearningPipelineResult, tenantId: string): Promise<void> {
    try {
      const statusConfig = await this.configRepository.findOne({
        where: { configKey: 'system_status', tenantId }
      });

      if (statusConfig) {
        const currentStats = statusConfig.configValue;
        statusConfig.configValue = {
          ...currentStats,
          lastProcessingRun: new Date(),
          totalFaqsGenerated: (currentStats.totalFaqsGenerated || 0) + result.newFaqs,
          totalPatternsIdentified: (currentStats.totalPatternsIdentified || 0) + result.updatedPatterns
        };

        await this.configRepository.save(statusConfig);
      }
    } catch (error) {
      this.logger.error('Failed to update processing stats:', error);
    }
  }

  private async getSystemStatus(): Promise<any> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'system_status' }
      });

      return config?.configValue || {};
    } catch (error) {
      this.logger.error('Failed to get system status:', error);
      return {};
    }
  }

  // Dashboard Statistics Methods
  async getTotalFaqCount(tenantId: string): Promise<number> {
    try {
      return await this.faqRepository.count({
        where: { status: FaqEntryStatus.PUBLISHED, tenantId }
      });
    } catch (error) {
      this.logger.error('Failed to get total FAQ count:', error);
      return 0;
    }
  }

  async getNewFaqsToday(tenantId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return await this.faqRepository.count({
        where: {
          createdAt: new Date(today.getTime()) as any,
          status: FaqEntryStatus.PUBLISHED,
          tenantId
        }
      });
    } catch (error) {
      this.logger.error('Failed to get new FAQs today:', error);
      return 0;
    }
  }

  async getPendingReviewCount(tenantId: string): Promise<number> {
    try {
      return await this.faqRepository.count({
        where: { status: FaqEntryStatus.PENDING_REVIEW, tenantId }
      });
    } catch (error) {
      this.logger.error('Failed to get pending review count:', error);
      return 0;
    }
  }

  async getAverageConfidence(tenantId: string): Promise<number> {
    try {
      const result = await this.faqRepository
        .createQueryBuilder('faq')
        .select('AVG(faq.confidence)', 'avg')
        .where('faq.status = :status', { status: FaqEntryStatus.PUBLISHED })
        .andWhere('faq.tenantId = :tenantId', { tenantId })
        .getRawOne();

      return result?.avg ? Math.round(parseFloat(result.avg)) : 0;
    } catch (error) {
      this.logger.error('Failed to get average confidence:', error);
      return 0;
    }
  }

  async getRecentActivity(limit: number = 10, tenantId: string): Promise<Array<{
    type: string;
    description: string;
    timestamp: Date;
    status: string;
  }>> {
    try {
      const recentFaqs = await this.faqRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: limit
      });

      return recentFaqs.map(faq => ({
        type: 'faq_generated',
        description: `Yeni FAQ oluşturuldu: "${faq.question}"`,
        timestamp: faq.createdAt,
        status: faq.status === FaqEntryStatus.PUBLISHED ? 'success' : 'warning'
      }));
    } catch (error) {
      this.logger.error('Failed to get recent activity:', error);
      return [];
    }
  }

  /**
   * Get learning progress by source (last 7 days)
   */
  async getLearningProgressBySource(tenantId: string): Promise<{
    fromChat: number;
    fromTickets: number;
    fromSuggestions: number;
    fromKnowledgeBase: number;
    fromKnowledgeSources: number;
  }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [chatCount, ticketCount, suggestionCount, kbCount, sourceCount] = await Promise.all([
        this.faqRepository.count({
          where: {
            source: FaqEntrySource.CHAT,
            createdAt: sevenDaysAgo as any,
            tenantId
          }
        }),
        this.faqRepository.count({
          where: {
            source: FaqEntrySource.TICKET,
            createdAt: sevenDaysAgo as any,
            tenantId
          }
        }),
        this.faqRepository.count({
          where: {
            source: FaqEntrySource.USER_SUGGESTION,
            createdAt: sevenDaysAgo as any,
            tenantId
          }
        }),
        this.faqRepository.count({
          where: {
            source: FaqEntrySource.KNOWLEDGE_BASE,
            createdAt: sevenDaysAgo as any,
            tenantId
          }
        }),
        this.faqRepository.count({
          where: {
            source: FaqEntrySource.KNOWLEDGE_SOURCE,
            createdAt: sevenDaysAgo as any,
            tenantId
          }
        })
      ]);

      return {
        fromChat: chatCount,
        fromTickets: ticketCount,
        fromSuggestions: suggestionCount,
        fromKnowledgeBase: kbCount,
        fromKnowledgeSources: sourceCount
      };
    } catch (error) {
      this.logger.error('Failed to get learning progress by source:', error);
      return {
        fromChat: 0,
        fromTickets: 0,
        fromSuggestions: 0,
        fromKnowledgeBase: 0,
        fromKnowledgeSources: 0
      };
    }
  }

  /**
   * Get quality metrics (confidence distribution)
   */
  async getQualityMetrics(tenantId: string): Promise<{
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  }> {
    try {
      const allFaqs = await this.faqRepository.find({
        select: ['confidence'],
        where: { tenantId }
      });

      const highConfidence = allFaqs.filter(faq => faq.confidence >= 85).length;
      const mediumConfidence = allFaqs.filter(faq => faq.confidence >= 60 && faq.confidence < 85).length;
      const lowConfidence = allFaqs.filter(faq => faq.confidence < 60).length;

      return {
        highConfidence,
        mediumConfidence,
        lowConfidence
      };
    } catch (error) {
      this.logger.error('Failed to get quality metrics:', error);
      return {
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0
      };
    }
  }
}