import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatDataExtractorService } from './chat-data-extractor.service';
import { TicketDataExtractorService } from './ticket-data-extractor.service';
import { DataNormalizerService } from './data-normalizer.service';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { ExtractedData, ExtractionCriteria } from '../interfaces/data-extraction.interface';

export interface BatchProcessingResult {
  totalProcessed: number;
  chatDataExtracted: number;
  ticketDataExtracted: number;
  totalExtracted: number;
  averageConfidence: number;
  processingTimeMs: number;
  errors: string[];
}

export interface BatchProcessingOptions {
  batchSize?: number;
  includeChat?: boolean;
  includeTickets?: boolean;
  criteria?: ExtractionCriteria;
  maxConcurrency?: number;
}

@Injectable()
export class BatchProcessorService {
  private readonly logger = new Logger(BatchProcessorService.name);

  constructor(
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
    private chatExtractor: ChatDataExtractorService,
    private ticketExtractor: TicketDataExtractorService,
    private dataNormalizer: DataNormalizerService,
  ) { }

  /**
   * Process data in batches for learning
   */
  async processBatch(tenantId: string, options: BatchProcessingOptions = {}): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    this.logger.log(`Starting batch processing for FAQ learning (Tenant: ${tenantId})`);

    try {
      // Get configuration
      const config = await this.getProcessingConfig(tenantId);
      const batchSize = options.batchSize || config.batchSize || 100;
      const maxConcurrency = options.maxConcurrency || 3;

      // Prepare extraction criteria
      const criteria = await this.buildExtractionCriteria(tenantId, options.criteria);

      let chatDataExtracted = 0;
      let ticketDataExtracted = 0;
      const allExtractedData: ExtractedData[] = [];

      // Process chat data if enabled
      if (options.includeChat !== false) {
        try {
          this.logger.log('Processing chat data...');
          const chatData = await this.processChatDataInBatches(criteria, batchSize, maxConcurrency);
          chatDataExtracted = chatData.length;
          allExtractedData.push(...chatData);
          this.logger.log(`Extracted ${chatDataExtracted} items from chat data`);
        } catch (error) {
          const errorMsg = `Chat data processing failed: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // Process ticket data if enabled
      if (options.includeTickets !== false) {
        try {
          this.logger.log('Processing ticket data...');
          const ticketData = await this.processTicketDataInBatches(criteria, batchSize, maxConcurrency);
          ticketDataExtracted = ticketData.length;
          allExtractedData.push(...ticketData);
          this.logger.log(`Extracted ${ticketDataExtracted} items from ticket data`);
        } catch (error) {
          const errorMsg = `Ticket data processing failed: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // Calculate statistics
      const totalExtracted = allExtractedData.length;
      const averageConfidence = totalExtracted > 0
        ? allExtractedData.reduce((sum, item) => sum + item.confidence, 0) / totalExtracted
        : 0;

      const processingTimeMs = Date.now() - startTime;

      const result: BatchProcessingResult = {
        totalProcessed: chatDataExtracted + ticketDataExtracted,
        chatDataExtracted,
        ticketDataExtracted,
        totalExtracted,
        averageConfidence: Math.round(averageConfidence),
        processingTimeMs,
        errors,
      };

      this.logger.log(`Batch processing completed in ${processingTimeMs}ms`, result);

      // Update processing statistics
      await this.updateProcessingStats(result, tenantId);

      return result;

    } catch (error) {
      const errorMsg = `Batch processing failed: ${error.message}`;
      this.logger.error(errorMsg);
      errors.push(errorMsg);

      return {
        totalProcessed: 0,
        chatDataExtracted: 0,
        ticketDataExtracted: 0,
        totalExtracted: 0,
        averageConfidence: 0,
        processingTimeMs: Date.now() - startTime,
        errors,
      };
    }
  }

  /**
   * Process specific source IDs in batch
   */
  async processSpecificSources(
    tenantId: string,
    chatSessionIds: string[] = [],
    ticketIds: string[] = [],
    criteria?: ExtractionCriteria
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const extractionCriteria = await this.buildExtractionCriteria(tenantId, criteria);
      const allExtractedData: ExtractedData[] = [];

      // Process specific chat sessions
      let chatDataExtracted = 0;
      if (chatSessionIds.length > 0) {
        try {
          const chatData = await this.chatExtractor.extract(extractionCriteria);
          chatDataExtracted = chatData.length;
          allExtractedData.push(...chatData);
        } catch (error) {
          errors.push(`Chat processing failed: ${error.message}`);
        }
      }

      // Process specific tickets
      let ticketDataExtracted = 0;
      if (ticketIds.length > 0) {
        try {
          const ticketData = await this.ticketExtractor.extractFromIds(ticketIds, extractionCriteria);
          ticketDataExtracted = ticketData.length;
          allExtractedData.push(...ticketData);
        } catch (error) {
          errors.push(`Ticket processing failed: ${error.message}`);
        }
      }

      const totalExtracted = allExtractedData.length;
      const averageConfidence = totalExtracted > 0
        ? allExtractedData.reduce((sum, item) => sum + item.confidence, 0) / totalExtracted
        : 0;

      return {
        totalProcessed: chatSessionIds.length + ticketIds.length,
        chatDataExtracted,
        ticketDataExtracted,
        totalExtracted,
        averageConfidence: Math.round(averageConfidence),
        processingTimeMs: Date.now() - startTime,
        errors,
      };

    } catch (error) {
      return {
        totalProcessed: 0,
        chatDataExtracted: 0,
        ticketDataExtracted: 0,
        totalExtracted: 0,
        averageConfidence: 0,
        processingTimeMs: Date.now() - startTime,
        errors: [error.message],
      };
    }
  }

  /**
   * Get processing configuration
   */
  private async getProcessingConfig(tenantId: string): Promise<any> {
    const configs = await this.configRepository.find({
      where: { isActive: true, tenantId }
    });

    const configMap = configs.reduce((acc, config) => {
      acc[config.configKey] = config.configValue;
      return acc;
    }, {} as any);

    return {
      batchSize: configMap.data_processing?.batchSize || 100,
      maxConcurrency: configMap.data_processing?.maxConcurrency || 3,
      ...configMap
    };
  }

  /**
   * Build extraction criteria from config and options
   */
  private async buildExtractionCriteria(tenantId: string, criteria?: ExtractionCriteria): Promise<ExtractionCriteria> {
    const config = await this.getProcessingConfig(tenantId);

    return {
      minSessionDuration: config.source_preferences?.chatSessionMinDuration || 300,
      minResolutionTime: config.source_preferences?.ticketMinResolutionTime || 1800,
      requiredSatisfactionScore: config.source_preferences?.requiredSatisfactionScore || 4,
      excludedCategories: config.categorization?.excludedCategories || [],
      maxAge: config.advanced_settings?.retentionPeriodDays || 365,
      tenantId, // Ensure tenantId is passed to extractors
      ...criteria, // Override with provided criteria
    };
  }

  /**
   * Process chat data in batches with concurrency control
   */
  private async processChatDataInBatches(
    criteria: ExtractionCriteria,
    batchSize: number,
    maxConcurrency: number
  ): Promise<ExtractedData[]> {
    // For now, process all at once - in production, implement proper batching
    return this.chatExtractor.extract(criteria);
  }

  /**
   * Process ticket data in batches with concurrency control
   */
  private async processTicketDataInBatches(
    criteria: ExtractionCriteria,
    batchSize: number,
    maxConcurrency: number
  ): Promise<ExtractedData[]> {
    // For now, process all at once - in production, implement proper batching
    return this.ticketExtractor.extract(criteria);
  }

  /**
   * Update processing statistics in config
   */
  private async updateProcessingStats(result: BatchProcessingResult, tenantId: string): Promise<void> {
    try {
      const statusConfig = await this.configRepository.findOne({
        where: { configKey: 'system_status', tenantId }
      });

      if (statusConfig) {
        const currentStats = statusConfig.configValue as any;
        statusConfig.configValue = {
          ...currentStats,
          lastProcessingRun: new Date().toISOString(),
          totalFaqsGenerated: (currentStats.totalFaqsGenerated || 0) + result.totalExtracted,
          lastProcessingResult: {
            totalExtracted: result.totalExtracted,
            averageConfidence: result.averageConfidence,
            processingTimeMs: result.processingTimeMs,
            errors: result.errors.length,
          }
        };

        await this.configRepository.save(statusConfig);
      }
    } catch (error) {
      this.logger.error('Failed to update processing stats:', error);
    }
  }

  /**
   * Get processing status and statistics
   */
  async getProcessingStatus(tenantId: string): Promise<{
    isEnabled: boolean;
    lastRun: Date | null;
    totalProcessed: number;
    lastResult: any;
  }> {
    try {
      const statusConfig = await this.configRepository.findOne({
        where: { configKey: 'system_status', tenantId }
      });

      if (!statusConfig) {
        return {
          isEnabled: false,
          lastRun: null,
          totalProcessed: 0,
          lastResult: null,
        };
      }

      const stats = statusConfig.configValue as any;
      return {
        isEnabled: stats.isLearningEnabled || false,
        lastRun: stats.lastProcessingRun ? new Date(stats.lastProcessingRun) : null,
        totalProcessed: stats.totalFaqsGenerated || 0,
        lastResult: stats.lastProcessingResult || null,
      };
    } catch (error) {
      this.logger.error('Failed to get processing status:', error);
      return {
        isEnabled: false,
        lastRun: null,
        totalProcessed: 0,
        lastResult: null,
      };
    }
  }
}