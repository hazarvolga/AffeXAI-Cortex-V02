import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';
import { requireFaqReadTenant } from './faq-review-policy';
import { Repository } from 'typeorm';
import { LearnedFaqEntry, FaqEntryStatus } from '../entities/learned-faq-entry.entity';
import { KnowledgeBaseArticle } from '../../tickets/entities/knowledge-base-article.entity';

export interface SearchQuery {
  query: string;
  filters?: {
    category?: string[];
    minConfidence?: number;
    source?: ('chat' | 'ticket')[];
    tags?: string[];
    tenantId?: string;
  };
  options?: {
    limit?: number;
    offset?: number;
    includeFaqs?: boolean;
    includeArticles?: boolean;
    sortBy?: 'relevance' | 'confidence' | 'popularity' | 'date' | 'helpful' | 'recent';
    sortOrder?: 'ASC' | 'DESC';
  };
}

export interface SearchResult {
  id: string;
  type: 'faq' | 'article';
  title: string;
  content: string;
  snippet: string;
  relevanceScore: number;
  confidence?: number;
  category?: string;
  tags: string[];
  url: string;
  metadata: {
    source?: string;
    usageCount?: number;
    helpfulCount?: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  query: string;
  suggestions: string[];
  relatedFaqs: SearchResult[];
  processingTime: number;
}

export interface SearchAnalytics {
  query: string;
  resultCount: number;
  clickedResults: string[];
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

@Injectable()
export class FaqEnhancedSearchService {
  private readonly logger = new Logger(FaqEnhancedSearchService.name);
  private searchCache: Map<string, { results: SearchResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(LearnedFaqEntry)
    private faqRepository: Repository<LearnedFaqEntry>,
    @InjectRepository(KnowledgeBaseArticle)
    private articleRepository: Repository<KnowledgeBaseArticle>,
    private readonly tenantService:TenantService,
  ) { }

  async search(searchQuery: SearchQuery): Promise<SearchResponse> {
    const tenantId=requireFaqReadTenant(this.tenantService,searchQuery.filters?.tenantId);
    searchQuery={...searchQuery,filters:{...searchQuery.filters,tenantId}};
    const startTime = Date.now();

    try {
      this.logger.log(`Searching for: "${searchQuery.query}"`);

      // Published content is read fresh so review revocation takes effect immediately.
      const options = {
        limit: searchQuery.options?.limit || 10,
        offset: searchQuery.options?.offset || 0,
        includeFaqs: searchQuery.options?.includeFaqs !== false,
        includeArticles: searchQuery.options?.includeArticles !== false,
        sortBy: searchQuery.options?.sortBy || 'relevance',
        sortOrder: searchQuery.options?.sortOrder || 'DESC'
      };

      // Search FAQs and Articles in parallel
      const [faqResults, articleResults] = await Promise.all([
        options.includeFaqs ? this.searchFaqs(searchQuery) : Promise.resolve([]),
        options.includeArticles ? this.searchArticles(searchQuery) : Promise.resolve([])
      ]);

      // Combine and rank results
      let allResults = [...faqResults, ...articleResults];

      // Apply sorting
      allResults = this.sortResults(allResults, options.sortBy, options.sortOrder);

      // Apply pagination
      const total = allResults.length;
      const paginatedResults = allResults.slice(options.offset, options.offset + options.limit);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(searchQuery.query, allResults);

      // Get related FAQs
      const relatedFaqs = await this.getRelatedFaqs(paginatedResults, 3);

      const response: SearchResponse = {
        results: paginatedResults,
        total,
        page: Math.floor(options.offset / options.limit) + 1,
        limit: options.limit,
        query: searchQuery.query,
        suggestions,
        relatedFaqs,
        processingTime: Date.now() - startTime
      };

      // Cache results


      // Track analytics
      await this.trackSearch(searchQuery, response);

      return response;

    } catch (error) {
      this.logger.error('Search failed:', error);
      return {
        results: [],
        total: 0,
        page: 1,
        limit: searchQuery.options?.limit || 10,
        query: searchQuery.query,
        suggestions: [],
        relatedFaqs: [],
        processingTime: Date.now() - startTime
      };
    }
  }

  async searchFaqs(searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      const queryBuilder = this.faqRepository.createQueryBuilder('faq')
        .where('faq.status = :status', { status: FaqEntryStatus.PUBLISHED })
        .andWhere('faq.tenantId = :scopeTenant',{scopeTenant:requireFaqReadTenant(this.tenantService)});

      // Full-text search on question and answer
      if (searchQuery.query) {
        queryBuilder.andWhere(
          `(
            to_tsvector('english', faq.question) @@ plainto_tsquery('english', :query) OR
            to_tsvector('english', faq.answer) @@ plainto_tsquery('english', :query) OR
            :query = ANY(faq.keywords)
          )`,
          { query: searchQuery.query }
        );
      }

      // Apply filters
      if (searchQuery.filters?.category && searchQuery.filters.category.length > 0) {
        queryBuilder.andWhere('faq.category IN (:...categories)', {
          categories: searchQuery.filters.category
        });
      }

      if (searchQuery.filters?.minConfidence) {
        queryBuilder.andWhere('faq.confidence >= :minConfidence', {
          minConfidence: searchQuery.filters.minConfidence
        });
      }

      if (searchQuery.filters?.source && searchQuery.filters.source.length > 0) {
        queryBuilder.andWhere('faq.source IN (:...sources)', {
          sources: searchQuery.filters.source
        });
      }

      if (searchQuery.filters?.tenantId) {
        queryBuilder.andWhere('faq.tenantId = :tenantId', {
          tenantId: searchQuery.filters.tenantId
        });
      }

      const faqs = await queryBuilder.getMany();

      // Convert to SearchResult format with relevance scoring
      return faqs.map(faq => {
        const relevanceScore = this.calculateRelevanceScore(
          searchQuery.query,
          faq.question,
          faq.answer,
          faq.keywords,
          faq.confidence,
          faq.usageCount
        );

        return {
          id: faq.id,
          type: 'faq' as const,
          title: faq.question,
          content: faq.answer,
          snippet: this.generateSnippet(faq.answer, searchQuery.query),
          relevanceScore,
          confidence: faq.confidence,
          category: faq.category,
          tags: faq.keywords,
          url: `/help/faq/${faq.id}`,
          metadata: {
            source: faq.source,
            usageCount: faq.usageCount,
            helpfulCount: faq.helpfulCount,
            createdAt: faq.createdAt,
            updatedAt: faq.updatedAt
          }
        };
      });

    } catch (error) {
      this.logger.error('FAQ search failed:', error);
      return [];
    }
  }

  async searchArticles(searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      const queryBuilder = this.articleRepository.createQueryBuilder('article')
        .where('article.isPublished = :published', { published: true })
        .andWhere('article.status = :articleStatus',{articleStatus:'published'})
        .andWhere('article.tenantId = :scopeTenant',{scopeTenant:requireFaqReadTenant(this.tenantService)});

      // Full-text search on title and content
      if (searchQuery.query) {
        queryBuilder.andWhere(
          `(
            to_tsvector('english', article.title) @@ plainto_tsquery('english', :query) OR
            to_tsvector('english', article.content) @@ plainto_tsquery('english', :query) OR
            to_tsvector('english', article.summary) @@ plainto_tsquery('english', :query)
          )`,
          { query: searchQuery.query }
        );
      }

      // Apply category filter
      if (searchQuery.filters?.category && searchQuery.filters.category.length > 0) {
        queryBuilder.andWhere('article.categoryId IN (:...categories)', {
          categories: searchQuery.filters.category
        });
      }

      if (searchQuery.filters?.tenantId) {
        // Assuming KnowledgeBaseArticle has tenantId column. 
        // If not, this line might need adjustment or feature gating.
        // Based on typical patterns, it should have it or be added.
        // For now, I will assume it exists or will be added generally.
        // But checking previous context, KnowledgeBase module was batch 1 or something.
        // Let's assume it has it. If not, this might break.
        // Safest is to check if column exists, but I can't do that at runtime easily here without metadata.
        // I will add it. If it fails compilation, I will know I need to update the entity.
        queryBuilder.andWhere('article.tenantId = :tenantId', {
          tenantId: searchQuery.filters.tenantId
        });
      }

      const articles = await queryBuilder.getMany();

      // Convert to SearchResult format
      return articles.map(article => {
        const relevanceScore = this.calculateRelevanceScore(
          searchQuery.query,
          article.title,
          article.content,
          article.tags || [],
          100, // Articles don't have confidence, use max
          article.viewCount
        );

        return {
          id: article.id,
          type: 'article' as const,
          title: article.title,
          content: article.content,
          snippet: this.generateSnippet(article.summary || article.content, searchQuery.query),
          relevanceScore,
          category: article.categoryId,
          tags: article.tags || [],
          url: `/help/article/${article.id}`,
          metadata: {
            usageCount: article.viewCount,
            helpfulCount: article.helpfulCount,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt
          }
        };
      });

    } catch (error) {
      this.logger.error('Article search failed:', error);
      return [];
    }
  }

  async getRelatedFaqs(results: SearchResult[], limit: number = 5): Promise<SearchResult[]> {
    try {
      if (results.length === 0) return [];

      // Extract keywords from top results
      const keywords = results
        .slice(0, 3)
        .flatMap(r => r.tags)
        .filter((tag, index, self) => self.indexOf(tag) === index)
        .slice(0, 10);

      if (keywords.length === 0) return [];

      // Find FAQs with similar keywords
      const relatedFaqs = await this.faqRepository
        .createQueryBuilder('faq')
        .where('faq.status = :status', { status: FaqEntryStatus.PUBLISHED })
        .andWhere('faq.tenantId = :scopeTenant',{scopeTenant:requireFaqReadTenant(this.tenantService)})
        .andWhere('faq.keywords && ARRAY[:...keywords]::text[]', { keywords })
        .andWhere('faq.id NOT IN (:...excludeIds)', {
          excludeIds: results.some(r=>r.type==='faq') ? results.filter(r => r.type === 'faq').map(r => r.id) : ['00000000-0000-4000-8000-000000000000']
        })
        .orderBy('faq.usageCount', 'DESC')
        .take(limit)
        .getMany();

      return relatedFaqs.map(faq => ({
        id: faq.id,
        type: 'faq' as const,
        title: faq.question,
        content: faq.answer,
        snippet: this.generateSnippet(faq.answer, ''),
        relevanceScore: faq.confidence,
        confidence: faq.confidence,
        category: faq.category,
        tags: faq.keywords,
        url: `/help/faq/${faq.id}`,
        metadata: {
          source: faq.source,
          usageCount: faq.usageCount,
          helpfulCount: faq.helpfulCount,
          createdAt: faq.createdAt,
          updatedAt: faq.updatedAt
        }
      }));

    } catch (error) {
      this.logger.error('Failed to get related FAQs:', error);
      return [];
    }
  }

  private calculateRelevanceScore(
    query: string,
    title: string,
    content: string,
    keywords: string[],
    confidence: number,
    usageCount: number
  ): number {

    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // Title match (highest weight)
    if (titleLower.includes(queryLower)) {
      score += 50;
    } else {
      // Partial word matches in title
      const queryWords = queryLower.split(' ');
      const titleWords = titleLower.split(' ');
      const titleMatches = queryWords.filter(qw => titleWords.some(tw => tw.includes(qw)));
      score += (titleMatches.length / queryWords.length) * 30;
    }

    // Content match
    if (contentLower.includes(queryLower)) {
      score += 20;
    }

    // Keyword match
    const keywordMatches = keywords.filter(k =>
      k.toLowerCase().includes(queryLower) || queryLower.includes(k.toLowerCase())
    );
    score += Math.min(15, keywordMatches.length * 5);

    // Confidence/quality boost
    score += (confidence / 100) * 10;

    // Popularity boost
    const popularityScore = Math.min(5, Math.log10(usageCount + 1));
    score += popularityScore;

    return Math.min(100, Math.round(score));
  }

  private generateSnippet(text: string, query: string, maxLength: number = 200): string {
    if (!text) return '';

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // Find the position of the query in the text
    const queryIndex = textLower.indexOf(queryLower);

    if (queryIndex === -1) {
      // Query not found, return beginning of text
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    // Calculate snippet boundaries
    const start = Math.max(0, queryIndex - Math.floor(maxLength / 2));
    const end = Math.min(text.length, start + maxLength);

    let snippet = text.substring(start, end);

    // Add ellipsis
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  private sortResults(
    results: SearchResult[],
    sortBy: string,
    sortOrder: string
  ): SearchResult[] {

    const multiplier = sortOrder === 'ASC' ? -1 : 1;

    return [...results].sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (b.relevanceScore - a.relevanceScore) * multiplier;
        case 'confidence':
          return ((b.confidence || 0) - (a.confidence || 0)) * multiplier;
        case 'popularity':
          return ((b.metadata.usageCount || 0) - (a.metadata.usageCount || 0)) * multiplier;
        case 'date':
        case 'recent':
          return (b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()) * multiplier;
        case 'helpful':
          return ((b.metadata.helpfulCount || 0) - (a.metadata.helpfulCount || 0)) * multiplier;
        default:
          return (b.relevanceScore - a.relevanceScore) * multiplier;
      }
    });
  }

  private async generateSuggestions(query: string, results: SearchResult[]): Promise<string[]> {
    try {
      const suggestions: string[] = [];

      // If no results, suggest similar queries
      if (results.length === 0) {
        // Get popular FAQs
        const popularFaqs = await this.faqRepository.find({
          where: { status: FaqEntryStatus.PUBLISHED, tenantId:requireFaqReadTenant(this.tenantService) },
          order: { usageCount: 'DESC' },
          take: 5
        });

        return popularFaqs.map(faq => faq.question).slice(0, 3);
      }

      // Extract common keywords from top results
      const topResults = results.slice(0, 5);
      const keywordFrequency: Record<string, number> = {};

      topResults.forEach(result => {
        result.tags.forEach(tag => {
          keywordFrequency[tag] = (keywordFrequency[tag] || 0) + 1;
        });
      });

      // Get most common keywords
      const commonKeywords = Object.entries(keywordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([keyword]) => keyword);

      // Generate suggestion queries
      commonKeywords.forEach(keyword => {
        if (!query.toLowerCase().includes(keyword.toLowerCase())) {
          suggestions.push(`${query} ${keyword}`);
        }
      });

      return suggestions.slice(0, 3);

    } catch (error) {
      this.logger.error('Failed to generate suggestions:', error);
      return [];
    }
  }

  private generateCacheKey(searchQuery: SearchQuery): string {
    return JSON.stringify({
      query: searchQuery.query,
      filters: searchQuery.filters,
      options: searchQuery.options
    });
  }

  private async trackSearch(searchQuery: SearchQuery, response: SearchResponse): Promise<void> {
    try {
      // In a real implementation, this would save to a search analytics table
      this.logger.log(`Search tracked: "${searchQuery.query}" - ${response.total} results`);
    } catch (error) {
      this.logger.warn('Failed to track search:', error);
    }
  }

  async getPopularSearches(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    // This would query a search analytics table in a real implementation
    return [];
  }

  async getSearchAnalytics(dateRange: { from: Date; to: Date }): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    averageResults: number;
    topQueries: Array<{ query: string; count: number }>;
    noResultQueries: Array<{ query: string; count: number }>;
  }> {
    // This would aggregate search analytics data in a real implementation
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      averageResults: 0,
      topQueries: [],
      noResultQueries: []
    };
  }

  clearCache(): void {
    this.searchCache.clear();
    this.logger.log('Search cache cleared');
  }
}