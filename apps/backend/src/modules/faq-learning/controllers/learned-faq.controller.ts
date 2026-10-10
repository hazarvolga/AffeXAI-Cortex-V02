import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
  ParseUUIDPipe,
  Optional
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  Min,
  Max,
  MaxLength,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';
import { requireFaqReadTenant } from '../services/faq-review-policy';
import { Repository, Like, In, MoreThanOrEqual } from 'typeorm';
import { LearnedFaqEntry, FaqEntryStatus } from '../entities/learned-faq-entry.entity';
import { FeedbackProcessorService, FeedbackData } from '../services/feedback-processor.service';
import { FaqEnhancedSearchService } from '../services/faq-enhanced-search.service';

export class SearchFaqsDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  query?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  categories?: string; // comma-separated

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(['relevance', 'popularity', 'recent', 'helpful'])
  sort_by?: 'relevance' | 'popularity' | 'recent' | 'helpful';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  include_related?: boolean;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class FaqFeedbackDto {
  @IsNotEmpty()
  @IsEnum(['helpful', 'not_helpful', 'suggestion', 'correction'])
  feedbackType: 'helpful' | 'not_helpful' | 'suggestion' | 'correction';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number; // 1-5 scale

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  suggestedAnswer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  suggestedCategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suggestedKeywords?: string[];
}

export class FaqSearchResult {
  id: string;
  question: string;
  answer: string;
  category?: string;
  keywords: string[];
  usageCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulnessRatio: number;
  confidence: number;
  createdAt: Date;
  relatedFaqs?: Array<{
    id: string;
    question: string;
    similarity: number;
  }>;
}

@ApiTags('Learned FAQs (Public)')
@Controller('faqs')
export class LearnedFaqController {
  private readonly logger = new Logger(LearnedFaqController.name);

  constructor(
    @InjectRepository(LearnedFaqEntry)
    private faqRepository: Repository<LearnedFaqEntry>,
    private feedbackProcessor: FeedbackProcessorService,
    private faqEnhancedSearchService: FaqEnhancedSearchService,
    private readonly tenantService:TenantService,
  ) { }

  @Get('search')
  @ApiOperation({ summary: 'Search published FAQs' })
  @ApiResponse({ status: 200, description: 'FAQs retrieved successfully' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'categories', required: false, description: 'Filter by multiple categories (comma-separated)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 20, max: 100)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination (default: 0)' })
  @ApiQuery({ name: 'sort_by', required: false, enum: ['relevance', 'popularity', 'recent', 'helpful'] })
  @ApiQuery({ name: 'include_related', required: false, type: Boolean, description: 'Include related FAQs' })
  @ApiQuery({ name: 'include_articles', required: false, type: Boolean, description: 'Include Knowledge Base Articles' })
  async searchFaqs(@Query() dto: SearchFaqsDto & { include_articles?: boolean }): Promise<{
    faqs: FaqSearchResult[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }> {
    try {
      const limit = Math.min(dto.limit || 20, 100);
      const offset = dto.offset || 0;

      // Use Enhanced Search Service for unified search
      const searchResult = await this.faqEnhancedSearchService.search({
        query: dto.query || '',
        filters: {
          category: dto.category ? [dto.category] : (dto.categories ? dto.categories.split(',').map(c => c.trim()) : undefined),
          tenantId: requireFaqReadTenant(this.tenantService,dto.tenantId)
        },
        options: {
          limit,
          offset,
          sortBy: dto.sort_by,
          includeFaqs: true,
          includeArticles: dto.include_articles !== false // Default to true if parameter added to DTO
        }
      });

      // Map unified results to FaqSearchResult
      // Note: This makes Articles look like FAQs for the frontend unless we update the frontend type
      // For now, we map basic fields. Ideally frontend should differentiate.
      const results: FaqSearchResult[] = searchResult.results.map(r => ({
        id: r.id,
        question: r.title, // Map title (Question or Article Title) to 'question'
        answer: r.snippet, // Map snippet to 'answer' for preview
        category: r.category,
        keywords: r.tags,
        usageCount: r.metadata.usageCount || 0,
        helpfulCount: r.metadata.helpfulCount || 0,
        notHelpfulCount: 0,
        helpfulnessRatio: 0,
        confidence: r.confidence || 100,
        createdAt: r.metadata.createdAt,
        type: r.type, // Custom field to distinguish
        fullContent: r.content // Helper for full content
      } as any));

      return {
        faqs: results,
        total: searchResult.total,
        limit,
        offset,
        hasMore: offset + limit < searchResult.total
      };

    } catch (error) {
      if(error instanceof HttpException)throw error;
      this.logger.error('Failed to search FAQs:', error);
      throw new HttpException(
        `Failed to search FAQs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get available FAQ categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant ID for filtering' })
  async getCategories(@Query('tenantId') tenantId?: string): Promise<{
    categories: Array<{
      name: string;
      count: number;
      description?: string;
    }>;
  }> {
    try {
      const queryBuilder = this.faqRepository
        .createQueryBuilder('faq')
        .select('faq.category', 'name')
        .addSelect('COUNT(*)', 'count')
        .where('faq.status = :status', { status: FaqEntryStatus.PUBLISHED })
        .andWhere('faq.tenantId = :scopeTenant',{scopeTenant:requireFaqReadTenant(this.tenantService)})
        .andWhere('faq.category IS NOT NULL');

      tenantId=requireFaqReadTenant(this.tenantService,tenantId);
      if (tenantId) {
        queryBuilder.andWhere('faq.tenantId = :tenantId', { tenantId });
      }

      const categoryStats = await queryBuilder
        .groupBy('faq.category')
        .orderBy('count', 'DESC')
        .getRawMany();

      const categories = categoryStats.map(stat => ({
        name: stat.name,
        count: parseInt(stat.count),
        description: `${stat.count} FAQs in ${stat.name} category`
      }));

      return { categories };

    } catch (error) {
      if(error instanceof HttpException)throw error;
      this.logger.error('Failed to get categories:', error);
      throw new HttpException(
        `Failed to get categories: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get most popular FAQs' })
  @ApiResponse({ status: 200, description: 'Popular FAQs retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 10, max: 50)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant ID for filtering' })
  async getPopularFaqs(
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('tenantId') tenantId?: string
  ): Promise<{
    faqs: FaqSearchResult[];
  }> {
    try {
      const queryLimit = Math.min(limit, 50);

      const queryBuilder = this.faqRepository.createQueryBuilder('faq')
        .where('faq.status = :status', { status: FaqEntryStatus.PUBLISHED })
        .andWhere('faq.tenantId = :scopeTenant',{scopeTenant:requireFaqReadTenant(this.tenantService)});

      tenantId=requireFaqReadTenant(this.tenantService,tenantId);
      if (tenantId) {
        queryBuilder.andWhere('faq.tenantId = :tenantId', { tenantId });
      }

      if (category) {
        queryBuilder.andWhere('faq.category = :category', { category });
      }

      const faqs = await queryBuilder
        .orderBy('faq.usageCount', 'DESC')
        .addOrderBy('faq.helpfulCount', 'DESC')
        .take(queryLimit)
        .getMany();

      const results = faqs.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        keywords: faq.keywords,
        usageCount: faq.usageCount,
        helpfulCount: faq.helpfulCount,
        notHelpfulCount: faq.notHelpfulCount,
        helpfulnessRatio: faq.helpfulnessRatio,
        confidence: faq.confidence,
        createdAt: faq.createdAt
      }));

      return { faqs: results };

    } catch (error) {
      if(error instanceof HttpException)throw error;
      this.logger.error('Failed to get popular FAQs:', error);
      throw new HttpException(
        `Failed to get popular FAQs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recently added FAQs' })
  @ApiResponse({ status: 200, description: 'Recent FAQs retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 10, max: 50)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant ID for filtering' })
  async getRecentFaqs(
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('tenantId') tenantId?: string
  ): Promise<{
    faqs: FaqSearchResult[];
  }> {
    try {
      const queryLimit = Math.min(limit, 50);

      const queryBuilder = this.faqRepository.createQueryBuilder('faq')
        .where('faq.status = :status', { status: FaqEntryStatus.PUBLISHED })
        .andWhere('faq.tenantId = :scopeTenant',{scopeTenant:requireFaqReadTenant(this.tenantService)});

      tenantId=requireFaqReadTenant(this.tenantService,tenantId);
      if (tenantId) {
        queryBuilder.andWhere('faq.tenantId = :tenantId', { tenantId });
      }

      if (category) {
        queryBuilder.andWhere('faq.category = :category', { category });
      }

      const faqs = await queryBuilder
        .orderBy('faq.publishedAt', 'DESC')
        .addOrderBy('faq.createdAt', 'DESC')
        .take(queryLimit)
        .getMany();

      const results = faqs.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        keywords: faq.keywords,
        usageCount: faq.usageCount,
        helpfulCount: faq.helpfulCount,
        notHelpfulCount: faq.notHelpfulCount,
        helpfulnessRatio: faq.helpfulnessRatio,
        confidence: faq.confidence,
        createdAt: faq.createdAt
      }));

      return { faqs: results };

    } catch (error) {
      if(error instanceof HttpException)throw error;
      this.logger.error('Failed to get recent FAQs:', error);
      throw new HttpException(
        `Failed to get recent FAQs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific FAQ by ID' })
  @ApiResponse({ status: 200, description: 'FAQ retrieved successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant ID validation' })
  async getFaqById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('tenantId') tenantId?: string
  ): Promise<{
    faq: FaqSearchResult & {
      relatedFaqs: Array<{
        id: string;
        question: string;
        similarity: number;
      }>;
    };
  }> {
    try {
      const where: any = {
        id,
        status: FaqEntryStatus.PUBLISHED,
          tenantId: requireFaqReadTenant(this.tenantService)
      };

      tenantId=requireFaqReadTenant(this.tenantService,tenantId);
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const faq = await this.faqRepository.findOne({
        where
      });

      if (!faq) {
        throw new HttpException('FAQ not found', HttpStatus.NOT_FOUND);
      }

      // Increment usage count
      await this.faqRepository.update({id,tenantId:requireFaqReadTenant(this.tenantService)}, {
        usageCount: faq.usageCount + 1
      });

      // Get related FAQs
      const relatedFaqs = await this.findRelatedFaqs(faq.id, faq.keywords, faq.category);

      const result = {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        keywords: faq.keywords,
        usageCount: faq.usageCount + 1, // Include the increment
        helpfulCount: faq.helpfulCount,
        notHelpfulCount: faq.notHelpfulCount,
        helpfulnessRatio: faq.helpfulnessRatio,
        confidence: faq.confidence,
        createdAt: faq.createdAt,
        relatedFaqs
      };

      return { faq: result };

    } catch (error) {
      if(error instanceof HttpException)throw error;
      this.logger.error(`Failed to get FAQ ${id}:`, error);

      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }

      throw new HttpException(
        `Failed to get FAQ: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit feedback for a FAQ' })
  @ApiResponse({ status: 200, description: 'Feedback submitted successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async submitFeedback(
    @Param('id', ParseUUIDPipe) faqId: string,
    @Body() dto: FaqFeedbackDto,
    @CurrentUser() user?: any
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Verify FAQ exists and is published
      const faq = await this.faqRepository.findOne({
        where: {
          id: faqId,
          status: FaqEntryStatus.PUBLISHED,
          tenantId: requireFaqReadTenant(this.tenantService)
        }
      });

      if (!faq) {
        throw new HttpException('FAQ not found', HttpStatus.NOT_FOUND);
      }

      // Prepare feedback data
      const feedbackData: FeedbackData = {
        faqId,
        userId: user?.id,
        feedbackType: dto.feedbackType,
        rating: dto.rating,
        comment: dto.comment,
        suggestedAnswer: dto.suggestedAnswer,
        suggestedCategory: dto.suggestedCategory,
        suggestedKeywords: dto.suggestedKeywords,
        context: {
          userAgent: 'web', // This would come from request headers
          sessionId: user?.sessionId
        }
      };

      // Process feedback
      const result = await this.feedbackProcessor.processFeedback(feedbackData, requireFaqReadTenant(this.tenantService,user?.tenantId));

      if (result.processed) {
        this.logger.log(`Feedback submitted for FAQ ${faqId} by user ${user?.id || 'anonymous'}`);

        return {
          success: true,
          message: 'Feedback submitted successfully'
        };
      } else {
        throw new HttpException('Failed to process feedback', HttpStatus.INTERNAL_SERVER_ERROR);
      }

    } catch (error) {
      if(error instanceof HttpException)throw error;
      this.logger.error(`Failed to submit feedback for FAQ ${faqId}:`, error);

      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }

      throw new HttpException(
        `Failed to submit feedback: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related FAQs for a specific FAQ' })
  @ApiResponse({ status: 200, description: 'Related FAQs retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 5, max: 20)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant ID validation' })
  async getRelatedFaqs(
    @Param('id', ParseUUIDPipe) faqId: string,
    @Query('limit') limit: number = 5,
    @Query('tenantId') tenantId?: string
  ): Promise<{
    relatedFaqs: Array<{
      id: string;
      question: string;
      answer: string;
      category?: string;
      similarity: number;
      usageCount: number;
    }>;
  }> {
    try {
      const queryLimit = Math.min(limit, 20);

      const where: any = {
        id: faqId,
        status: FaqEntryStatus.PUBLISHED,
          tenantId: requireFaqReadTenant(this.tenantService)
      };

      tenantId=requireFaqReadTenant(this.tenantService,tenantId);
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Get the source FAQ
      const sourceFaq = await this.faqRepository.findOne({
        where
      });

      if (!sourceFaq) {
        throw new HttpException('FAQ not found', HttpStatus.NOT_FOUND);
      }

      const relatedFaqs = await this.findRelatedFaqs(
        sourceFaq.id,
        sourceFaq.keywords,
        sourceFaq.category,
        queryLimit
      );

      // Get full FAQ details for related FAQs
      const relatedIds = relatedFaqs.map(r => r.id);
      const fullRelatedFaqs = await this.faqRepository.find({
        where: {
          id: In(relatedIds),
          status: FaqEntryStatus.PUBLISHED,
          tenantId: requireFaqReadTenant(this.tenantService)
        }
      });

      const results = relatedFaqs.map(related => {
        const fullFaq = fullRelatedFaqs.find(f => f.id === related.id);
        return {
          id: related.id,
          question: related.question,
          answer: fullFaq?.answer || '',
          category: fullFaq?.category,
          similarity: related.similarity,
          usageCount: fullFaq?.usageCount || 0
        };
      });

      return { relatedFaqs: results };

    } catch (error) {
      if(error instanceof HttpException)throw error;
      this.logger.error(`Failed to get related FAQs for ${faqId}:`, error);

      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }

      throw new HttpException(
        `Failed to get related FAQs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get public FAQ statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant ID for filtering' })
  async getFaqStats(@Query('tenantId') tenantId?: string): Promise<{
    totalFaqs: number;
    totalCategories: number;
    mostPopularCategory: string;
    averageHelpfulness: number;
    recentlyAdded: number; // Last 30 days
  }> {
    try {
      const totalWhere: any = { status: FaqEntryStatus.PUBLISHED };
      tenantId=requireFaqReadTenant(this.tenantService,tenantId);
      totalWhere.tenantId = tenantId;

      const totalFaqs = await this.faqRepository.count({
        where: totalWhere
      });

      const categoryQuery = this.faqRepository
        .createQueryBuilder('faq')
        .select('COUNT(DISTINCT faq.category)', 'totalCategories')
        .addSelect('faq.category', 'mostPopular')
        .addSelect('COUNT(*)', 'count')
        .where('faq.status = :status', { status: FaqEntryStatus.PUBLISHED })
        .andWhere('faq.tenantId = :scopeTenant',{scopeTenant:requireFaqReadTenant(this.tenantService)})
        .andWhere('faq.category IS NOT NULL');

      tenantId=requireFaqReadTenant(this.tenantService,tenantId);
      if (tenantId) {
        categoryQuery.andWhere('faq.tenantId = :tenantId', { tenantId });
      }

      const categoryStats = await categoryQuery
        .groupBy('faq.category')
        .orderBy('count', 'DESC')
        .getRawMany();

      const totalCategories = categoryStats.length;
      const mostPopularCategory = categoryStats[0]?.mostPopular || 'General';

      // Calculate average helpfulness
      const helpfulnessQuery = this.faqRepository
        .createQueryBuilder('faq')
        .select('AVG(CASE WHEN (faq.helpfulCount + faq.notHelpfulCount) > 0 THEN faq.helpfulCount::float / (faq.helpfulCount + faq.notHelpfulCount) ELSE 0 END)', 'avgHelpfulness')
        .where('faq.status = :status', { status: FaqEntryStatus.PUBLISHED })
        .andWhere('faq.tenantId = :scopeTenant',{scopeTenant:requireFaqReadTenant(this.tenantService)});

      tenantId=requireFaqReadTenant(this.tenantService,tenantId);
      if (tenantId) {
        helpfulnessQuery.andWhere('faq.tenantId = :tenantId', { tenantId });
      }

      const helpfulnessStats = await helpfulnessQuery.getRawOne();

      const averageHelpfulness = Math.round((parseFloat(helpfulnessStats.avgHelpfulness) || 0) * 100);

      // Recently added (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentWhere: any = {
        status: FaqEntryStatus.PUBLISHED,
        publishedAt: MoreThanOrEqual(thirtyDaysAgo)
      };
      if (tenantId) recentWhere.tenantId = tenantId;

      const recentlyAdded = await this.faqRepository.count({
        where: recentWhere
      });

      return {
        totalFaqs,
        totalCategories,
        mostPopularCategory,
        averageHelpfulness,
        recentlyAdded
      };

    } catch (error) {
      if(error instanceof HttpException)throw error;
      this.logger.error('Failed to get FAQ stats:', error);
      throw new HttpException(
        `Failed to get FAQ stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async findRelatedFaqs(
    faqId: string,
    keywords: string[],
    category?: string,
    limit: number = 5
  ): Promise<Array<{ id: string; question: string; similarity: number }>> {
    try {
      const queryBuilder = this.faqRepository.createQueryBuilder('faq')
        .where('faq.status = :status', { status: FaqEntryStatus.PUBLISHED })
        .andWhere('faq.tenantId = :scopeTenant',{scopeTenant:requireFaqReadTenant(this.tenantService)})
        .andWhere('faq.id != :faqId', { faqId });

      // Prefer same category
      if (category) {
        queryBuilder.andWhere('faq.category = :category', { category });
      }

      // Find FAQs with overlapping keywords
      if (keywords && keywords.length > 0) {
        queryBuilder.andWhere('faq.keywords && :keywords', { keywords });
      }

      const relatedFaqs = await queryBuilder
        .orderBy('faq.usageCount', 'DESC')
        .addOrderBy('faq.helpfulCount', 'DESC')
        .take(limit)
        .getMany();

      // Calculate simple similarity based on keyword overlap
      return relatedFaqs.map(faq => {
        const overlap = faq.keywords.filter(k => keywords.includes(k)).length;
        const similarity = keywords.length > 0 ? overlap / keywords.length : 0;

        return {
          id: faq.id,
          question: faq.question,
          similarity: Math.round(similarity * 100) / 100
        };
      }).sort((a, b) => b.similarity - a.similarity);

    } catch (error) {
      this.logger.warn('Failed to find related FAQs:', error);
      return [];
    }
  }
}