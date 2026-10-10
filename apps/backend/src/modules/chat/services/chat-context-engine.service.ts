import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatContextSource } from '../entities/chat-context-source.entity';
import { ContextSourceType } from '../enums/context-source-type.enum';
import { ChatDocument } from '../entities/chat-document.entity';
import { KnowledgeBaseArticle } from '../../tickets/entities/knowledge-base-article.entity';
import { LearnedFaqEntry, FaqEntryStatus } from '../../faq-learning/entities/learned-faq-entry.entity';
import { LearningPattern } from '../../faq-learning/entities/learning-pattern.entity';
import { FaqEnhancedSearchService, SearchQuery } from '../../faq-learning/services/faq-enhanced-search.service';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface ContextResult {
  sources: ContextSource[];
  totalRelevanceScore: number;
  searchQuery: string;
  processingTime: number;
}

export interface ContextSource {
  id: string;
  type: ContextSourceType;
  title: string;
  content: string;
  relevanceScore: number;
  metadata: Record<string, any>;
  url?: string;
  sourceId?: string;
}

export interface KnowledgeBaseResult {
  article: KnowledgeBaseArticle;
  relevanceScore: number;
  matchedContent: string;
}

export interface FaqLearningResult {
  faqEntry: LearnedFaqEntry;
  relevanceScore: number;
  matchedContent: string;
  confidence: number;
}

export interface DocumentResult {
  document: ChatDocument;
  relevanceScore: number;
  matchedContent: string;
}

@Injectable()
export class ChatContextEngineService {
  private readonly logger = new Logger(ChatContextEngineService.name);

  constructor(
    @InjectRepository(ChatContextSource)
    private readonly contextSourceRepository: Repository<ChatContextSource>,
    @InjectRepository(ChatDocument)
    private readonly documentRepository: Repository<ChatDocument>,
    @InjectRepository(KnowledgeBaseArticle)
    private readonly knowledgeBaseRepository: Repository<KnowledgeBaseArticle>,
    @InjectRepository(LearnedFaqEntry)
    private readonly faqRepository: Repository<LearnedFaqEntry>,
    @InjectRepository(LearningPattern)
    private readonly patternRepository: Repository<LearningPattern>,
    private readonly faqEnhancedSearchService: FaqEnhancedSearchService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Build comprehensive context from multiple sources
   */
  async buildContext(query: string, sessionId: string, options?: {
    maxSources?: number;
    minRelevanceScore?: number;
    includeKnowledgeBase?: boolean;
    includeFaqLearning?: boolean;
    includeDocuments?: boolean;
  }): Promise<ContextResult> {
    const startTime = Date.now();
    const maxSources = options?.maxSources || 10;
    const minRelevanceScore = options?.minRelevanceScore || 0.3;

    this.logger.log(`Building context for query: "${query}" in session: ${sessionId}`);

    const allSources: ContextSource[] = [];

    try {
      // Search Knowledge Base if enabled (default: true)
      if (options?.includeKnowledgeBase !== false) {
        const kbResults = await this.searchKnowledgeBase(query, Math.ceil(maxSources * 0.4));
        allSources.push(...kbResults.map(result => this.mapKnowledgeBaseToContextSource(result)));
      }

      // Search FAQ Learning if enabled (default: true)
      if (options?.includeFaqLearning !== false) {
        const faqResults = await this.searchFaqLearning(query, Math.ceil(maxSources * 0.4));
        allSources.push(...faqResults.map(result => this.mapFaqLearningToContextSource(result)));
      }

      // Search Documents if enabled (default: true)
      if (options?.includeDocuments !== false) {
        const docResults = await this.searchDocuments(query, sessionId, Math.ceil(maxSources * 0.2));
        allSources.push(...docResults.map(result => this.mapDocumentToContextSource(result)));
      }

      // Filter by minimum relevance score
      const filteredSources = allSources.filter(source => source.relevanceScore >= minRelevanceScore);

      // Rank and limit sources
      const rankedSources = await this.rankSources(filteredSources, query);
      const finalSources = rankedSources.slice(0, maxSources);

      // Store context sources for this session
      await this.storeContextSources(sessionId, finalSources, query);

      const totalRelevanceScore = finalSources.reduce((sum, source) => sum + source.relevanceScore, 0);
      const processingTime = Date.now() - startTime;

      this.logger.log(`Context built: ${finalSources.length} sources, total relevance: ${totalRelevanceScore.toFixed(2)}, time: ${processingTime}ms`);

      return {
        sources: finalSources,
        totalRelevanceScore,
        searchQuery: query,
        processingTime
      };

    } catch (error) {
      this.logger.error(`Error building context: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Search Knowledge Base articles for relevant content
   */
  async searchKnowledgeBase(query: string, limit: number = 5): Promise<KnowledgeBaseResult[]> {
    try {
      this.logger.debug(`Searching Knowledge Base for: "${query}"`);

      const searchQuery = this.knowledgeBaseRepository
        .createQueryBuilder('article')
        .leftJoinAndSelect('article.category', 'category')
        .leftJoinAndSelect('article.author', 'author')
        .where('article.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .andWhere('article.isPublished = :isPublished', { isPublished: true })
        .andWhere('article.status = :status', { status: 'published' });

      // Full-text search across title, content, and summary
      searchQuery.andWhere(
        '(article.title ILIKE :query OR article.content ILIKE :query OR article.summary ILIKE :query OR array_to_string(article.tags, \' \') ILIKE :query)',
        { query: `%${query}%` }
      );

      // Order by relevance factors
      searchQuery
        .orderBy('article.searchScore', 'DESC')
        .addOrderBy('article.viewCount', 'DESC')
        .addOrderBy('article.helpfulCount', 'DESC')
        .take(limit);

      const articles = await searchQuery.getMany();

      const results: KnowledgeBaseResult[] = [];

      for (const article of articles) {
        const relevanceScore = await this.calculateKnowledgeBaseRelevance(article, query);
        const matchedContent = this.extractMatchedContent(article.content, query);

        results.push({
          article,
          relevanceScore,
          matchedContent
        });
      }

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      this.logger.debug(`Found ${results.length} Knowledge Base results`);
      return results;

    } catch (error) {
      this.logger.error(`Error searching Knowledge Base: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Search FAQ Learning entries for relevant content using enhanced search
   */
  async searchFaqLearning(query: string, limit: number = 5): Promise<FaqLearningResult[]> {
    try {
      this.logger.debug(`Searching FAQ Learning for: "${query}"`);

      // Use the enhanced search service for better results
      const searchQuery: SearchQuery = {
        query,
        options: {
          limit,
          includeFaqs: true,
          includeArticles: false, // Only FAQs for this method
          sortBy: 'relevance',
          sortOrder: 'DESC'
        },
        filters: {
          minConfidence: 50 // Only include FAQs with reasonable confidence
        }
      };

      const searchResponse = await this.faqEnhancedSearchService.search(searchQuery);
      const results: FaqLearningResult[] = [];

      // Convert search results to FaqLearningResult format
      for (const result of searchResponse.results) {
        if (result.type === 'faq') {
          // Get the full FAQ entry for additional data
          const faqEntry = await this.faqRepository.findOne({
            where: { id: result.id, tenantId: this.tenantService.getTenantId() }
          });

          if (faqEntry) {
            results.push({
              faqEntry,
              relevanceScore: result.relevanceScore / 100, // Normalize to 0-1 range
              matchedContent: result.snippet,
              confidence: result.confidence || faqEntry.confidence
            });
          }
        }
      }

      this.logger.debug(`Found ${results.length} FAQ Learning results using enhanced search`);
      return results;

    } catch (error) {
      this.logger.error(`Error searching FAQ Learning: ${error.message}`, error.stack);

      // Fallback to basic search if enhanced search fails
      return this.searchFaqLearningBasic(query, limit);
    }
  }

  /**
   * Fallback basic FAQ search method
   */
  private async searchFaqLearningBasic(query: string, limit: number = 5): Promise<FaqLearningResult[]> {
    try {
      this.logger.debug(`Using basic FAQ search for: "${query}"`);

      const searchQuery = this.faqRepository
        .createQueryBuilder('faq')
        .where('faq.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .andWhere('faq.status IN (:...statuses)', {
          statuses: [FaqEntryStatus.APPROVED, FaqEntryStatus.PUBLISHED]
        });

      // Search in question, answer, and keywords
      searchQuery.andWhere(
        '(faq.question ILIKE :query OR faq.answer ILIKE :query OR array_to_string(faq.keywords, \' \') ILIKE :query)',
        { query: `%${query}%` }
      );

      // Order by confidence and usage
      searchQuery
        .orderBy('faq.confidence', 'DESC')
        .addOrderBy('faq.usageCount', 'DESC')
        .addOrderBy('faq.helpfulCount', 'DESC')
        .take(limit);

      const faqEntries = await searchQuery.getMany();

      const results: FaqLearningResult[] = [];

      for (const faqEntry of faqEntries) {
        const relevanceScore = await this.calculateFaqLearningRelevance(faqEntry, query);
        const matchedContent = this.extractMatchedContent(
          `${faqEntry.question} ${faqEntry.answer}`,
          query
        );

        results.push({
          faqEntry,
          relevanceScore,
          matchedContent,
          confidence: faqEntry.confidence
        });
      }

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      this.logger.debug(`Found ${results.length} FAQ Learning results using basic search`);
      return results;

    } catch (error) {
      this.logger.error(`Error in basic FAQ search: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Search documents within chat session for relevant content
   */
  async searchDocuments(query: string, sessionId: string, limit: number = 3): Promise<DocumentResult[]> {
    try {
      this.logger.debug(`Searching documents for session ${sessionId} with query: "${query}"`);

      const searchQuery = this.documentRepository
        .createQueryBuilder('doc')
        .where('doc.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .andWhere('doc.sessionId = :sessionId', { sessionId })
        .andWhere('doc.processingStatus = :status', { status: 'completed' })
        .andWhere('doc.extractedContent IS NOT NULL');

      // Search in extracted content
      searchQuery.andWhere('doc.extractedContent ILIKE :query', { query: `%${query}%` });

      // Order by file size (smaller files might be more focused) and creation date
      searchQuery
        .orderBy('doc.createdAt', 'DESC')
        .addOrderBy('doc.fileSize', 'ASC')
        .take(limit);

      const documents = await searchQuery.getMany();

      const results: DocumentResult[] = [];

      for (const document of documents) {
        const relevanceScore = await this.calculateDocumentRelevance(document, query);
        const matchedContent = this.extractMatchedContent(document.extractedContent, query);

        results.push({
          document,
          relevanceScore,
          matchedContent
        });
      }

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      this.logger.debug(`Found ${results.length} document results`);
      return results;

    } catch (error) {
      this.logger.error(`Error searching documents: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Calculate relevance score for Knowledge Base articles
   */
  private async calculateKnowledgeBaseRelevance(article: KnowledgeBaseArticle, query: string): Promise<number> {
    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();
    const summaryLower = (article.summary || '').toLowerCase();

    // Title match (highest weight)
    if (titleLower.includes(queryLower)) {
      score += 0.4;
    }

    // Summary match (high weight)
    if (summaryLower.includes(queryLower)) {
      score += 0.3;
    }

    // Content match (medium weight)
    if (contentLower.includes(queryLower)) {
      score += 0.2;
    }

    // Tags match
    if (article.tags && article.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
      score += 0.15;
    }

    // Quality factors
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
   * Calculate relevance score for FAQ Learning entries
   */
  private async calculateFaqLearningRelevance(faqEntry: LearnedFaqEntry, query: string): Promise<number> {
    let score = 0;
    const queryLower = query.toLowerCase();
    const questionLower = faqEntry.question.toLowerCase();
    const answerLower = faqEntry.answer.toLowerCase();

    // Question match (highest weight)
    if (questionLower.includes(queryLower)) {
      score += 0.5;
    }

    // Answer match (high weight)
    if (answerLower.includes(queryLower)) {
      score += 0.3;
    }

    // Keywords match
    if (faqEntry.keywords && faqEntry.keywords.some(keyword => keyword.toLowerCase().includes(queryLower))) {
      score += 0.2;
    }

    // Confidence factor (FAQ system's own confidence)
    score += (faqEntry.confidence / 100) * 0.15;

    // Usage and feedback factors
    const usageScore = Math.min(1, faqEntry.usageCount / 10) * 0.05;
    const feedbackScore = faqEntry.feedbackCount > 0 ? faqEntry.helpfulnessRatio * 0.05 : 0;
    score += usageScore + feedbackScore;

    // Normalize to 0-1 range
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate relevance score for documents
   */
  private async calculateDocumentRelevance(document: ChatDocument, query: string): Promise<number> {
    let score = 0;
    const queryLower = query.toLowerCase();
    const contentLower = (document.extractedContent || '').toLowerCase();
    const filenameLower = document.filename.toLowerCase();

    // Filename match (high weight)
    if (filenameLower.includes(queryLower)) {
      score += 0.3;
    }

    // Content match frequency
    const matches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
    const contentLength = contentLower.length;
    if (contentLength > 0) {
      const matchDensity = matches / (contentLength / 1000); // matches per 1000 characters
      score += Math.min(0.5, matchDensity * 0.1);
    }

    // File type relevance (some file types might be more relevant)
    const fileTypeScore = this.getFileTypeRelevanceScore(document.fileType);
    score += fileTypeScore * 0.1;

    // Recency factor (newer documents might be more relevant)
    const daysSinceCreation = (Date.now() - document.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceCreation / 30)); // Decay over 30 days
    score += recencyScore * 0.1;

    // Normalize to 0-1 range
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Rank context sources by relevance and diversity
   */
  async rankSources(sources: ContextSource[], _query: string): Promise<ContextSource[]> {
    // Sort by relevance score first
    const sortedSources = sources.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply diversity scoring to avoid too many sources of the same type
    const rankedSources: ContextSource[] = [];
    const typeCount: Record<ContextSourceType, number> = {
      [ContextSourceType.KNOWLEDGE_BASE]: 0,
      [ContextSourceType.FAQ_LEARNING]: 0,
      [ContextSourceType.DOCUMENT]: 0,
      [ContextSourceType.URL]: 0
    };

    for (const source of sortedSources) {
      // Apply diversity penalty if we have too many of this type
      let diversityPenalty = 0;
      const currentTypeCount = typeCount[source.type];
      if (currentTypeCount >= 3) {
        diversityPenalty = 0.1 * (currentTypeCount - 2);
      }

      const adjustedScore = Math.max(0, source.relevanceScore - diversityPenalty);

      rankedSources.push({
        ...source,
        relevanceScore: adjustedScore
      });

      typeCount[source.type]++;
    }

    // Final sort by adjusted scores
    return rankedSources.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Extract matched content snippet around the query
   */
  private extractMatchedContent(content: string, query: string, maxLength: number = 300): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    const matchIndex = contentLower.indexOf(queryLower);
    if (matchIndex === -1) {
      // No direct match, return beginning of content
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Extract content around the match
    const start = Math.max(0, matchIndex - 100);
    const end = Math.min(content.length, matchIndex + query.length + 200);

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
   * Get relevance score based on file type
   */
  private getFileTypeRelevanceScore(fileType: string): number {
    const typeScores: Record<string, number> = {
      'pdf': 0.9,
      'docx': 0.8,
      'txt': 0.7,
      'md': 0.8,
      'xlsx': 0.6
    };

    return typeScores[fileType.toLowerCase()] || 0.5;
  }

  /**
   * Store context sources for tracking and analytics
   */
  private async storeContextSources(sessionId: string, sources: ContextSource[], query: string): Promise<void> {
    try {
      const contextSources = sources.map(source => {
        const contextSource = new ChatContextSource();
        contextSource.sessionId = sessionId;
        contextSource.sourceType = source.type;
        contextSource.sourceId = source.sourceId || source.id;
        contextSource.content = source.content;
        contextSource.relevanceScore = source.relevanceScore;
        contextSource.metadata = {
          title: source.title,
          url: source.url,
          ...source.metadata,
          searchQuery: query
        };
        contextSource.tenantId = this.tenantService.getTenantId();
        return contextSource;
      });

      await this.contextSourceRepository.save(contextSources);
      this.logger.debug(`Stored ${contextSources.length} context sources for session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error storing context sources: ${error.message}`, error.stack);
      // Don't throw error as this is not critical for the main functionality
    }
  }

  /**
   * Map Knowledge Base result to ContextSource
   */
  private mapKnowledgeBaseToContextSource(result: KnowledgeBaseResult): ContextSource {
    return {
      id: result.article.id,
      type: ContextSourceType.KNOWLEDGE_BASE,
      title: result.article.title,
      content: result.matchedContent,
      relevanceScore: result.relevanceScore,
      sourceId: result.article.id,
      url: `/knowledge-base/${result.article.slug}`,
      metadata: {
        category: result.article.category?.name,
        author: result.article.author?.firstName + ' ' + result.article.author?.lastName,
        viewCount: result.article.viewCount,
        helpfulCount: result.article.helpfulCount,
        tags: result.article.tags,
        publishedAt: result.article.publishedAt,
        summary: result.article.summary
      }
    };
  }

  /**
   * Map FAQ Learning result to ContextSource
   */
  private mapFaqLearningToContextSource(result: FaqLearningResult): ContextSource {
    return {
      id: result.faqEntry.id,
      type: ContextSourceType.FAQ_LEARNING,
      title: result.faqEntry.question,
      content: result.matchedContent,
      relevanceScore: result.relevanceScore,
      sourceId: result.faqEntry.id,
      metadata: {
        answer: result.faqEntry.answer,
        category: result.faqEntry.category,
        confidence: result.faqEntry.confidence,
        usageCount: result.faqEntry.usageCount,
        helpfulCount: result.faqEntry.helpfulCount,
        keywords: result.faqEntry.keywords,
        source: result.faqEntry.source,
        status: result.faqEntry.status
      }
    };
  }

  /**
   * Map Document result to ContextSource
   */
  private mapDocumentToContextSource(result: DocumentResult): ContextSource {
    return {
      id: result.document.id,
      type: ContextSourceType.DOCUMENT,
      title: result.document.filename,
      content: result.matchedContent,
      relevanceScore: result.relevanceScore,
      sourceId: result.document.id,
      metadata: {
        fileType: result.document.fileType,
        fileSize: result.document.fileSize,
        uploadedAt: result.document.createdAt,
        processingStatus: result.document.processingStatus,
        fullContent: result.document.extractedContent
      }
    };
  }

  /**
   * Get context sources for a specific session
   */
  async getSessionContextSources(sessionId: string, messageId?: string): Promise<ChatContextSource[]> {
    const query = this.contextSourceRepository
      .createQueryBuilder('source')
      .where('source.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
      .andWhere('source.sessionId = :sessionId', { sessionId });

    if (messageId) {
      query.andWhere('source.messageId = :messageId', { messageId });
    }

    query.orderBy('source.relevanceScore', 'DESC')
      .addOrderBy('source.createdAt', 'DESC');

    return await query.getMany();
  }

  /**
   * Get context statistics for analytics
   */
  async getContextStatistics(sessionId?: string): Promise<{
    totalSources: number;
    sourcesByType: Record<ContextSourceType, number>;
    averageRelevanceScore: number;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    const query = this.contextSourceRepository.createQueryBuilder('source')
      .where('source.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() });

    if (sessionId) {
      query.andWhere('source.sessionId = :sessionId', { sessionId });
    }

    const sources = await query.getMany();

    const sourcesByType = sources.reduce((acc, source) => {
      acc[source.sourceType] = (acc[source.sourceType] || 0) + 1;
      return acc;
    }, {} as Record<ContextSourceType, number>);

    const averageRelevanceScore = sources.length > 0
      ? sources.reduce((sum, source) => sum + source.relevanceScore, 0) / sources.length
      : 0;

    // Extract categories from metadata
    const categoryCount: Record<string, number> = {};
    sources.forEach(source => {
      const category = source.metadata?.category;
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSources: sources.length,
      sourcesByType,
      averageRelevanceScore,
      topCategories
    };
  }
}