import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { ChatUrlCache, UrlProcessingStatus } from '../entities/chat-url-cache.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface CacheMetrics {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  expiredEntries: number;
  failedEntries: number;
  averageContentSize: number;
  topDomains: Array<{ domain: string; count: number }>;
  processingStatusDistribution: Record<UrlProcessingStatus, number>;
}

export interface CacheCleanupResult {
  expiredRemoved: number;
  failedRemoved: number;
  totalRemoved: number;
  remainingEntries: number;
}

@Injectable()
export class UrlCacheService {
  private readonly logger = new Logger(UrlCacheService.name);
  private readonly DEFAULT_CACHE_EXPIRY_HOURS = 24;
  private readonly MAX_CACHE_SIZE = 10000; // Maximum number of cache entries
  private readonly CLEANUP_BATCH_SIZE = 100;

  // In-memory metrics for performance tracking
  private cacheHits = 0;
  private cacheMisses = 0;
  private lastMetricsReset = Date.now();

  constructor(
    @InjectRepository(ChatUrlCache)
    private readonly urlCacheRepository: Repository<ChatUrlCache>,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Get cached URL by hash with hit/miss tracking
   */
  async getCachedUrl(urlHash: string): Promise<ChatUrlCache | null> {
    const cached = await this.urlCacheRepository.findOne({
      where: {
        urlHash,
        tenantId: this.tenantService.getTenantId()
      }
    });

    if (cached && !cached.isExpired && cached.isProcessed) {
      this.cacheHits++;
      this.logger.debug(`Cache hit for hash: ${urlHash}`);
      return cached;
    } else {
      this.cacheMisses++;
      this.logger.debug(`Cache miss for hash: ${urlHash}`);
      return null;
    }
  }

  /**
   * Store or update URL cache entry
   */
  async setCachedUrl(
    url: string,
    data: {
      title?: string;
      content?: string;
      metadata?: any;
      processingStatus?: UrlProcessingStatus;
      expiryHours?: number;
    }
  ): Promise<ChatUrlCache> {
    const urlHash = this.generateUrlHash(url);
    const expiresAt = new Date(
      Date.now() + (data.expiryHours || this.DEFAULT_CACHE_EXPIRY_HOURS) * 60 * 60 * 1000
    );

    let cacheEntry = await this.urlCacheRepository.findOne({
      where: {
        urlHash,
        tenantId: this.tenantService.getTenantId()
      }
    });

    if (cacheEntry) {
      // Update existing entry
      cacheEntry.title = data.title || cacheEntry.title;
      cacheEntry.content = data.content || cacheEntry.content;
      cacheEntry.metadata = { ...cacheEntry.metadata, ...data.metadata };
      cacheEntry.processingStatus = data.processingStatus || cacheEntry.processingStatus;
      cacheEntry.expiresAt = expiresAt;
    } else {
      // Create new entry
      cacheEntry = this.urlCacheRepository.create({
        urlHash,
        originalUrl: url,
        title: data.title,
        content: data.content,
        metadata: data.metadata || {},
        processingStatus: data.processingStatus || UrlProcessingStatus.COMPLETED,
        expiresAt,
        tenantId: this.tenantService.getTenantId(),
      });
    }

    return await this.urlCacheRepository.save(cacheEntry);
  }

  /**
   * Check if URL exists in cache and is valid
   */
  async isCached(url: string): Promise<boolean> {
    const urlHash = this.generateUrlHash(url);
    const cached = await this.getCachedUrl(urlHash);
    return cached !== null;
  }

  /**
   * Get cache entry by URL
   */
  async getCacheByUrl(url: string): Promise<ChatUrlCache | null> {
    const urlHash = this.generateUrlHash(url);
    return await this.getCachedUrl(urlHash);
  }

  /**
   * Remove cache entry by URL
   */
  async removeCacheByUrl(url: string): Promise<boolean> {
    const urlHash = this.generateUrlHash(url);
    const result = await this.urlCacheRepository.delete({
      urlHash,
      tenantId: this.tenantService.getTenantId()
    });
    return (result.affected || 0) > 0;
  }

  /**
   * Get cache entries by domain
   */
  async getCacheByDomain(domain: string, limit = 50): Promise<ChatUrlCache[]> {
    return await this.urlCacheRepository
      .createQueryBuilder('cache')
      .where('cache.originalUrl LIKE :domain', { domain: `%${domain}%` })
      .andWhere('cache.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
      .orderBy('cache.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Scheduled cleanup of expired and failed entries
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledCleanup(): Promise<void> {
    try {
      const result = await this.cleanupCache();
      if (result.totalRemoved > 0) {
        this.logger.log(
          `Scheduled cleanup completed: ${result.totalRemoved} entries removed ` +
          `(${result.expiredRemoved} expired, ${result.failedRemoved} failed)`
        );
      }
    } catch (error) {
      this.logger.error('Scheduled cleanup failed:', error);
    }
  }

  /**
   * Manual cache cleanup
   */
  async cleanupCache(options?: {
    removeExpired?: boolean;
    removeFailed?: boolean;
    olderThanDays?: number;
  }): Promise<CacheCleanupResult> {
    const {
      removeExpired = true,
      removeFailed = true,
      olderThanDays = 7
    } = options || {};

    let expiredRemoved = 0;
    let failedRemoved = 0;

    // Remove expired entries
    if (removeExpired) {
      const expiredResult = await this.urlCacheRepository
        .createQueryBuilder()
        .delete()
        .where('expiresAt < :now', { now: new Date() })
        .andWhere('tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .execute();
      expiredRemoved = expiredResult.affected || 0;
    }

    // Remove old failed entries
    if (removeFailed) {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      const failedResult = await this.urlCacheRepository
        .createQueryBuilder()
        .delete()
        .where('processingStatus = :status', { status: UrlProcessingStatus.FAILED })
        .andWhere('createdAt < :cutoff', { cutoff: cutoffDate })
        .andWhere('tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .execute();
      failedRemoved = failedResult.affected || 0;
    }

    // Enforce cache size limit
    const totalEntries = await this.urlCacheRepository.count({
      where: { tenantId: this.tenantService.getTenantId() }
    });
    let sizeLimitRemoved = 0;

    if (totalEntries > this.MAX_CACHE_SIZE) {
      const excessCount = totalEntries - this.MAX_CACHE_SIZE;
      const oldestEntries = await this.urlCacheRepository
        .createQueryBuilder('cache')
        .where('cache.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
        .orderBy('cache.createdAt', 'ASC')
        .limit(excessCount)
        .getMany();

      if (oldestEntries.length > 0) {
        const idsToRemove = oldestEntries.map(entry => entry.id);
        const sizeResult = await this.urlCacheRepository
          .createQueryBuilder()
          .delete()
          .whereInIds(idsToRemove)
          .execute();
        sizeLimitRemoved = sizeResult.affected || 0;
      }
    }

    const totalRemoved = expiredRemoved + failedRemoved + sizeLimitRemoved;
    const remainingEntries = await this.urlCacheRepository.count({
      where: { tenantId: this.tenantService.getTenantId() }
    });

    return {
      expiredRemoved,
      failedRemoved: failedRemoved + sizeLimitRemoved,
      totalRemoved,
      remainingEntries,
    };
  }

  /**
   * Get comprehensive cache metrics
   */
  async getCacheMetrics(): Promise<CacheMetrics> {
    // Basic counts
    const [
      totalEntries,
      expiredEntries,
      completedEntries,
      failedEntries,
      pendingEntries,
      processingEntries
    ] = await Promise.all([
      this.urlCacheRepository.count({ where: { tenantId: this.tenantService.getTenantId() } }),
      this.urlCacheRepository.count({ where: { expiresAt: LessThan(new Date()), tenantId: this.tenantService.getTenantId() } }),
      this.urlCacheRepository.count({ where: { processingStatus: UrlProcessingStatus.COMPLETED, tenantId: this.tenantService.getTenantId() } }),
      this.urlCacheRepository.count({ where: { processingStatus: UrlProcessingStatus.FAILED, tenantId: this.tenantService.getTenantId() } }),
      this.urlCacheRepository.count({ where: { processingStatus: UrlProcessingStatus.PENDING, tenantId: this.tenantService.getTenantId() } }),
      this.urlCacheRepository.count({ where: { processingStatus: UrlProcessingStatus.PROCESSING, tenantId: this.tenantService.getTenantId() } }),
    ]);

    // Calculate hit/miss rates
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    const missRate = totalRequests > 0 ? (this.cacheMisses / totalRequests) * 100 : 0;

    // Average content size
    const avgSizeResult = await this.urlCacheRepository
      .createQueryBuilder('cache')
      .select('AVG(LENGTH(cache.content))', 'avgSize')
      .where('cache.content IS NOT NULL')
      .andWhere('cache.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
      .getRawOne();
    const averageContentSize = Math.round(avgSizeResult?.avgSize || 0);

    // Top domains
    const topDomainsResult = await this.urlCacheRepository
      .createQueryBuilder('cache')
      .select('SUBSTRING_INDEX(SUBSTRING_INDEX(cache.originalUrl, "://", -1), "/", 1)', 'domain')
      .addSelect('COUNT(*)', 'count')
      .where('cache.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() })
      .groupBy('domain')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topDomains = topDomainsResult.map(row => ({
      domain: row.domain,
      count: parseInt(row.count, 10),
    }));

    // Processing status distribution
    const processingStatusDistribution = {
      [UrlProcessingStatus.COMPLETED]: completedEntries,
      [UrlProcessingStatus.FAILED]: failedEntries,
      [UrlProcessingStatus.PENDING]: pendingEntries,
      [UrlProcessingStatus.PROCESSING]: processingEntries,
    };

    return {
      totalEntries,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      expiredEntries,
      failedEntries,
      averageContentSize,
      topDomains,
      processingStatusDistribution,
    };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.lastMetricsReset = Date.now();
    this.logger.log('Cache metrics reset');
  }

  /**
   * Get cache entries with pagination
   */
  async getCacheEntries(options?: {
    page?: number;
    limit?: number;
    status?: UrlProcessingStatus;
    domain?: string;
    sortBy?: 'createdAt' | 'expiresAt' | 'title';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    entries: ChatUrlCache[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 50,
      status,
      domain,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = options || {};

    const queryBuilder = this.urlCacheRepository.createQueryBuilder('cache');

    // Apply filters
    queryBuilder.where('cache.tenantId = :tenantId', { tenantId: this.tenantService.getTenantId() });

    if (status) {
      queryBuilder.andWhere('cache.processingStatus = :status', { status });
    }

    if (domain) {
      queryBuilder.andWhere('cache.originalUrl LIKE :domain', { domain: `%${domain}%` });
    }

    // Apply sorting
    queryBuilder.orderBy(`cache.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [entries, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      entries,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Bulk update cache entries
   */
  async bulkUpdateStatus(
    urlHashes: string[],
    status: UrlProcessingStatus
  ): Promise<number> {
    const result = await this.urlCacheRepository
      .createQueryBuilder()
      .update()
      .set({ processingStatus: status })
      .whereInIds(urlHashes)
      .execute();

    return result.affected || 0;
  }

  /**
   * Generate URL hash for deduplication
   */
  private generateUrlHash(url: string): string {
    // Normalize URL before hashing
    try {
      const urlObj = new URL(url);
      // Remove fragment and normalize
      urlObj.hash = '';
      const normalizedUrl = urlObj.toString().toLowerCase();
      return crypto.createHash('sha256').update(normalizedUrl).digest('hex');
    } catch {
      // Fallback for invalid URLs
      return crypto.createHash('sha256').update(url.toLowerCase()).digest('hex');
    }
  }

  /**
   * Preload cache for common URLs
   */
  async preloadUrls(urls: string[]): Promise<{
    processed: number;
    failed: number;
    alreadyCached: number;
  }> {
    let processed = 0;
    let failed = 0;
    let alreadyCached = 0;

    for (const url of urls) {
      try {
        const exists = await this.isCached(url);
        if (exists) {
          alreadyCached++;
          continue;
        }

        // Create pending entry for processing
        await this.setCachedUrl(url, {
          processingStatus: UrlProcessingStatus.PENDING,
        });
        processed++;
      } catch (error) {
        this.logger.error(`Failed to preload URL ${url}:`, error);
        failed++;
      }
    }

    this.logger.log(
      `Preload completed: ${processed} queued, ${alreadyCached} already cached, ${failed} failed`
    );

    return { processed, failed, alreadyCached };
  }
}