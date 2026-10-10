import { IsUrl, MaxLength, IsOptional, IsBoolean, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { UserRole } from '../../users/enums/user-role.enum';
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { PlatformAdminGuard } from '../../../core/auth/guards/platform-admin.guard';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { UrlProcessorService } from '../services/url-processor.service';
import { UrlCacheService } from '../services/url-cache.service';
import { UrlProcessingStatus } from '../entities/chat-url-cache.entity';

class ProcessUrlDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048)
  url: string;
  @IsOptional() @IsBoolean()
  forceRefresh?: boolean;
}

class BulkProcessUrlsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true }) @MaxLength(2048, { each: true })
  urls: string[];
  @IsOptional() @IsBoolean()
  forceRefresh?: boolean;
}

@Controller('chat/urls')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT)
export class UrlProcessingController {
  constructor(
    private readonly urlProcessorService: UrlProcessorService,
    private readonly urlCacheService: UrlCacheService,
  ) {}

  /**
   * Process a single URL and extract content
   */
  @Post('process')
  async processUrl(@Body() dto: ProcessUrlDto) {
    try {
      const result = await this.urlProcessorService.processUrl(dto.url, { forceRefresh: dto.forceRefresh });

      if (!result.success) {
        throw new HttpException(
          { message: 'URL processing failed', error: result.error },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        cached: result.cached,
        data: result.data,
      };
    } catch (error) {
      throw new HttpException(
        { message: 'URL processing failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Process multiple URLs in batch
   */
  @Post('process/batch')
  async processBatchUrls(@Body() dto: BulkProcessUrlsDto) {
    const results = [];
    const errors = [];

    for (const url of dto.urls) {
      try {
        const result = await this.urlProcessorService.processUrl(url, { forceRefresh: dto.forceRefresh });
        results.push({
          url,
          success: result.success,
          cached: result.cached,
          data: result.data,
          error: result.error,
        });
      } catch (error) {
        errors.push({
          url,
          error: error.message,
        });
      }
    }

    return {
      processed: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }

  /**
   * Get cache metrics and statistics
   */
  @UseGuards(PlatformAdminGuard)
  @Get('cache/metrics')
  async getCacheMetrics() {
    const metrics = await this.urlCacheService.getCacheMetrics();

    return {
      success: true,
      metrics,
    };
  }

  /**
   * Get cached URL data
   */
  @Get('cache/:urlHash')
  async getCachedUrl(@Param('urlHash') urlHash: string) {
    const cached = await this.urlCacheService.getCachedUrl(urlHash);

    if (!cached) {
      throw new HttpException('URL not found in cache', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: cached,
    };
  }

  /**
   * Get cache entries with pagination and filtering
   */
  @Get('cache')
  async getCacheEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('status') status?: UrlProcessingStatus,
    @Query('domain') domain?: string,
    @Query('sortBy') sortBy: 'createdAt' | 'expiresAt' | 'title' = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const result = await this.urlCacheService.getCacheEntries({
      page: parseInt(page.toString(), 10),
      limit: Math.min(parseInt(limit.toString(), 10), 100), // Max 100 per page
      status,
      domain,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Clean up expired and failed cache entries
   */
  @Post('cache/cleanup')
  async cleanupCache(
    @Body() options?: {
      removeExpired?: boolean;
      removeFailed?: boolean;
      olderThanDays?: number;
    }
  ) {
    const result = await this.urlCacheService.cleanupCache(options);

    return {
      success: true,
      cleanup: result,
    };
  }

  /**
   * Remove specific URL from cache
   */
  @Delete('cache')
  async removeCacheByUrl(@Body('url') url: string) {
    const removed = await this.urlCacheService.removeCacheByUrl(url);

    if (!removed) {
      throw new HttpException('URL not found in cache', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: 'URL removed from cache',
    };
  }

  /**
   * Get cache entries for a specific domain
   */
  @Get('cache/domain/:domain')
  async getCacheByDomain(
    @Param('domain') domain: string,
    @Query('limit') limit = 50,
  ) {
    const entries = await this.urlCacheService.getCacheByDomain(
      domain,
      Math.min(parseInt(limit.toString(), 10), 100)
    );

    return {
      success: true,
      domain,
      count: entries.length,
      entries,
    };
  }

  /**
   * Preload URLs for caching
   */
  @Post('cache/preload')
  async preloadUrls(@Body('urls') urls: string[]) {
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new HttpException('URLs array is required', HttpStatus.BAD_REQUEST);
    }

    if (urls.length > 100) {
      throw new HttpException('Maximum 100 URLs allowed per batch', HttpStatus.BAD_REQUEST);
    }

    const result = await this.urlCacheService.preloadUrls(urls);

    return {
      success: true,
      preload: result,
    };
  }

  /**
   * Reset cache metrics
   */
  @UseGuards(PlatformAdminGuard)
  @Post('cache/metrics/reset')
  async resetCacheMetrics() {
    this.urlCacheService.resetMetrics();

    return {
      success: true,
      message: 'Cache metrics reset',
    };
  }

  /**
   * Bulk update cache entry status
   */
  @Post('cache/bulk-update')
  async bulkUpdateStatus(
    @Body() dto: {
      urlHashes: string[];
      status: UrlProcessingStatus;
    }
  ) {
    if (!Array.isArray(dto.urlHashes) || dto.urlHashes.length === 0) {
      throw new HttpException('URL hashes array is required', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.urlCacheService.bulkUpdateStatus(
      dto.urlHashes,
      dto.status
    );

    return {
      success: true,
      updated,
      message: `${updated} entries updated`,
    };
  }
}
