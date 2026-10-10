import { httpClient } from '@/lib/api/http-client';
import type { Page } from '@affexai/shared-types';

export interface CmsPageResponse {
  id: string;
  title: string;
  slug: string;
  components: any[]; // CMS components/blocks array
  metaTitle?: string;
  metaDescription?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class CmsPageService {
  /**
   * Get CMS page by slug (public endpoint - no auth required)
   */
  static async getPageBySlug(slug: string): Promise<CmsPageResponse> {
    // Encode the slug to handle multi-level paths (e.g., products/allplan/basic → products%2Fallplan%2Fbasic)
    const encodedSlug = encodeURIComponent(slug);
    return httpClient.getWrapped<CmsPageResponse>(`/cms/pages/slug/${encodedSlug}`);
  }

  /**
   * Get all published pages (public endpoint)
   */
  static async getPublishedPages(): Promise<CmsPageResponse[]> {
    return httpClient.getWrapped<CmsPageResponse[]>('/cms/pages?status=published');
  }

  /**
   * Get homepage (special case)
   */
  static async getHomepage(): Promise<CmsPageResponse> {
    return this.getPageBySlug('home');
  }

  /**
   * Get all pages (admin endpoint - for dropdowns)
   */
  static async getAllPages(): Promise<Array<{ id: string; title: string; slug: string }>> {
    return httpClient.getWrapped<Array<{ id: string; title: string; slug: string }>>('/cms/pages');
  }

  /**
   * Get all categories (admin endpoint - for dropdowns)
   */
  static async getAllCategories(): Promise<Array<{ id: string; name: string; slug: string }>> {
    return httpClient.getWrapped<Array<{ id: string; name: string; slug: string }>>('/cms/categories');
  }
}
