// Frontend CMS Service
// This service interacts with the backend CMS API using unified HTTP client

import { httpClient } from '../api/http-client';
import type {
  Page,
  Component,
  CreatePageDto,
  UpdatePageDto,
  CreateComponentDto,
  UpdateComponentDto,
  ReorderComponentsDto,
  PageQueryParams,
  PageStatus,
} from '@affexai/shared-types';

// Additional CMS types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  orderIndex?: number;
  isActive?: boolean;
}

export interface Menu {
  id: string;
  name: string;
  slug: string;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  menuId: string;
  label: string;
  url?: string;
  pageId?: string;
  parentId?: string;
  orderIndex: number;
}

// Re-export types for backward compatibility
export type {
  Page,
  Component,
  CreatePageDto,
  UpdatePageDto,
  CreateComponentDto,
  UpdateComponentDto,
  ReorderComponentsDto,
  PageQueryParams,
  PageStatus,
};

/**
 * CMS Service
 * Handles all CMS-related API operations with unified HTTP client
 * Note: Uses wrapped methods because backend uses global ApiResponse wrapper
 */
export class CmsService {
  // ==========================================================================
  // Page Methods
  // ==========================================================================

  /**
   * Get all pages, optionally filtered by status
   */
  async getPages(status?: PageStatus): Promise<Page[]> {
    const query = status ? `?status=${status}` : '';
    return httpClient.getWrapped<Page[]>(`/cms/pages${query}`);
  }

  /**
   * Get page by ID
   */
  async getPage(id: string): Promise<Page> {
    return httpClient.getWrapped<Page>(`/cms/pages/${id}`);
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(slug: string): Promise<Page> {
    return httpClient.getWrapped<Page>(`/cms/pages/slug/${slug}`);
  }

  /**
   * Create a new page
   */
  async createPage(data: CreatePageDto): Promise<Page> {
    return httpClient.postWrapped<Page, CreatePageDto>('/cms/pages', data);
  }

  /**
   * Update existing page
   */
  /**
   * Update existing page
   */
  async updatePage(id: string, data: UpdatePageDto): Promise<Page> {
    return httpClient.patchWrapped<Page, UpdatePageDto>(`/cms/pages/${id}`, data);
  }

  /**
   * Delete page
   */
  async deletePage(id: string): Promise<void> {
    return httpClient.deleteWrapped<void>(`/cms/pages/${id}`);
  }

  /**
   * Publish page
   */
  async publishPage(id: string): Promise<Page> {
    return httpClient.postWrapped<Page>(`/cms/pages/${id}/publish`);
  }

  /**
   * Unpublish page
   */
  async unpublishPage(id: string): Promise<Page> {
    return httpClient.postWrapped<Page>(`/cms/pages/${id}/unpublish`);
  }

  /**
   * Clone page
   */
  async clonePage(id: string): Promise<Page> {
    return httpClient.postWrapped<Page>(`/cms/pages/${id}/clone`);
  }

  // ==========================================================================
  // Bulk Operations
  // ==========================================================================

  /**
   * Bulk publish multiple pages
   */
  async bulkPublish(ids: string[]): Promise<{ successCount: number; failedCount: number }> {
    return httpClient.postWrapped<{ successCount: number; failedCount: number }>('/cms/pages/bulk/publish', { ids });
  }

  /**
   * Bulk unpublish (set to draft) multiple pages
   */
  async bulkUnpublish(ids: string[]): Promise<{ successCount: number; failedCount: number }> {
    return httpClient.postWrapped<{ successCount: number; failedCount: number }>('/cms/pages/bulk/unpublish', { ids });
  }

  /**
   * Bulk archive multiple pages
   */
  async bulkArchive(ids: string[]): Promise<{ successCount: number; failedCount: number }> {
    return httpClient.postWrapped<{ successCount: number; failedCount: number }>('/cms/pages/bulk/archive', { ids });
  }

  /**
   * Bulk delete multiple pages
   */
  async bulkDelete(ids: string[]): Promise<{ successCount: number; failedCount: number }> {
    return httpClient.postWrapped<{ successCount: number; failedCount: number }>('/cms/pages/bulk/delete', { ids });
  }

  // ==========================================================================
  // Component Methods
  // ==========================================================================

  /**
   * Get all components, optionally filtered by page ID
   */
  async getComponents(pageId?: string): Promise<Component[]> {
    const query = pageId ? `?pageId=${pageId}` : '';
    return httpClient.getWrapped<Component[]>(`/cms/components${query}`);
  }

  /**
   * Get component by ID
   */
  async getComponent(id: string): Promise<Component> {
    return httpClient.getWrapped<Component>(`/cms/components/${id}`);
  }

  /**
   * Create a new component
   */
  async createComponent(data: CreateComponentDto): Promise<Component> {
    return httpClient.postWrapped<Component, CreateComponentDto>('/cms/components', data);
  }

  /**
   * Update existing component
   */
  async updateComponent(id: string, data: UpdateComponentDto): Promise<Component> {
    return httpClient.patchWrapped<Component, UpdateComponentDto>(`/cms/components/${id}`, data);
  }

  /**
   * Delete component
   */
  async deleteComponent(id: string): Promise<void> {
    return httpClient.deleteWrapped<void>(`/cms/components/${id}`);
  }

  /**
   * Reorder components
   */
  async reorderComponents(data: ReorderComponentsDto): Promise<Component[]> {
    return httpClient.postWrapped<Component[], ReorderComponentsDto>('/cms/components/reorder', data);
  }

  // ==========================================================================
  // Category Methods
  // ==========================================================================

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return httpClient.getWrapped<Category[]>('/cms/categories');
  }

  /**
   * Get category by ID
   */
  async getCategory(id: string): Promise<Category> {
    return httpClient.getWrapped<Category>(`/cms/categories/${id}`);
  }

  /**
   * Create a new category
   */
  async createCategory(data: { name: string; slug: string; description?: string }): Promise<Category> {
    return httpClient.postWrapped<Category>('/cms/categories', data);
  }

  // ==========================================================================
  // Menu Methods
  // ==========================================================================

  /**
   * Get all menus
   */
  async getMenus(): Promise<Menu[]> {
    return httpClient.getWrapped<Menu[]>('/cms/menus');
  }

  /**
   * Get menu by ID
   */
  async getMenu(id: string): Promise<Menu> {
    return httpClient.getWrapped<Menu>(`/cms/menus/${id}`);
  }

  /**
   * Get all menu items for a menu (includes nested items)
   */
  async getMenuItems(menuId: string): Promise<MenuItem[]> {
    return httpClient.getWrapped<MenuItem[]>(`/cms/menus/${menuId}/items`);
  }

  /**
   * Add page to menu with hierarchical placement support
   */
  async addPageToMenu(
    menuId: string,
    pageId: string,
    label: string,
    orderIndex?: number,
    parentId?: string
  ): Promise<MenuItem> {
    return httpClient.postWrapped<MenuItem>('/cms/menus/items', {
      menuId,
      type: 'page',
      pageId,
      label,
      orderIndex,
      parentId: parentId || undefined,
      isActive: true,
    });
  }

  /**
   * Remove page from menu
   */
  async removePageFromMenu(menuId: string, itemId: string): Promise<void> {
    return httpClient.deleteWrapped<void>(`/cms/menus/${menuId}/items/${itemId}`);
  }
}

export const cmsService = new CmsService();