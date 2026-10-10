import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatContextEngineService, ContextResult, ContextSource } from './chat-context-engine.service';
import { KnowledgeBaseArticle } from '../../tickets/entities/knowledge-base-article.entity';
import { ContextSourceType } from '../enums/context-source-type.enum';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface GeneralContextOptions {
  maxSources?: number;
  minRelevanceScore?: number;
  focusOnPlatformInfo?: boolean;
  includeGettingStarted?: boolean;
  includeFeatureGuides?: boolean;
  includeTroubleshooting?: boolean;
}

export interface PlatformInfoSource extends ContextSource {
  category: 'getting-started' | 'features' | 'troubleshooting' | 'general-help' | 'platform-docs';
  priority: number;
}

@Injectable()
export class GeneralCommunicationContextService {
  private readonly logger = new Logger(GeneralCommunicationContextService.name);

  // Platform-specific categories that are most relevant for general communication
  private readonly PLATFORM_CATEGORIES = [
    'getting-started',
    'platform-overview',
    'features',
    'user-guide',
    'troubleshooting',
    'account-management',
    'billing',
    'general-help'
  ];

  // Keywords that indicate general platform questions
  private readonly PLATFORM_KEYWORDS = [
    'nasıl', 'nedir', 'ne demek', 'kullanım', 'özellik', 'platform', 'sistem',
    'hesap', 'profil', 'ayarlar', 'başlangıç', 'rehber', 'yardım',
    'how', 'what', 'feature', 'platform', 'system', 'account', 'profile',
    'settings', 'getting started', 'guide', 'help'
  ];

  constructor(
    @InjectRepository(KnowledgeBaseArticle)
    private readonly knowledgeBaseRepository: Repository<KnowledgeBaseArticle>,
    private readonly chatContextEngineService: ChatContextEngineService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Build context specifically for general communication
   * Focuses on platform information, getting started guides, and general help
   */
  async buildGeneralContext(
    query: string,
    sessionId: string,
    options: GeneralContextOptions = {}
  ): Promise<ContextResult> {
    const startTime = Date.now();

    this.logger.log(`Building general communication context for query: "${query}"`);

    const {
      maxSources = 8,
      minRelevanceScore = 0.2,
      focusOnPlatformInfo = true,
      includeGettingStarted = true,
      includeFeatureGuides = true,
      includeTroubleshooting = true
    } = options;

    try {
      const allSources: PlatformInfoSource[] = [];

      // Get platform-specific knowledge base articles
      if (focusOnPlatformInfo) {
        const platformSources = await this.searchPlatformKnowledgeBase(
          query,
          Math.ceil(maxSources * 0.7),
          { includeGettingStarted, includeFeatureGuides, includeTroubleshooting }
        );
        allSources.push(...platformSources);
      }

      // Get general FAQ entries (but with lower priority for general communication)
      const faqResults = await this.chatContextEngineService.searchFaqLearning(
        query,
        Math.ceil(maxSources * 0.3)
      );

      const faqSources = faqResults.map(result => this.mapFaqToGeneralSource(result));
      allSources.push(...faqSources);

      // Filter by minimum relevance score
      const filteredSources = allSources.filter(source => source.relevanceScore >= minRelevanceScore);

      // Rank sources with general communication priorities
      const rankedSources = await this.rankGeneralSources(filteredSources, query);
      const finalSources = rankedSources.slice(0, maxSources);

      const totalRelevanceScore = finalSources.reduce((sum, source) => sum + source.relevanceScore, 0);
      const processingTime = Date.now() - startTime;

      this.logger.log(`General context built: ${finalSources.length} sources, total relevance: ${totalRelevanceScore.toFixed(2)}, time: ${processingTime}ms`);

      return {
        sources: finalSources,
        totalRelevanceScore,
        searchQuery: query,
        processingTime
      };

    } catch (error) {
      this.logger.error(`Error building general context: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Search Knowledge Base specifically for platform information
   */
  private async searchPlatformKnowledgeBase(
    query: string,
    limit: number,
    options: {
      includeGettingStarted?: boolean;
      includeFeatureGuides?: boolean;
      includeTroubleshooting?: boolean;
    }
  ): Promise<PlatformInfoSource[]> {
    try {
      this.logger.debug(`Searching platform Knowledge Base for: "${query}"`);

      const searchQuery = this.knowledgeBaseRepository
        .createQueryBuilder('article')
        .leftJoinAndSelect('article.category', 'category')
        .leftJoinAndSelect('article.author', 'author')
        .where('article.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .andWhere('article.isPublished = :isPublished', { isPublished: true })
        .andWhere('article.status = :status', { status: 'published' });

      // Focus on platform-related categories
      const categoryConditions: string[] = [];
      if (options.includeGettingStarted) {
        categoryConditions.push("category.name ILIKE '%başlangıç%' OR category.name ILIKE '%getting%started%'");
      }
      if (options.includeFeatureGuides) {
        categoryConditions.push("category.name ILIKE '%özellik%' OR category.name ILIKE '%feature%' OR category.name ILIKE '%rehber%' OR category.name ILIKE '%guide%'");
      }
      if (options.includeTroubleshooting) {
        categoryConditions.push("category.name ILIKE '%sorun%' OR category.name ILIKE '%problem%' OR category.name ILIKE '%troubleshoot%'");
      }

      // Add general platform categories
      categoryConditions.push(
        this.PLATFORM_CATEGORIES.map(cat => `category.name ILIKE '%${cat}%'`).join(' OR ')
      );

      if (categoryConditions.length > 0) {
        searchQuery.andWhere(`(${categoryConditions.join(' OR ')})`);
      }

      // Full-text search with platform keyword boost
      const queryLower = query.toLowerCase();
      const hasPlatformKeywords = this.PLATFORM_KEYWORDS.some(keyword =>
        queryLower.includes(keyword.toLowerCase())
      );

      searchQuery.andWhere(
        '(article.title ILIKE :query OR article.content ILIKE :query OR article.summary ILIKE :query OR array_to_string(article.tags, \' \') ILIKE :query)',
        { query: `%${query}%` }
      );

      // Order by relevance factors with platform priority
      searchQuery
        .orderBy('article.searchScore', 'DESC')
        .addOrderBy('article.viewCount', 'DESC')
        .addOrderBy('article.helpfulCount', 'DESC')
        .take(limit);

      const articles = await searchQuery.getMany();
      const results: PlatformInfoSource[] = [];

      for (const article of articles) {
        const baseRelevanceScore = await this.calculatePlatformRelevance(article, query);

        // Boost score if it contains platform keywords
        const platformBoost = hasPlatformKeywords ? 0.1 : 0;
        const relevanceScore = Math.min(1, baseRelevanceScore + platformBoost);

        const category = this.categorizePlatformContent(article);
        const priority = this.getPlatformContentPriority(category, query);

        const matchedContent = this.extractMatchedContent(article.content, query);

        results.push({
          id: article.id,
          type: ContextSourceType.KNOWLEDGE_BASE,
          title: article.title,
          content: matchedContent,
          relevanceScore,
          sourceId: article.id,
          url: `/knowledge-base/${article.slug}`,
          category,
          priority,
          metadata: {
            category: article.category?.name,
            author: article.author?.firstName + ' ' + article.author?.lastName,
            viewCount: article.viewCount,
            helpfulCount: article.helpfulCount,
            tags: article.tags,
            publishedAt: article.publishedAt,
            summary: article.summary,
            platformCategory: category,
            isPlatformContent: true
          }
        });
      }

      // Sort by relevance score and priority
      results.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return b.relevanceScore - a.relevanceScore;
      });

      this.logger.debug(`Found ${results.length} platform Knowledge Base results`);
      return results;

    } catch (error) {
      this.logger.error(`Error searching platform Knowledge Base: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Calculate relevance score specifically for platform content
   */
  private async calculatePlatformRelevance(article: KnowledgeBaseArticle, query: string): Promise<number> {
    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();
    const summaryLower = (article.summary || '').toLowerCase();

    // Title match (highest weight for platform content)
    if (titleLower.includes(queryLower)) {
      score += 0.5;
    }

    // Summary match (high weight)
    if (summaryLower.includes(queryLower)) {
      score += 0.3;
    }

    // Content match (medium weight)
    if (contentLower.includes(queryLower)) {
      score += 0.2;
    }

    // Platform keyword bonus
    const platformKeywordMatches = this.PLATFORM_KEYWORDS.filter(keyword =>
      titleLower.includes(keyword.toLowerCase()) ||
      summaryLower.includes(keyword.toLowerCase())
    ).length;
    score += Math.min(0.2, platformKeywordMatches * 0.05);

    // Category relevance for platform content
    const categoryName = article.category?.name?.toLowerCase() || '';
    const isPlatformCategory = this.PLATFORM_CATEGORIES.some(cat =>
      categoryName.includes(cat.toLowerCase())
    );
    if (isPlatformCategory) {
      score += 0.15;
    }

    // Quality factors (engagement metrics)
    const qualityScore = this.calculateQualityScore(
      article.viewCount,
      article.helpfulCount,
      article.notHelpfulCount,
      article.searchScore
    );
    score += qualityScore * 0.1;

    // Normalize to 0-1 range
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Categorize platform content for better organization
   */
  private categorizePlatformContent(article: KnowledgeBaseArticle): PlatformInfoSource['category'] {
    const title = article.title.toLowerCase();
    const categoryName = article.category?.name?.toLowerCase() || '';
    const content = article.content.toLowerCase();

    // Check for getting started content
    if (
      title.includes('başlangıç') || title.includes('getting started') ||
      title.includes('ilk adım') || title.includes('first step') ||
      categoryName.includes('başlangıç') || categoryName.includes('getting')
    ) {
      return 'getting-started';
    }

    // Check for feature guides
    if (
      title.includes('özellik') || title.includes('feature') ||
      title.includes('nasıl kullan') || title.includes('how to use') ||
      categoryName.includes('özellik') || categoryName.includes('feature') ||
      categoryName.includes('rehber') || categoryName.includes('guide')
    ) {
      return 'features';
    }

    // Check for troubleshooting content
    if (
      title.includes('sorun') || title.includes('problem') ||
      title.includes('hata') || title.includes('error') ||
      title.includes('çözüm') || title.includes('solution') ||
      categoryName.includes('sorun') || categoryName.includes('troubleshoot')
    ) {
      return 'troubleshooting';
    }

    // Check for platform documentation
    if (
      title.includes('platform') || title.includes('sistem') ||
      title.includes('genel') || title.includes('general') ||
      categoryName.includes('platform') || categoryName.includes('docs')
    ) {
      return 'platform-docs';
    }

    // Default to general help
    return 'general-help';
  }

  /**
   * Get priority score for different types of platform content
   */
  private getPlatformContentPriority(category: PlatformInfoSource['category'], query: string): number {
    const queryLower = query.toLowerCase();

    // Base priorities for different categories
    const basePriorities = {
      'getting-started': 9,
      'features': 8,
      'troubleshooting': 7,
      'platform-docs': 6,
      'general-help': 5
    };

    let priority = basePriorities[category];

    // Boost priority based on query intent
    if (queryLower.includes('nasıl') || queryLower.includes('how')) {
      if (category === 'features' || category === 'getting-started') {
        priority += 2;
      }
    }

    if (queryLower.includes('sorun') || queryLower.includes('problem') || queryLower.includes('hata')) {
      if (category === 'troubleshooting') {
        priority += 3;
      }
    }

    if (queryLower.includes('başlangıç') || queryLower.includes('getting started') || queryLower.includes('ilk')) {
      if (category === 'getting-started') {
        priority += 3;
      }
    }

    return priority;
  }

  /**
   * Map FAQ results to general communication sources
   */
  private mapFaqToGeneralSource(faqResult: any): PlatformInfoSource {
    return {
      id: faqResult.faqEntry.id,
      type: ContextSourceType.FAQ_LEARNING,
      title: faqResult.faqEntry.question,
      content: faqResult.matchedContent,
      relevanceScore: faqResult.relevanceScore * 0.8, // Slightly lower priority for general communication
      sourceId: faqResult.faqEntry.id,
      category: 'general-help',
      priority: 4, // Lower priority than knowledge base for general communication
      metadata: {
        answer: faqResult.faqEntry.answer,
        category: faqResult.faqEntry.category,
        confidence: faqResult.faqEntry.confidence,
        usageCount: faqResult.faqEntry.usageCount,
        helpfulCount: faqResult.faqEntry.helpfulCount,
        keywords: faqResult.faqEntry.keywords,
        source: faqResult.faqEntry.source,
        status: faqResult.faqEntry.status,
        isGeneralFaq: true
      }
    };
  }

  /**
   * Rank sources specifically for general communication
   */
  private async rankGeneralSources(sources: PlatformInfoSource[], query: string): Promise<PlatformInfoSource[]> {
    // Sort by priority first, then by relevance score
    const sortedSources = sources.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.relevanceScore - a.relevanceScore;
    });

    // Apply diversity scoring to ensure variety in content types
    const rankedSources: PlatformInfoSource[] = [];
    const categoryCount: Record<string, number> = {};

    for (const source of sortedSources) {
      // Apply diversity penalty if we have too many of this category
      const currentCategoryCount = categoryCount[source.category] || 0;
      let diversityPenalty = 0;

      if (currentCategoryCount >= 2) {
        diversityPenalty = 0.1 * (currentCategoryCount - 1);
      }

      const adjustedScore = Math.max(0, source.relevanceScore - diversityPenalty);

      rankedSources.push({
        ...source,
        relevanceScore: adjustedScore
      });

      categoryCount[source.category] = currentCategoryCount + 1;
    }

    // Final sort by adjusted scores while maintaining priority order
    return rankedSources.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (Math.abs(priorityDiff) > 1) {
        return priorityDiff;
      }
      return b.relevanceScore - a.relevanceScore;
    });
  }

  /**
   * Extract matched content snippet around the query
   */
  private extractMatchedContent(content: string, query: string, maxLength: number = 250): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    const matchIndex = contentLower.indexOf(queryLower);
    if (matchIndex === -1) {
      // No direct match, return beginning of content
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Extract content around the match
    const start = Math.max(0, matchIndex - 80);
    const end = Math.min(content.length, matchIndex + query.length + 170);

    let snippet = content.substring(start, end);

    // Add ellipsis if we truncated
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Calculate quality score based on engagement metrics
   */
  private calculateQualityScore(viewCount: number, helpfulCount: number, notHelpfulCount: number, searchScore: number): number {
    const totalFeedback = helpfulCount + notHelpfulCount;
    const helpfulnessRatio = totalFeedback > 0 ? helpfulCount / totalFeedback : 0.5;

    const viewScore = Math.min(1, viewCount / 100); // Normalize views
    const feedbackScore = helpfulnessRatio;
    const searchScoreNormalized = searchScore / 100;

    return (viewScore * 0.3 + feedbackScore * 0.4 + searchScoreNormalized * 0.3);
  }

  /**
   * Detect if a query is asking for general platform information
   */
  isPlatformInformationQuery(query: string): boolean {
    const queryLower = query.toLowerCase();

    // Check for platform-related keywords
    const hasPlatformKeywords = this.PLATFORM_KEYWORDS.some(keyword =>
      queryLower.includes(keyword.toLowerCase())
    );

    // Check for question patterns that indicate general information seeking
    const questionPatterns = [
      /nedir|ne demek|what is|what does/i,
      /nasıl|how to|how do/i,
      /nerede|where/i,
      /ne zaman|when/i,
      /hangi|which/i,
      /platform|sistem|system/i,
      /özellik|feature/i,
      /kullanım|usage|use/i
    ];

    const hasQuestionPattern = questionPatterns.some(pattern => pattern.test(query));

    return hasPlatformKeywords || hasQuestionPattern;
  }

  /**
   * Get suggested topics for general communication
   */
  async getSuggestedTopics(limit: number = 6): Promise<Array<{
    title: string;
    category: string;
    description: string;
    url?: string;
  }>> {
    try {
      // Get popular platform articles
      const popularArticles = await this.knowledgeBaseRepository
        .createQueryBuilder('article')
        .leftJoinAndSelect('article.category', 'category')
        .where('article.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .andWhere('article.isPublished = :isPublished', { isPublished: true })
        .andWhere('article.status = :status', { status: 'published' })
        .andWhere(
          this.PLATFORM_CATEGORIES.map(cat => `category.name ILIKE '%${cat}%'`).join(' OR ')
        )
        .orderBy('article.viewCount', 'DESC')
        .addOrderBy('article.helpfulCount', 'DESC')
        .take(limit)
        .getMany();

      return popularArticles.map(article => ({
        title: article.title,
        category: article.category?.name || 'Genel',
        description: article.summary || article.content.substring(0, 150) + '...',
        url: `/knowledge-base/${article.slug}`
      }));

    } catch (error) {
      this.logger.error(`Error getting suggested topics: ${error.message}`, error.stack);
      return [];
    }
  }
}