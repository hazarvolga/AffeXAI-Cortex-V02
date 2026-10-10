// Frontend CMS Category Service
// This service interacts with the backend CMS Category API using unified HTTP client

import { httpClient } from '../api/http-client';
import type {
  CmsCategory,
  CmsCategoryTree,
  CreateCmsCategoryDto,
  UpdateCmsCategoryDto,
  ReorderCmsCategoriesDto,
  CmsCategoryQueryParams,
} from '@affexai/shared-types';

/**
 * CMS Category Service
 * Handles all CMS Category operations with unified HTTP client
 */
export class CmsCategoryService {
  /**
   * Get all categories (flat list)
   */
  async getCategories(params?: CmsCategoryQueryParams): Promise<CmsCategory[]> {
    const queryParams = new URLSearchParams();

    if (params?.parentId !== undefined) {
      queryParams.append('parentId', params.parentId === null ? 'null' : params.parentId);
    }

    if (params?.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }

    if (params?.search) {
      queryParams.append('search', params.search);
    }

    const query = queryParams.toString();
    return httpClient.getWrapped<CmsCategory[]>(`/cms/categories${query ? `?${query}` : ''}`);
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(): Promise<CmsCategoryTree[]> {
    return httpClient.getWrapped<CmsCategoryTree[]>('/cms/categories/tree');
  }

  /**
   * Get category by ID
   */
  async getCategory(id: string): Promise<CmsCategory> {
    return httpClient.getWrapped<CmsCategory>(`/cms/categories/${id}`);
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<CmsCategory> {
    return httpClient.getWrapped<CmsCategory>(`/cms/categories/slug/${slug}`);
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCmsCategoryDto): Promise<CmsCategory> {
    return httpClient.postWrapped<CmsCategory, CreateCmsCategoryDto>(
      '/cms/categories',
      data,
    );
  }

  /**
   * Update existing category
   */
  async updateCategory(id: string, data: UpdateCmsCategoryDto): Promise<CmsCategory> {
    return httpClient.patchWrapped<CmsCategory, UpdateCmsCategoryDto>(
      `/cms/categories/${id}`,
      data,
    );
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    return httpClient.deleteWrapped<void>(`/cms/categories/${id}`);
  }

  /**
   * Reorder categories
   */
  async reorderCategories(data: ReorderCmsCategoriesDto): Promise<void> {
    await httpClient.postWrapped<{ message: string }, ReorderCmsCategoriesDto>(
      '/cms/categories/reorder',
      data,
    );
  }

  /**
   * Batch update categories (for drag & drop hierarchy changes)
   */
  async batchUpdateCategories(
    updates: Array<{ id: string; parentId: string | null; orderIndex: number }>,
  ): Promise<void> {
    await httpClient.postWrapped<{ message: string }, typeof updates>(
      '/cms/categories/batch-update',
      updates,
    );
  }
}

// Export singleton instance
export const cmsCategoryService = new CmsCategoryService();
