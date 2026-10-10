import { httpClient } from './http-client';
import { BaseApiService } from './base-service';
import type {
  Media,
  CreateMediaDto,
  UpdateMediaDto,
  MediaType,
  MediaQueryParams,
} from '@affexai/shared-types';
import { MediaModule, MediaCategory } from '@affexai/shared-types';

// Re-export types for backward compatibility
export type { Media, CreateMediaDto, UpdateMediaDto, MediaType, MediaQueryParams };
export { MediaModule, MediaCategory };

export interface MediaFilterParams {
  type?: MediaType;
  module?: MediaModule;
  category?: MediaCategory;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MediaFilterResponse {
  data: Media[];
  total: number;
}

export interface ModuleCount {
  module: MediaModule;
  count: number;
}

export interface CategoryCount {
  category: MediaCategory;
  count: number;
}

/**
 * Media Service
 * Handles all media-related API operations extending BaseApiService
 */
class MediaService extends BaseApiService<Media, CreateMediaDto, UpdateMediaDto> {
  constructor() {
    super({ endpoint: '/media', useWrappedResponses: true });
  }

  /**
   * Get all media, optionally filtered by type
   */
  async getAllMedia(type?: MediaType): Promise<Media[]> {
    const url = type ? `${this.endpoint}?type=${type}` : this.endpoint;

    if (this.useWrappedResponses) {
      return httpClient.getWrapped<Media[]>(url);
    }
    return httpClient.get<Media[]>(url);
  }

  /**
   * Get media by ID (Alias for getById for compatibility)
   */
  async getMediaById(id: string): Promise<Media> {
    return this.getById(id);
  }

  /**
   * Upload file with multipart/form-data
   */
  async uploadFile(
    file: File,
    options?: { module?: MediaModule; category?: MediaCategory; tags?: string[] }
  ): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);

    // Build query params for module, category, tags
    const params = new URLSearchParams();
    if (options?.module) params.append('module', options.module);
    if (options?.category) params.append('category', options.category);
    if (options?.tags?.length) params.append('tags', options.tags.join(','));

    const queryString = params.toString();
    const url = queryString ? `/media/upload?${queryString}` : '/media/upload';

    // Use axios instance for file upload with proper headers
    const response = await httpClient.getAxiosInstance().post<Media>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Get media with advanced filtering
   */
  async getMediaWithFilters(params: MediaFilterParams): Promise<MediaFilterResponse> {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.module) queryParams.append('module', params.module);
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const url = `${this.endpoint}?${queryParams.toString()}`;
    return httpClient.get<MediaFilterResponse>(url);
  }

  /**
   * Get modules with media count
   */
  async getModulesWithCount(): Promise<ModuleCount[]> {
    return httpClient.get<ModuleCount[]>(`${this.endpoint}/modules`);
  }

  /**
   * Get categories with media count
   */
  async getCategoriesWithCount(): Promise<CategoryCount[]> {
    return httpClient.get<CategoryCount[]>(`${this.endpoint}/categories`);
  }

  /**
   * Get media by module
   */
  async getMediaByModule(module: MediaModule): Promise<Media[]> {
    return httpClient.get<Media[]>(`${this.endpoint}/by-module/${module}`);
  }

  /**
   * Get media by category
   */
  async getMediaByCategory(category: MediaCategory): Promise<Media[]> {
    return httpClient.get<Media[]>(`${this.endpoint}/by-category/${category}`);
  }

  /**
   * Get media URL by ID
   * If the input is already a URL, return it as is
   * If it's a media ID (UUID), fetch the media and return its URL
   */
  async getMediaUrl(mediaIdOrUrl: string): Promise<string> {
    console.log('[MediaService] getMediaUrl input:', mediaIdOrUrl);

    // If already a full URL, return it
    if (mediaIdOrUrl.startsWith('http://') || mediaIdOrUrl.startsWith('https://')) {
      console.log('[MediaService] Already a full URL, returning as-is');
      return mediaIdOrUrl;
    }

    // If it looks like a file path with extension, construct upload URL
    if (mediaIdOrUrl.includes('.') && !mediaIdOrUrl.includes('/')) {
      // Get base URL for uploads - remove /api suffix if present since /uploads is at root level
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006';
      const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
      const constructedUrl = `${cleanBaseUrl}/uploads/${mediaIdOrUrl}`;
      console.log('[MediaService] File path detected, constructed URL:', constructedUrl);
      return constructedUrl;
    }

    // If it's a UUID (media ID), fetch the media object
    try {
      console.log('[MediaService] Fetching media by ID:', mediaIdOrUrl);
      const media = await this.getById(mediaIdOrUrl);
      console.log('[MediaService] Media fetched, URL:', media.url);

      // If the URL from backend is relative, make it absolute
      if (media.url && !media.url.startsWith('http://') && !media.url.startsWith('https://')) {
        // Backend returns /uploads/... so we need base URL without /api suffix
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006';
        const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, ''); // Remove /api suffix if present
        const absoluteUrl = `${cleanBaseUrl}${media.url.startsWith('/') ? '' : '/'}${media.url}`;
        console.log('[MediaService] Converted relative to absolute URL:', absoluteUrl);
        return absoluteUrl;
      }

      return media.url;
    } catch (error) {
      console.error('[MediaService] Failed to get media URL:', error);
      // Return a placeholder if we can't get the URL
      return 'https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo';
    }
  }

  /**
   * Delete media by ID
   * Wrapper around BaseApiService.delete for explicit naming
   */
  async deleteMedia(id: string): Promise<void> {
    await this.delete(id);
  }

  /**
   * Update media by ID
   * Wrapper around BaseApiService.update for explicit naming
   */
  async updateMedia(id: string, data: UpdateMediaDto): Promise<Media> {
    return this.update(id, data);
  }
}

export const mediaService = new MediaService();
export default mediaService;