import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { publicUrlFetcher, PublicUrlHttpError } from '../../../core/network/public-url-fetcher';
import robotsParser from 'robots-parser';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { ChatUrlCache, UrlProcessingStatus } from '../entities/chat-url-cache.entity';
import { UrlValidator } from '../utils/url-validator.util';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface UrlProcessingResult {
  success: boolean;
  cached: boolean;
  data?: {
    title: string;
    content: string;
    metadata: any;
  };
  error?: string;
}

@Injectable()
export class UrlProcessorService {
  private readonly logger = new Logger(UrlProcessorService.name);
  private readonly rateLimitMap = new Map<string, number>();
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests per domain
  private readonly CACHE_EXPIRY_HOURS = 24;
  private readonly MAX_CONTENT_LENGTH = 50000;

  constructor(
    @InjectRepository(ChatUrlCache)
    private readonly urlCacheRepository: Repository<ChatUrlCache>,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Process a URL and extract content with caching
   */
  async processUrl(url: string, options: { forceRefresh?: boolean } = {}): Promise<UrlProcessingResult> {
    try {
      // Validate URL
      const validation = UrlValidator.validate(url);
      if (!validation.isValid) {
        return { success: false, cached: false, error: validation.error };
      }

      // Use normalized URL for processing
      url = validation.normalizedUrl!;

      const urlHash = this.generateUrlHash(url);

      // Check cache first
      const cached = await this.getCachedUrl(urlHash);
      if (!options.forceRefresh && cached && !cached.isExpired && cached.isProcessed) {
        this.logger.debug(`Cache hit for URL: ${url}`);
        return {
          success: true,
          cached: true,
          data: {
            title: cached.title || '',
            content: cached.content || '',
            metadata: cached.metadata,
          },
        };
      }

      // Check robots.txt compliance
      const robotsAllowed = await this.checkRobotsCompliance(url);
      if (!robotsAllowed) {
        return { success: false, cached: false, error: 'Robots.txt disallows crawling' };
      }

      // Apply rate limiting
      await this.applyRateLimit(url);

      // Fetch before touching the prior usable cache entry; failures retain it unchanged.
      const extractionResult = await this.extractContent(url);
      if (!extractionResult.success) {
        return { success: false, cached: false, error: extractionResult.error };
      }
      const cacheEntry = Object.assign(new ChatUrlCache(), cached, {
        urlHash,
        originalUrl: url,
        title: extractionResult.title,
        content: extractionResult.content,
        processingStatus: UrlProcessingStatus.COMPLETED,
        expiresAt: new Date(Date.now() + this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000),
        tenantId: this.tenantService.getTenantId(),
        metadata: { ...cached?.metadata, ...extractionResult.metadata, robotsAllowed, extractionMethod: extractionResult.method },
      });
      await this.urlCacheRepository.save(cacheEntry);

      if (extractionResult.success) {
        return {
          success: true,
          cached: false,
          data: {
            title: cacheEntry.title || '',
            content: cacheEntry.content || '',
            metadata: cacheEntry.metadata,
          },
        };
      } else {
        return { success: false, cached: false, error: extractionResult.error };
      }

    } catch (error) {
      this.logger.error(`Error processing URL ${url}:`, error);
      return { success: false, cached: false, error: error.message };
    }
  }

  /**
   * Extract static content from a validated public URL
   */
  private async extractContent(url: string): Promise<{
    success: boolean;
    title?: string;
    content?: string;
    metadata?: any;
    method?: string;
    error?: string;
  }> {
    // Static-only fetch; dynamic rendering requires a separately isolated egress proxy.
    try {
      const cheerioResult = await this.extractWithCheerio(url);
      return { ...cheerioResult, method: 'cheerio' };
    } catch (error) {
      this.logger.error(`All extraction methods failed for ${url}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract content using Cheerio for static content
   */
  private async extractWithCheerio(url: string): Promise<{
    success: boolean;
    title?: string;
    content?: string;
    metadata?: any;
    error?: string;
  }> {

    const response = await publicUrlFetcher.fetch(url);
    const contentType = String(response.headers['content-type'] || '');
    if (!/^(text\/html|application\/xhtml\+xml|text\/plain)(?:;|$)/i.test(contentType)) {
      throw new Error('Unsupported URL content type');
    }
    const html = response.text;
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside').remove();

    // Extract title
    const title = $('title').text() ||
      $('h1').first().text() ||
      $('meta[property="og:title"]').attr('content') || '';

    // Extract main content
    const contentSelectors = [
      'main', 'article', '[role="main"]', '.content', '.post-content',
      '.entry-content', '.article-content', '.page-content'
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        content = element.text();
        break;
      }
    }

    // Fallback to body
    if (!content) {
      content = $('body').text();
    }

    // Clean up content
    if (contentType.startsWith('text/plain')) content = response.text;
    content = content.replace(/\s+/g, ' ').trim();
    if (!content) throw new Error('No readable static content; isolated dynamic rendering is not supported');

    // Limit content length
    if (content.length > this.MAX_CONTENT_LENGTH) {
      content = content.substring(0, this.MAX_CONTENT_LENGTH) + '...';
    }

    // Extract metadata
    const getMetaContent = (name: string) =>
      $(`meta[name="${name}"], meta[property="${name}"]`).attr('content') || '';

    const metadata = {
      description: getMetaContent('description') || getMetaContent('og:description'),
      author: getMetaContent('author'),
      publishedDate: getMetaContent('article:published_time') || getMetaContent('datePublished'),
      imageUrl: getMetaContent('og:image'),
      siteName: getMetaContent('og:site_name'),
      contentType: getMetaContent('og:type'),
      wordCount: content.split(' ').length,
      statusCode: response.status,
    };

    return {
      success: true,
      title: title.trim(),
      content,
      metadata,
    };
  }

  /**
   * Check robots.txt compliance
   */
  private async checkRobotsCompliance(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      const response = await publicUrlFetcher.fetch(robotsUrl, { timeoutMs: 10000, maxBytes: 512 * 1024 });
      const robotsTxt = response.text;
      const robots = robotsParser(robotsUrl, robotsTxt);

      return robots.isAllowed(url, 'AI-Support-Bot') !== false;
    } catch (error) {
      this.logger.warn(`Could not check robots.txt for ${url}:`, error.message);
      // A missing policy is allowed; network/policy errors fail closed.
      return error instanceof PublicUrlHttpError && [404, 410].includes(error.status);
    }
  }

  /**
   * Apply rate limiting per domain
   */
  private async applyRateLimit(url: string): Promise<void> {
    try {
      const domain = new URL(url).hostname;
      const lastRequest = this.rateLimitMap.get(domain) || 0;
      const timeSinceLastRequest = Date.now() - lastRequest;

      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      this.rateLimitMap.set(domain, Date.now());
    } catch (error) {
      // If URL parsing fails, skip rate limiting
      this.logger.warn(`Could not apply rate limiting for ${url}:`, error.message);
    }
  }

  /**
   * Get cached URL entry
   */
  private async getCachedUrl(urlHash: string): Promise<ChatUrlCache | null> {
    return await this.urlCacheRepository.findOne({
      where: {
        urlHash,
        tenantId: this.tenantService.getTenantId()
      }
    });
  }

  /**
   * Generate hash for URL
   */
  private generateUrlHash(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }



  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<number> {
    const result = await this.urlCacheRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .andWhere('tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} expired cache entries`);
    return result.affected || 0;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    expired: number;
  }> {
    const [total, completed, failed, pending, expired] = await Promise.all([
      this.urlCacheRepository.count({ where: { tenantId: this.tenantService.getTenantId() } }),
      this.urlCacheRepository.count({ where: { processingStatus: UrlProcessingStatus.COMPLETED, tenantId: this.tenantService.getTenantId() } }),
      this.urlCacheRepository.count({ where: { processingStatus: UrlProcessingStatus.FAILED, tenantId: this.tenantService.getTenantId() } }),
      this.urlCacheRepository.count({ where: { processingStatus: UrlProcessingStatus.PENDING, tenantId: this.tenantService.getTenantId() } }),
      this.urlCacheRepository
        .createQueryBuilder()
        .where('expiresAt < :now', { now: new Date() })
        .andWhere('tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .getCount(),
    ]);

    return { total, completed, failed, pending, expired };
  }
}