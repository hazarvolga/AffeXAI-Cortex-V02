/**
 * Bulk Operation Performance Optimizer
 * 
 * Comprehensive performance optimization for bulk operations including:
 * - Memory-efficient streaming for large files
 * - Database query optimization for exports
 * - Caching strategies for validation results
 * - Resource management and monitoring
 * - Adaptive batch sizing
 */

import { bulkOperationLogger, LogLevel, LogCategory } from '../logging/bulk-operation-logger';
import { bulkOperationMetrics } from '../monitoring/bulk-operation-metrics';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface StreamingOptions {
  chunkSize: number;
  maxMemoryUsage: number; // in bytes
  enableCompression: boolean;
  bufferSize: number;
  parallelStreams: number;
}

export interface CacheOptions {
  ttl: number; // time to live in seconds
  maxSize: number; // maximum cache size
  compressionEnabled: boolean;
  persistToDisk: boolean;
}

export interface QueryOptimizationOptions {
  batchSize: number;
  indexHints: string[];
  selectFields: string[];
  useReadReplica: boolean;
  enableQueryCache: boolean;
}

export interface PerformanceProfile {
  operationType: 'import' | 'export' | 'validation';
  dataSize: 'small' | 'medium' | 'large' | 'xlarge';
  recommendedBatchSize: number;
  recommendedChunkSize: number;
  recommendedParallelism: number;
  memoryLimit: number;
  estimatedDuration: number;
}

export interface ResourceUsage {
  timestamp: Date;
  memoryUsed: number;
  cpuUsage: number;
  diskIO: number;
  networkIO: number;
  activeConnections: number;
}

export interface OptimizationResult {
  originalDuration: number;
  optimizedDuration: number;
  improvementPercentage: number;
  memoryReduction: number;
  resourceSavings: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

// ============================================================================
// Streaming Processor
// ============================================================================

export class StreamingProcessor {
  private options: StreamingOptions;
  private activeStreams: Map<string, NodeJS.ReadableStream> = new Map();
  private resourceMonitor: ResourceMonitor;

  constructor(options: Partial<StreamingOptions> = {}) {
    this.options = {
      chunkSize: 1000,
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      enableCompression: true,
      bufferSize: 64 * 1024, // 64KB
      parallelStreams: 4,
      ...options
    };
    this.resourceMonitor = new ResourceMonitor();
  }

  /**
   * Process large CSV file with memory-efficient streaming
   */
  async *processLargeCSV(
    filePath: string,
    processor: (chunk: any[]) => Promise<any[]>
  ): AsyncGenerator<any[], void, unknown> {
    const streamId = this.generateStreamId();

    try {
      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.PERFORMANCE,
        `Starting streaming CSV processing: ${filePath}`,
        { userId: 'system', operation: 'stream_csv' },
        { streamId, chunkSize: this.options.chunkSize }
      );

      // Create readable stream with optimized buffer size
      const stream = await this.createOptimizedStream(filePath);
      this.activeStreams.set(streamId, stream);

      let chunk: any[] = [];
      let totalProcessed = 0;
      let lineNumber = 0;

      // Process stream line by line
      for await (const line of this.readLines(stream)) {
        lineNumber++;

        // Parse CSV line (simplified - in production use proper CSV parser)
        const parsedLine = this.parseCSVLine(line);
        if (parsedLine) {
          chunk.push(parsedLine);
        }

        // Process chunk when it reaches the configured size
        if (chunk.length >= this.options.chunkSize) {
          const processedChunk = await this.processChunkWithResourceMonitoring(
            chunk,
            processor,
            streamId
          );

          totalProcessed += processedChunk.length;
          yield processedChunk;

          // Clear chunk and check memory usage
          chunk = [];
          await this.checkMemoryUsage(streamId);
        }
      }

      // Process remaining items in the last chunk
      if (chunk.length > 0) {
        const processedChunk = await this.processChunkWithResourceMonitoring(
          chunk,
          processor,
          streamId
        );
        totalProcessed += processedChunk.length;
        yield processedChunk;
      }

      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.PERFORMANCE,
        `Completed streaming CSV processing`,
        { userId: 'system', operation: 'stream_csv' },
        { streamId, totalProcessed, totalLines: lineNumber }
      );

    } catch (error) {
      bulkOperationLogger.log(
        LogLevel.ERROR,
        LogCategory.PERFORMANCE,
        `Streaming CSV processing failed`,
        { userId: 'system', operation: 'stream_csv' },
        { streamId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
      throw error;
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Stream large dataset export with memory optimization
   */
  async *streamExportData(
    query: () => AsyncGenerator<any[], void, unknown>,
    formatter: (data: any[]) => string
  ): AsyncGenerator<string, void, unknown> {
    const streamId = this.generateStreamId();
    let totalExported = 0;

    try {
      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.PERFORMANCE,
        `Starting streaming export`,
        { userId: 'system', operation: 'stream_export' },
        { streamId }
      );

      for await (const batch of query()) {
        // Format batch data
        const formattedData = formatter(batch);
        totalExported += batch.length;

        yield formattedData;

        // Monitor resource usage
        await this.checkMemoryUsage(streamId);

        // Log progress periodically
        if (totalExported % 10000 === 0) {
          bulkOperationLogger.log(
            LogLevel.DEBUG,
            LogCategory.PERFORMANCE,
            `Export progress: ${totalExported} records`,
            { userId: 'system', operation: 'stream_export' },
            { streamId, totalExported }
          );
        }
      }

      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.PERFORMANCE,
        `Completed streaming export`,
        { userId: 'system', operation: 'stream_export' },
        { streamId, totalExported }
      );

    } catch (error) {
      bulkOperationLogger.log(
        LogLevel.ERROR,
        LogCategory.PERFORMANCE,
        `Streaming export failed`,
        { userId: 'system', operation: 'stream_export' },
        { streamId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
      throw error;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createOptimizedStream(filePath: string): Promise<NodeJS.ReadableStream> {
    // In a real implementation, this would create an optimized file stream
    // For now, we'll simulate it
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        // Simulate reading file content
        for (let i = 0; i < 1000; i++) {
          yield `line_${i},data_${i},value_${i}`;
        }
      }
    } as any;

    return mockStream;
  }

  private async *readLines(stream: NodeJS.ReadableStream): AsyncGenerator<string, void, unknown> {
    // In a real implementation, this would properly read lines from the stream
    // For now, we'll simulate it
    for await (const chunk of stream) {
      const line = Buffer.isBuffer(chunk) ? chunk.toString() : chunk;
      yield line;
    }
  }

  private parseCSVLine(line: string): any | null {
    // Simplified CSV parsing - in production use proper CSV parser
    if (!line.trim()) return null;

    const values = line.split(',').map(v => v.trim());
    return {
      field1: values[0] || '',
      field2: values[1] || '',
      field3: values[2] || ''
    };
  }

  private async processChunkWithResourceMonitoring(
    chunk: any[],
    processor: (chunk: any[]) => Promise<any[]>,
    streamId: string
  ): Promise<any[]> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await processor(chunk);

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const duration = endTime - startTime;
      const memoryDelta = endMemory - startMemory;

      // Record performance metrics
      bulkOperationMetrics.recordOperationMetrics('import', {
        duration,
        recordsProcessed: chunk.length,
        errorCount: 0,
        memoryUsed: memoryDelta,
        success: true
      });

      return result;
    } catch (error) {
      bulkOperationMetrics.recordOperationMetrics('import', {
        duration: Date.now() - startTime,
        recordsProcessed: 0,
        errorCount: 1,
        success: false
      });
      throw error;
    }
  }

  private async checkMemoryUsage(streamId: string): Promise<void> {
    const memoryUsage = process.memoryUsage();

    if (memoryUsage.heapUsed > this.options.maxMemoryUsage) {
      bulkOperationLogger.log(
        LogLevel.WARN,
        LogCategory.PERFORMANCE,
        `Memory usage exceeded threshold`,
        { userId: 'system', operation: 'memory_check' },
        {
          streamId,
          currentUsage: memoryUsage.heapUsed,
          threshold: this.options.maxMemoryUsage
        }
      );

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Wait a bit to allow memory cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// ============================================================================
// Query Optimizer
// ============================================================================

export class QueryOptimizer {
  private options: QueryOptimizationOptions;
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor(options: Partial<QueryOptimizationOptions> = {}) {
    this.options = {
      batchSize: 1000,
      indexHints: [],
      selectFields: [],
      useReadReplica: true,
      enableQueryCache: true,
      ...options
    };
  }

  /**
   * Optimize export query for large datasets
   */
  async *optimizedExportQuery(
    baseQuery: string,
    filters: Record<string, any>,
    totalEstimatedRows: number
  ): AsyncGenerator<any[], void, unknown> {
    const queryId = this.generateQueryId(baseQuery, filters);

    try {
      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.PERFORMANCE,
        `Starting optimized export query`,
        { userId: 'system', operation: 'optimized_query' },
        { queryId, estimatedRows: totalEstimatedRows }
      );

      // Determine optimal batch size based on data size
      const optimalBatchSize = this.calculateOptimalBatchSize(totalEstimatedRows);

      let offset = 0;
      let totalFetched = 0;

      while (totalFetched < totalEstimatedRows) {
        const batchQuery = this.buildOptimizedBatchQuery(
          baseQuery,
          filters,
          offset,
          optimalBatchSize
        );

        // Check cache first
        const cachedResult = this.getCachedQuery(batchQuery);
        if (cachedResult) {
          yield cachedResult;
          totalFetched += cachedResult.length;
          offset += optimalBatchSize;
          continue;
        }

        // Execute optimized query
        const startTime = Date.now();
        const batch = await this.executeBatchQuery(batchQuery);
        const duration = Date.now() - startTime;

        // Cache result if enabled
        if (this.options.enableQueryCache) {
          this.cacheQuery(batchQuery, batch, 300); // 5 minutes TTL
        }

        // Log performance
        bulkOperationLogger.log(
          LogLevel.DEBUG,
          LogCategory.PERFORMANCE,
          `Query batch completed`,
          { userId: 'system', operation: 'query_batch' },
          {
            queryId,
            batchSize: batch.length,
            duration,
            offset,
            throughput: Math.round((batch.length / duration) * 1000)
          }
        );

        yield batch;

        totalFetched += batch.length;
        offset += optimalBatchSize;

        // Break if we got fewer results than expected (end of data)
        if (batch.length < optimalBatchSize) {
          break;
        }

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.PERFORMANCE,
        `Completed optimized export query`,
        { userId: 'system', operation: 'optimized_query' },
        { queryId, totalFetched }
      );

    } catch (error) {
      bulkOperationLogger.log(
        LogLevel.ERROR,
        LogCategory.PERFORMANCE,
        `Optimized export query failed`,
        { userId: 'system', operation: 'optimized_query' },
        { queryId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
      throw error;
    }
  }

  /**
   * Optimize import queries for batch inserts
   */
  async optimizedBatchInsert(
    tableName: string,
    records: any[],
    options: { upsert?: boolean; conflictFields?: string[] } = {}
  ): Promise<{ inserted: number; updated: number; errors: number }> {
    const operationId = this.generateQueryId(`insert_${tableName}`, options);

    try {
      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.PERFORMANCE,
        `Starting optimized batch insert`,
        { userId: 'system', operation: 'batch_insert' },
        { operationId, recordCount: records.length, tableName }
      );

      // Split into optimal batch sizes
      const optimalBatchSize = this.calculateOptimalBatchSize(records.length, 'insert');
      const batches = this.splitIntoBatches(records, optimalBatchSize);

      let totalInserted = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const startTime = Date.now();

        try {
          const result = await this.executeBatchInsert(tableName, batch, options);
          totalInserted += result.inserted;
          totalUpdated += result.updated;

          const duration = Date.now() - startTime;

          bulkOperationLogger.log(
            LogLevel.DEBUG,
            LogCategory.PERFORMANCE,
            `Batch insert completed`,
            { userId: 'system', operation: 'batch_insert' },
            {
              operationId,
              batchIndex: i + 1,
              batchSize: batch.length,
              duration,
              throughput: Math.round((batch.length / duration) * 1000)
            }
          );

        } catch (error) {
          totalErrors += batch.length;

          bulkOperationLogger.log(
            LogLevel.ERROR,
            LogCategory.PERFORMANCE,
            `Batch insert failed`,
            { userId: 'system', operation: 'batch_insert' },
            {
              operationId,
              batchIndex: i + 1,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          );
        }

        // Small delay between batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const result = { inserted: totalInserted, updated: totalUpdated, errors: totalErrors };

      bulkOperationLogger.log(
        LogLevel.INFO,
        LogCategory.PERFORMANCE,
        `Completed optimized batch insert`,
        { userId: 'system', operation: 'batch_insert' },
        { operationId, ...result }
      );

      return result;

    } catch (error) {
      bulkOperationLogger.log(
        LogLevel.ERROR,
        LogCategory.PERFORMANCE,
        `Optimized batch insert failed`,
        { userId: 'system', operation: 'batch_insert' },
        { operationId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
      throw error;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateQueryId(query: string, params: any): string {
    const hash = this.simpleHash(query + JSON.stringify(params));
    return `query_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private calculateOptimalBatchSize(totalRows: number, operation: 'select' | 'insert' = 'select'): number {
    if (operation === 'insert') {
      // For inserts, use smaller batches to avoid lock contention
      if (totalRows > 100000) return 500;
      if (totalRows > 10000) return 250;
      return 100;
    }

    // For selects, use larger batches for better throughput
    if (totalRows > 1000000) return 5000;
    if (totalRows > 100000) return 2000;
    if (totalRows > 10000) return 1000;
    return 500;
  }

  private buildOptimizedBatchQuery(
    baseQuery: string,
    filters: Record<string, any>,
    offset: number,
    limit: number
  ): string {
    // In a real implementation, this would build an optimized SQL query
    // with proper indexing hints and field selection
    let query = baseQuery;

    // Add filters
    const whereClause = Object.entries(filters)
      .map(([key, value]) => `${key} = '${value}'`)
      .join(' AND ');

    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    // Add field selection if specified
    if (this.options.selectFields.length > 0) {
      query = query.replace('SELECT *', `SELECT ${this.options.selectFields.join(', ')}`);
    }

    // Add index hints if specified
    if (this.options.indexHints.length > 0) {
      query += ` USE INDEX (${this.options.indexHints.join(', ')})`;
    }

    // Add pagination
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    return query;
  }

  private async executeBatchQuery(query: string): Promise<any[]> {
    // In a real implementation, this would execute the actual database query
    // For now, we'll simulate it
    const batchSize = Math.floor(Math.random() * 1000) + 500;
    const batch = [];

    for (let i = 0; i < batchSize; i++) {
      batch.push({
        id: i,
        email: `user${i}@example.com`,
        name: `User ${i}`,
        createdAt: new Date()
      });
    }

    // Simulate query execution time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    return batch;
  }

  private async executeBatchInsert(
    tableName: string,
    records: any[],
    options: { upsert?: boolean; conflictFields?: string[] }
  ): Promise<{ inserted: number; updated: number }> {
    // In a real implementation, this would execute the actual batch insert
    // For now, we'll simulate it

    // Simulate insert execution time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

    const inserted = options.upsert ? Math.floor(records.length * 0.7) : records.length;
    const updated = options.upsert ? records.length - inserted : 0;

    return { inserted, updated };
  }

  private splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private getCachedQuery(query: string): any[] | null {
    if (!this.options.enableQueryCache) return null;

    const cached = this.queryCache.get(query);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.queryCache.delete(query);
      return null;
    }

    return cached.data;
  }

  private cacheQuery(query: string, data: any[], ttl: number): void {
    if (!this.options.enableQueryCache) return;

    this.queryCache.set(query, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Clean up old cache entries periodically
    if (this.queryCache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl * 1000) {
        this.queryCache.delete(key);
      }
    }
  }
}

// ============================================================================
// Validation Cache
// ============================================================================

export class ValidationCache {
  private cache: Map<string, { result: any; timestamp: number; ttl: number }> = new Map();
  private options: CacheOptions;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      ttl: 3600, // 1 hour
      maxSize: 10000,
      compressionEnabled: true,
      persistToDisk: false,
      ...options
    };
  }

  /**
   * Get cached validation result
   */
  get(email: string): any | null {
    const key = this.generateCacheKey(email);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    bulkOperationLogger.log(
      LogLevel.DEBUG,
      LogCategory.PERFORMANCE,
      `Validation cache hit`,
      { userId: 'system', operation: 'cache_hit' },
      { email: this.maskEmail(email) }
    );

    return cached.result;
  }

  /**
   * Set validation result in cache
   */
  set(email: string, result: any, customTtl?: number): void {
    const key = this.generateCacheKey(email);
    const ttl = customTtl || this.options.ttl;

    // Check cache size limit
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      result: this.options.compressionEnabled ? this.compress(result) : result,
      timestamp: Date.now(),
      ttl
    });

    bulkOperationLogger.log(
      LogLevel.DEBUG,
      LogCategory.PERFORMANCE,
      `Validation result cached`,
      { userId: 'system', operation: 'cache_set' },
      { email: this.maskEmail(email), ttl }
    );
  }

  /**
   * Clear expired cache entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl * 1000) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      bulkOperationLogger.log(
        LogLevel.DEBUG,
        LogCategory.PERFORMANCE,
        `Validation cache cleanup completed`,
        { userId: 'system', operation: 'cache_cleanup' },
        { cleanedCount, remainingCount: this.cache.size }
      );
    }

    return cleanedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
    oldestEntry: Date | null;
  } {
    let oldestTimestamp = Date.now();
    let totalMemory = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
      }

      // Estimate memory usage (simplified)
      totalMemory += JSON.stringify(value).length * 2; // rough estimate
    }

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      memoryUsage: totalMemory,
      oldestEntry: this.cache.size > 0 ? new Date(oldestTimestamp) : null
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateCacheKey(email: string): string {
    // Simple hash for email (in production, use proper hashing)
    return `validation_${this.simpleHash(email.toLowerCase())}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '[invalid-email]';

    const maskedLocal = local.length > 2
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local;

    return `${maskedLocal}@${domain}`;
  }

  private compress(data: any): any {
    // In a real implementation, use proper compression
    // For now, just return the data as-is
    return data;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// ============================================================================
// Resource Monitor
// ============================================================================

export class ResourceMonitor {
  private resourceHistory: ResourceUsage[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Start resource monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.recordResourceUsage();
    }, intervalMs);
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get current resource usage
   */
  getCurrentUsage(): ResourceUsage {
    const memoryUsage = process.memoryUsage();

    return {
      timestamp: new Date(),
      memoryUsed: memoryUsage.heapUsed,
      cpuUsage: 0, // Would need proper CPU monitoring
      diskIO: 0, // Would need proper disk I/O monitoring
      networkIO: 0, // Would need proper network I/O monitoring
      activeConnections: 0 // Would need proper connection monitoring
    };
  }

  /**
   * Get resource usage history
   */
  getUsageHistory(minutes: number = 60): ResourceUsage[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.resourceHistory.filter(usage => usage.timestamp >= cutoff);
  }

  private recordResourceUsage(): void {
    const usage = this.getCurrentUsage();
    this.resourceHistory.push(usage);

    // Keep only last 24 hours of data
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.resourceHistory = this.resourceHistory.filter(u => u.timestamp >= cutoff);
  }
}

// ============================================================================
// Performance Profile Manager
// ============================================================================

export class PerformanceProfileManager {
  private profiles: Map<string, PerformanceProfile> = new Map();

  constructor() {
    this.initializeDefaultProfiles();
  }

  /**
   * Get performance profile for operation
   */
  getProfile(
    operationType: 'import' | 'export' | 'validation',
    recordCount: number
  ): PerformanceProfile {
    const dataSize = this.categorizeDataSize(recordCount);
    const profileKey = `${operationType}_${dataSize}`;

    return this.profiles.get(profileKey) || this.getDefaultProfile(operationType, dataSize);
  }

  /**
   * Update performance profile based on actual results
   */
  updateProfile(
    operationType: 'import' | 'export' | 'validation',
    recordCount: number,
    actualDuration: number,
    actualMemoryUsage: number
  ): void {
    const dataSize = this.categorizeDataSize(recordCount);
    const profileKey = `${operationType}_${dataSize}`;
    const currentProfile = this.profiles.get(profileKey);

    if (currentProfile) {
      // Update profile with actual performance data
      const updatedProfile: PerformanceProfile = {
        ...currentProfile,
        estimatedDuration: Math.round((currentProfile.estimatedDuration + actualDuration) / 2),
        memoryLimit: Math.max(currentProfile.memoryLimit, actualMemoryUsage * 1.2)
      };

      this.profiles.set(profileKey, updatedProfile);

      bulkOperationLogger.log(
        LogLevel.DEBUG,
        LogCategory.PERFORMANCE,
        `Performance profile updated`,
        { userId: 'system', operation: 'profile_update' },
        { profileKey, estimatedDuration: updatedProfile.estimatedDuration }
      );
    }
  }

  private categorizeDataSize(recordCount: number): 'small' | 'medium' | 'large' | 'xlarge' {
    if (recordCount > 100000) return 'xlarge';
    if (recordCount > 10000) return 'large';
    if (recordCount > 1000) return 'medium';
    return 'small';
  }

  private getDefaultProfile(
    operationType: 'import' | 'export' | 'validation',
    dataSize: 'small' | 'medium' | 'large' | 'xlarge'
  ): PerformanceProfile {
    const baseProfile = {
      operationType,
      dataSize,
      recommendedBatchSize: 1000,
      recommendedChunkSize: 1000,
      recommendedParallelism: 2,
      memoryLimit: 256 * 1024 * 1024, // 256MB
      estimatedDuration: 60000 // 1 minute
    };

    // Adjust based on data size
    switch (dataSize) {
      case 'xlarge':
        return {
          ...baseProfile,
          recommendedBatchSize: 5000,
          recommendedChunkSize: 2000,
          recommendedParallelism: 4,
          memoryLimit: 1024 * 1024 * 1024, // 1GB
          estimatedDuration: 1800000 // 30 minutes
        };
      case 'large':
        return {
          ...baseProfile,
          recommendedBatchSize: 2000,
          recommendedChunkSize: 1500,
          recommendedParallelism: 3,
          memoryLimit: 512 * 1024 * 1024, // 512MB
          estimatedDuration: 600000 // 10 minutes
        };
      case 'medium':
        return {
          ...baseProfile,
          recommendedBatchSize: 1000,
          recommendedChunkSize: 1000,
          recommendedParallelism: 2,
          memoryLimit: 256 * 1024 * 1024, // 256MB
          estimatedDuration: 120000 // 2 minutes
        };
      default:
        return baseProfile;
    }
  }

  private initializeDefaultProfiles(): void {
    const operations: Array<'import' | 'export' | 'validation'> = ['import', 'export', 'validation'];
    const sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge'];

    for (const operation of operations) {
      for (const size of sizes) {
        const profile = this.getDefaultProfile(operation, size);
        this.profiles.set(`${operation}_${size}`, profile);
      }
    }
  }
}

// ============================================================================
// Singleton Instances
// ============================================================================

export const streamingProcessor = new StreamingProcessor();
export const queryOptimizer = new QueryOptimizer();
export const validationCache = new ValidationCache();
export const resourceMonitor = new ResourceMonitor();
export const performanceProfileManager = new PerformanceProfileManager();

export default {
  streamingProcessor,
  queryOptimizer,
  validationCache,
  resourceMonitor,
  performanceProfileManager
};