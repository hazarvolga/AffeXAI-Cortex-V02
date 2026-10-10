import { Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

// Use a more generic type since we don't have access to the exact Cache type
type CacheManager = any;

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: CacheManager) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== undefined ? value : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      // Convert ttl from seconds to milliseconds if provided
      const ttlMs = ttl ? ttl * 1000 : undefined;
      await this.cacheManager.set(key, value, ttlMs);
    } catch (error) {
      // Log error but don't throw to avoid breaking the main flow
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      // Log error but don't throw to avoid breaking the main flow
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }
}