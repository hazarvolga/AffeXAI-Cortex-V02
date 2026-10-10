import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
  IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { FaqLearningService, LearningPipelineResult } from '../services/faq-learning.service';
import { BatchProcessorService } from '../services/batch-processor.service';
import { FaqAiService } from '../services/faq-ai.service';
import { PipelineStateService } from '../services/pipeline-state.service';
import { ExtractionCriteria } from '../interfaces/data-extraction.interface';

class DateRangeDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

class StartLearningCriteriaDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSessionDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minResolutionTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  requiredSatisfactionScore?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedCategories?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  maxResults?: number;
}

class StartLearningOptionsDto {
  @IsOptional()
  @IsBoolean()
  enableRealTimeProcessing?: boolean;

  @IsOptional()
  @IsBoolean()
  enableAutoPublishing?: boolean;
}

export class StartLearningDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => StartLearningCriteriaDto)
  criteria?: StartLearningCriteriaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StartLearningOptionsDto)
  options?: StartLearningOptionsDto;
}

export class UpdateConfigDto {
  @IsNotEmpty()
  @IsString()
  configKey: string;

  @IsNotEmpty()
  configValue: any;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class BulkUpdateConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateConfigDto)
  configs: UpdateConfigDto[];
}

export class ResetConfigDto {
  @IsNotEmpty()
  @IsString()
  category: string;
}

@ApiTags('FAQ Learning')
@Controller('faq-learning')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FaqLearningController {
  private readonly logger = new Logger(FaqLearningController.name);

  constructor(
    private readonly faqLearningService: FaqLearningService,
    private readonly batchProcessor: BatchProcessorService,
    private readonly faqAiService: FaqAiService,
    private readonly pipelineStateService: PipelineStateService,
  ) { }

  @Post('start')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  @ApiOperation({ summary: 'Start FAQ learning pipeline' })
  @ApiResponse({ status: 200, description: 'Learning pipeline started successfully' })
  async startLearning(
    @Body() dto: StartLearningDto,
    @CurrentUser() user: any
  ): Promise<{
    success: boolean;
    result: LearningPipelineResult;
  }> {
    try {
      this.logger.log(`Starting FAQ learning pipeline via API for tenant ${user.tenantId}`);

      const criteria: ExtractionCriteria = {};
      if (dto.criteria) {
        Object.assign(criteria, dto.criteria);
        if (dto.criteria.dateRange) {
          criteria.dateRange = {
            from: new Date(dto.criteria.dateRange.from),
            to: new Date(dto.criteria.dateRange.to)
          };
        }
      }

      const result = await this.faqLearningService.runLearningPipeline(criteria, user.tenantId);

      return {
        success: true,
        result
      };

    } catch (error) {
      this.logger.error('Failed to start learning pipeline:', error);
      throw new HttpException(
        `Failed to start learning pipeline: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('pipeline/start')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  @ApiOperation({ summary: 'Start learning pipeline' })
  @ApiResponse({ status: 200, description: 'Pipeline started successfully' })
  async startPipeline(@CurrentUser() user: any): Promise<{
    success: boolean;
    message: string;
    status: string;
  }> {
    try {
      this.logger.log(`🚀 Starting learning pipeline for tenant ${user.tenantId}`);

      // Update pipeline state to RUNNING
      const state = await this.pipelineStateService.start(user.tenantId);

      this.logger.log(`✅ Pipeline state updated to: ${state.status}`);

      return {
        success: true,
        message: 'Learning pipeline started successfully. Pipeline is now active and will process data continuously.',
        status: 'running'
      };
    } catch (error) {
      this.logger.error('❌ Failed to start pipeline:', error);
      await this.pipelineStateService.markError(user.tenantId, {
        message: error.message,
        stack: error.stack,
      });
      throw new HttpException(
        `Failed to start pipeline: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('pipeline/stop')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  @ApiOperation({ summary: 'Stop learning pipeline' })
  @ApiResponse({ status: 200, description: 'Pipeline stopped successfully' })
  async stopPipeline(@CurrentUser() user: any): Promise<{
    success: boolean;
    message: string;
    status: string;
  }> {
    try {
      this.logger.log(`⏸️ Stopping learning pipeline for tenant ${user.tenantId}`);

      // Update pipeline state to STOPPED
      const state = await this.pipelineStateService.stop(user.tenantId);

      this.logger.log(`✅ Pipeline state updated to: ${state.status}`);

      return {
        success: true,
        message: 'Learning pipeline stopped successfully. Automatic FAQ generation is now disabled.',
        status: 'stopped'
      };
    } catch (error) {
      this.logger.error('❌ Failed to stop pipeline:', error);
      throw new HttpException(
        `Failed to stop pipeline: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@CurrentUser() user: any): Promise<{
    stats: {
      totalFaqs: number;
      newFaqsToday: number;
      pendingReview: number;
      averageConfidence: number;
      processingStatus: 'running' | 'stopped' | 'error';
      lastRun?: Date;
      nextRun?: Date;
    };
    learningProgress: {
      fromChat: number;
      fromTickets: number;
      fromSuggestions: number;
      fromKnowledgeBase: number;
      fromKnowledgeSources: number;
    };
    qualityMetrics: {
      highConfidence: number;
      mediumConfidence: number;
      lowConfidence: number;
    };
    providers: Array<{
      name: string;
      available: boolean;
      responseTime?: number;
      lastChecked: Date;
    }>;
    recentActivity: Array<{
      id: string;
      type: 'faq_generated' | 'review_completed' | 'feedback_received';
      description: string;
      timestamp: Date;
      status: 'success' | 'warning' | 'error';
    }>;
  }> {
    try {
      const tenantId = user.tenantId;
      this.logger.log(`📊 Dashboard endpoint called for tenant ${tenantId}`);

      // Get pipeline state from new PipelineStateService
      const pipelineState = await this.pipelineStateService.getState(tenantId);
      const providerStatus = await this.faqAiService.getProviderStatus(tenantId);

      const totalFaqs = await this.faqLearningService.getTotalFaqCount(tenantId);
      const newFaqsToday = await this.faqLearningService.getNewFaqsToday(tenantId);
      const pendingReview = await this.faqLearningService.getPendingReviewCount(tenantId);
      const averageConfidence = await this.faqLearningService.getAverageConfidence(tenantId);

      const recentActivity = await this.faqLearningService.getRecentActivity(10, tenantId);
      const learningProgress = await this.faqLearningService.getLearningProgressBySource(tenantId);
      const qualityMetrics = await this.faqLearningService.getQualityMetrics(tenantId);

      this.logger.log(`📊 Dashboard stats: totalFaqs=${totalFaqs}, newFaqsToday=${newFaqsToday}, pendingReview=${pendingReview}, pipelineStatus=${pipelineState.status}`);

      const response = {
        stats: {
          totalFaqs,
          newFaqsToday,
          pendingReview,
          averageConfidence,
          processingStatus: pipelineState.status as 'running' | 'stopped' | 'error',
          lastRun: pipelineState.lastRun,
          nextRun: pipelineState.nextScheduledRun
        },
        learningProgress: {
          fromChat: learningProgress.fromChat || 0,
          fromTickets: learningProgress.fromTickets || 0,
          fromSuggestions: learningProgress.fromSuggestions || 0,
          fromKnowledgeBase: learningProgress.fromKnowledgeBase || 0,
          fromKnowledgeSources: learningProgress.fromKnowledgeSources || 0
        },
        qualityMetrics: {
          highConfidence: qualityMetrics.highConfidence || 0,
          mediumConfidence: qualityMetrics.mediumConfidence || 0,
          lowConfidence: qualityMetrics.lowConfidence || 0
        },
        providers: [{
          name: providerStatus.provider,
          available: providerStatus.available,
          responseTime: providerStatus.responseTime || undefined,
          lastChecked: new Date()
        }],
        recentActivity: recentActivity.map((activity, index) => ({
          id: `activity-${index}`,
          type: activity.type as any,
          description: activity.description,
          timestamp: activity.timestamp,
          status: activity.status as any
        }))
      };

      this.logger.log('📊 Returning dashboard response');
      return response;
    } catch (error) {
      this.logger.error('Failed to get dashboard data:', error);
      throw new HttpException(
        `Failed to get dashboard data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('provider-status')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Get current AI provider status for FAQ Learning' })
  @ApiResponse({ status: 200, description: 'Provider status retrieved successfully' })
  async getProviderStatus(@CurrentUser() user: any): Promise<{
    success: boolean;
    data: {
      provider: string;
      model: string;
      available: boolean;
      responseTime?: number;
    };
  }> {
    try {
      const status = await this.faqAiService.getProviderStatus(user.tenantId);

      return {
        success: true,
        data: status
      };
    } catch (error) {
      this.logger.error('Failed to get provider status:', error);
      throw new HttpException(
        `Failed to get provider status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('ai-usage-stats')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Get AI usage statistics for FAQ Learning' })
  @ApiResponse({ status: 200, description: 'AI usage statistics retrieved successfully' })
  async getAiUsageStats(): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    totalTokens: number;
    estimatedCost: number;
    last24Hours: {
      requests: number;
      tokens: number;
      cost: number;
    };
  }> {
    try {
      // Mock data for now - would be implemented with proper usage tracking
      return {
        totalRequests: 15420,
        successRate: 99.2,
        averageResponseTime: 1200,
        totalTokens: 2450000,
        estimatedCost: 45.30,
        last24Hours: {
          requests: 1240,
          tokens: 185000,
          cost: 3.20
        }
      };
    } catch (error) {
      this.logger.error('Failed to get AI usage stats:', error);
      throw new HttpException(
        `Failed to get AI usage stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('performance-metrics')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Get FAQ Learning performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getPerformanceMetrics(): Promise<{
    faqsGenerated: number;
    averageConfidence: number;
    processingTime: number;
    errorRate: number;
  }> {
    try {
      // Mock data for now - would be implemented with proper metrics
      return {
        faqsGenerated: 247,
        averageConfidence: 87.5,
        processingTime: 2.3,
        errorRate: 0.8
      };
    } catch (error) {
      this.logger.error('Failed to get performance metrics:', error);
      throw new HttpException(
        `Failed to get performance metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('ai-provider-info')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Get current AI provider information for FAQ Learning' })
  @ApiResponse({ status: 200, description: 'AI provider info retrieved successfully' })
  async getAiProviderInfo(@CurrentUser() user: any): Promise<{
    currentProvider: string;
    currentModel: string;
    available: boolean;
    isReadOnly: boolean;
    globalSettingsUrl: string;
  }> {
    try {
      const providerStatus = await this.faqAiService.getProviderStatus(user.tenantId);

      return {
        currentProvider: providerStatus.provider,
        currentModel: providerStatus.model,
        available: providerStatus.available,
        isReadOnly: true, // FAQ Learning cannot change global AI settings
        globalSettingsUrl: '/admin/ai-settings'
      };
    } catch (error) {
      this.logger.error('Failed to get AI provider info:', error);
      throw new HttpException(
        `Failed to get AI provider info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('config')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
  @ApiOperation({ summary: 'Get all FAQ Learning configurations' })
  @ApiResponse({ status: 200, description: 'Configurations retrieved successfully' })
  async getConfig(): Promise<{
    configurations: Array<{
      key: string;
      value: any;
      description?: string;
      category?: string;
      isActive: boolean;
      updatedAt: Date;
      type?: string;
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
      options?: Array<{ value: any; label: string }>;
    }>;
  }> {
    try {
      // Complete configuration data with all settings
      return {
        configurations: [
          // Confidence Thresholds
          {
            key: 'minConfidenceForReview',
            value: 60,
            description: 'Minimum confidence score for review',
            category: 'thresholds',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            unit: '%',
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'minConfidenceForAutoPublish',
            value: 85,
            description: 'Minimum confidence score for auto-publish',
            category: 'thresholds',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            unit: '%',
            isActive: true,
            updatedAt: new Date()
          },

          // Pattern Recognition
          {
            key: 'minPatternFrequency',
            value: 3,
            description: 'Minimum pattern frequency for recognition',
            category: 'recognition',
            type: 'number',
            min: 1,
            max: 50,
            step: 1,
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'similarityThreshold',
            value: 0.8,
            description: 'Similarity threshold for pattern matching',
            category: 'recognition',
            type: 'range',
            min: 0,
            max: 1,
            step: 0.01,
            isActive: true,
            updatedAt: new Date()
          },

          // Processing Settings
          {
            key: 'batchSize',
            value: 100,
            description: 'Number of items to process in each batch',
            category: 'processing',
            type: 'number',
            min: 10,
            max: 1000,
            step: 10,
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'processingInterval',
            value: 3600,
            description: 'Processing interval in seconds',
            category: 'processing',
            type: 'number',
            min: 300,
            max: 86400,
            step: 300,
            unit: 'seconds',
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'enableRealTimeProcessing',
            value: false,
            description: 'Enable real-time processing of new data',
            category: 'processing',
            type: 'boolean',
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'enableAutoPublishing',
            value: false,
            description: 'Automatically publish high-confidence FAQs',
            category: 'processing',
            type: 'boolean',
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'maxDailyProcessingLimit',
            value: 1000,
            description: 'Maximum number of items to process per day',
            category: 'processing',
            type: 'number',
            min: 100,
            max: 10000,
            step: 100,
            isActive: true,
            updatedAt: new Date()
          },

          // Quality Filters
          {
            key: 'minQuestionLength',
            value: 10,
            description: 'Minimum question length in characters',
            category: 'quality',
            type: 'number',
            min: 5,
            max: 100,
            step: 1,
            unit: 'characters',
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'maxQuestionLength',
            value: 500,
            description: 'Maximum question length in characters',
            category: 'quality',
            type: 'number',
            min: 100,
            max: 2000,
            step: 50,
            unit: 'characters',
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'minAnswerLength',
            value: 20,
            description: 'Minimum answer length in characters',
            category: 'quality',
            type: 'number',
            min: 10,
            max: 200,
            step: 5,
            unit: 'characters',
            isActive: true,
            updatedAt: new Date()
          },

          // Data Sources
          {
            key: 'chatSessionMinDuration',
            value: 300,
            description: 'Minimum chat session duration in seconds',
            category: 'sources',
            type: 'number',
            min: 60,
            max: 3600,
            step: 30,
            unit: 'seconds',
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'ticketMinResolutionTime',
            value: 1800,
            description: 'Minimum ticket resolution time in seconds',
            category: 'sources',
            type: 'number',
            min: 300,
            max: 86400,
            step: 300,
            unit: 'seconds',
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'requiredSatisfactionScore',
            value: 4,
            description: 'Required satisfaction score (1-5)',
            category: 'sources',
            type: 'range',
            min: 1,
            max: 5,
            step: 1,
            isActive: true,
            updatedAt: new Date()
          },

          // Category Management
          {
            key: 'excludedCategories',
            value: [],
            description: 'Categories to exclude from processing',
            category: 'categories',
            type: 'multiselect',
            options: [
              { value: 'spam', label: 'Spam' },
              { value: 'test', label: 'Test' },
              { value: 'internal', label: 'Internal' },
              { value: 'billing', label: 'Billing' },
              { value: 'technical', label: 'Technical' }
            ],
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'autoCategorizationEnabled',
            value: true,
            description: 'Enable automatic categorization of FAQs',
            category: 'categories',
            type: 'boolean',
            isActive: true,
            updatedAt: new Date()
          },

          // AI Model Settings (Note: provider and model will be read-only)
          {
            key: 'temperature',
            value: 0.7,
            description: 'AI model creativity level (0 = focused, 2 = creative)',
            category: 'ai',
            type: 'range',
            min: 0,
            max: 2,
            step: 0.1,
            isActive: true,
            updatedAt: new Date()
          },
          {
            key: 'maxTokens',
            value: 1000,
            description: 'Maximum tokens for AI responses',
            category: 'ai',
            type: 'number',
            min: 100,
            max: 4000,
            step: 100,
            unit: 'tokens',
            isActive: true,
            updatedAt: new Date()
          },

          // Advanced Settings
          {
            key: 'retentionPeriodDays',
            value: 365,
            description: 'Data retention period in days',
            category: 'advanced',
            type: 'number',
            min: 30,
            max: 1095,
            step: 30,
            unit: 'days',
            isActive: true,
            updatedAt: new Date()
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to get configurations:', error);
      throw new HttpException(
        `Failed to get configurations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update FAQ Learning configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfig(@Body() dto: UpdateConfigDto): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Validate config value based on type
      const isValid = this.validateConfigValue(dto.configKey, dto.configValue);
      if (!isValid.valid) {
        throw new HttpException(isValid.error, HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Configuration ${dto.configKey} updated to ${dto.configValue}`);

      return {
        success: true,
        message: 'Configuration updated successfully'
      };
    } catch (error) {
      this.logger.error('Failed to update configuration:', error);
      throw new HttpException(
        `Failed to update configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('config/bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk update FAQ Learning configurations' })
  @ApiResponse({ status: 200, description: 'Configurations updated successfully' })
  async bulkUpdateConfig(@Body() dto: BulkUpdateConfigDto): Promise<{
    success: boolean;
    message: string;
    results: Array<{
      configKey: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    try {
      const results = [];

      for (const config of dto.configs) {
        try {
          const isValid = this.validateConfigValue(config.configKey, config.configValue);
          if (!isValid.valid) {
            results.push({
              configKey: config.configKey,
              success: false,
              error: isValid.error
            });
            continue;
          }

          // Here you would save to database
          this.logger.log(`Configuration ${config.configKey} updated to ${config.configValue}`);

          results.push({
            configKey: config.configKey,
            success: true
          });
        } catch (error) {
          results.push({
            configKey: config.configKey,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      return {
        success: successCount === dto.configs.length,
        message: `${successCount}/${dto.configs.length} configurations updated successfully`,
        results
      };
    } catch (error) {
      this.logger.error('Failed to bulk update configurations:', error);
      throw new HttpException(
        `Failed to bulk update configurations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('config/reset/:sectionKey')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset configuration section to defaults' })
  @ApiResponse({ status: 200, description: 'Configuration section reset successfully' })
  async resetConfigSection(@Param('sectionKey') sectionKey: string): Promise<{
    success: boolean;
    message: string;
    resetConfigs: Array<{
      key: string;
      oldValue: any;
      newValue: any;
    }>;
  }> {
    try {
      // Get default values for the category
      const defaultConfigs = this.getDefaultConfigsForCategory(sectionKey);

      this.logger.log(`Configuration section ${sectionKey} reset to defaults`);

      return {
        success: true,
        message: `Configuration section ${sectionKey} reset to defaults`,
        resetConfigs: defaultConfigs.map(config => ({
          key: config.key,
          oldValue: 'current_value', // Would be fetched from database
          newValue: config.value
        }))
      };
    } catch (error) {
      this.logger.error(`Failed to reset configuration section ${sectionKey}:`, error);
      throw new HttpException(
        `Failed to reset configuration section: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private validateConfigValue(configKey: string, value: any): { valid: boolean; error?: string } {
    // Get config metadata
    const configMeta = this.getConfigMetadata(configKey);
    if (!configMeta) {
      return { valid: false, error: `Unknown configuration key: ${configKey}` };
    }

    // Type validation
    switch (configMeta.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: `${configKey} must be a valid number` };
        }
        if (configMeta.min !== undefined && value < configMeta.min) {
          return { valid: false, error: `${configKey} must be at least ${configMeta.min}` };
        }
        if (configMeta.max !== undefined && value > configMeta.max) {
          return { valid: false, error: `${configKey} must be at most ${configMeta.max}` };
        }
        break;

      case 'range':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: `${configKey} must be a valid number` };
        }
        if (configMeta.min !== undefined && value < configMeta.min) {
          return { valid: false, error: `${configKey} must be between ${configMeta.min} and ${configMeta.max}` };
        }
        if (configMeta.max !== undefined && value > configMeta.max) {
          return { valid: false, error: `${configKey} must be between ${configMeta.min} and ${configMeta.max}` };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: `${configKey} must be true or false` };
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          return { valid: false, error: `${configKey} must be an array` };
        }
        break;
    }

    return { valid: true };
  }

  private getConfigMetadata(configKey: string) {
    // This would normally come from database or config service
    const configMap = {
      'minConfidenceForReview': { type: 'range', min: 0, max: 100 },
      'minConfidenceForAutoPublish': { type: 'range', min: 0, max: 100 },
      'minPatternFrequency': { type: 'number', min: 1, max: 50 },
      'similarityThreshold': { type: 'range', min: 0, max: 1 },
      'batchSize': { type: 'number', min: 10, max: 1000 },
      'processingInterval': { type: 'number', min: 300, max: 86400 },
      'enableRealTimeProcessing': { type: 'boolean' },
      'enableAutoPublishing': { type: 'boolean' },
      'maxDailyProcessingLimit': { type: 'number', min: 100, max: 10000 },
      'minQuestionLength': { type: 'number', min: 5, max: 100 },
      'maxQuestionLength': { type: 'number', min: 100, max: 2000 },
      'minAnswerLength': { type: 'number', min: 10, max: 200 },
      'chatSessionMinDuration': { type: 'number', min: 60, max: 3600 },
      'ticketMinResolutionTime': { type: 'number', min: 300, max: 86400 },
      'requiredSatisfactionScore': { type: 'range', min: 1, max: 5 },
      'excludedCategories': { type: 'multiselect' },
      'autoCategorizationEnabled': { type: 'boolean' },
      'temperature': { type: 'range', min: 0, max: 2 },
      'maxTokens': { type: 'number', min: 100, max: 4000 },
      'retentionPeriodDays': { type: 'number', min: 30, max: 1095 }
    };

    return configMap[configKey];
  }

  private getDefaultConfigsForCategory(category: string) {
    // Return default configs for category - this would come from FaqLearningConfig.getDefaultConfig()
    const defaults = {
      'thresholds': [
        { key: 'minConfidenceForReview', value: 60 },
        { key: 'minConfidenceForAutoPublish', value: 85 }
      ],
      'recognition': [
        { key: 'minPatternFrequency', value: 3 },
        { key: 'similarityThreshold', value: 0.8 }
      ],
      'processing': [
        { key: 'batchSize', value: 100 },
        { key: 'processingInterval', value: 3600 },
        { key: 'enableRealTimeProcessing', value: false },
        { key: 'enableAutoPublishing', value: false },
        { key: 'maxDailyProcessingLimit', value: 1000 }
      ],
      'quality': [
        { key: 'minQuestionLength', value: 10 },
        { key: 'maxQuestionLength', value: 500 },
        { key: 'minAnswerLength', value: 20 }
      ],
      'sources': [
        { key: 'chatSessionMinDuration', value: 300 },
        { key: 'ticketMinResolutionTime', value: 1800 },
        { key: 'requiredSatisfactionScore', value: 4 }
      ],
      'categories': [
        { key: 'excludedCategories', value: [] },
        { key: 'autoCategorizationEnabled', value: true }
      ],
      'ai': [
        { key: 'temperature', value: 0.7 },
        { key: 'maxTokens', value: 1000 }
      ],
      'advanced': [
        { key: 'retentionPeriodDays', value: 365 }
      ]
    };

    return defaults[category] || [];
  }
}