// Frontend CMS Menu Service
// This service interacts with the backend CMS Menu API using unified HTTP client

import { httpClient } from '../api/http-client';
import type {
  CmsMenu,
  CmsMenuItem,
  CmsMenuTree,
  CreateCmsMenuDto,
  UpdateCmsMenuDto,
  CreateCmsMenuItemDto,
  UpdateCmsMenuItemDto,
  ReorderMenuItemsDto,
  MenuLocation,
} from '@affexai/shared-types';

/**
 * CMS Menu Service
 * Handles all CMS Menu and Menu Item operations with unified HTTP client
 */
export class CmsMenuService {
  // ==========================================================================
  // Menu Operations
  // ==========================================================================

  /**
   * Get all menus
   */
  async getMenus(params?: {
    location?: MenuLocation;
    isActive?: boolean;
    search?: string;
  }): Promise<CmsMenu[]> {
    const queryParams = new URLSearchParams();

    if (params?.location) {
      queryParams.append('location', params.location);
    }

    if (params?.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }

    if (params?.search) {
      queryParams.append('search', params.search);
    }

    const query = queryParams.toString();
    return httpClient.getWrapped<CmsMenu[]>(`/cms/menus${query ? `?${query}` : ''}`);
  }

  /**
   * Get menu by ID
   */
  async getMenu(id: string): Promise<CmsMenu> {
    return httpClient.getWrapped<CmsMenu>(`/cms/menus/${id}`);
  }

  /**
   * Get menu by slug
   */
  async getMenuBySlug(slug: string): Promise<CmsMenu> {
    return httpClient.getWrapped<CmsMenu>(`/cms/menus/slug/${slug}`);
  }

  /**
   * Create a new menu
   */
  async createMenu(data: CreateCmsMenuDto): Promise<CmsMenu> {
    return httpClient.postWrapped<CmsMenu, CreateCmsMenuDto>(
      '/cms/menus',
      data,
    );
  }

  /**
   * Update existing menu
   */
  async updateMenu(id: string, data: UpdateCmsMenuDto): Promise<CmsMenu> {
    return httpClient.patchWrapped<CmsMenu, UpdateCmsMenuDto>(
      `/cms/menus/${id}`,
      data,
    );
  }

  /**
   * Delete menu
   */
  async deleteMenu(id: string): Promise<void> {
    return httpClient.deleteWrapped<void>(`/cms/menus/${id}`);
  }

  // ==========================================================================
  // Menu Item Operations
  // ==========================================================================

  /**
   * Get all menu items for a specific menu (flat list)
   */
  async getMenuItems(menuId: string): Promise<CmsMenuItem[]> {
    return httpClient.getWrapped<CmsMenuItem[]>(`/cms/menus/${menuId}/items`);
  }

  /**
   * Get menu item tree (hierarchical structure)
   */
  async getMenuItemTree(menuId: string): Promise<CmsMenuTree[]> {
    return httpClient.getWrapped<CmsMenuTree[]>(`/cms/menus/${menuId}/items/tree`);
  }

  /**
   * Get menu item by ID
   */
  async getMenuItem(id: string): Promise<CmsMenuItem> {
    return httpClient.getWrapped<CmsMenuItem>(`/cms/menus/items/${id}`);
  }

  /**
   * Create a new menu item
   */
  async createMenuItem(data: CreateCmsMenuItemDto): Promise<CmsMenuItem> {
    return httpClient.postWrapped<CmsMenuItem, CreateCmsMenuItemDto>(
      '/cms/menus/items',
      data,
    );
  }

  /**
   * Update existing menu item
   */
  async updateMenuItem(id: string, data: UpdateCmsMenuItemDto): Promise<CmsMenuItem> {
    return httpClient.patchWrapped<CmsMenuItem, UpdateCmsMenuItemDto>(
      `/cms/menus/items/${id}`,
      data,
    );
  }

  /**
   * Delete menu item
   */
  async deleteMenuItem(id: string): Promise<void> {
    return httpClient.deleteWrapped<void>(`/cms/menus/items/${id}`);
  }

  /**
   * Reorder menu items
   */
  async reorderMenuItems(data: ReorderMenuItemsDto): Promise<void> {
    await httpClient.postWrapped<{ message: string }, ReorderMenuItemsDto>(
      '/cms/menus/items/reorder',
      data,
    );
  }

  /**
   * Batch update menu items (for drag & drop hierarchy changes)
   */
  async batchUpdateMenuItems(
    menuId: string,
    updates: Array<{ id: string; parentId: string | null; orderIndex: number }>,
  ): Promise<void> {
    await httpClient.postWrapped<{ message: string }, Array<{ id: string; parentId: string | null; orderIndex: number }>>(
      `/cms/menus/${menuId}/items/batch-update`,
      updates,
    );
  }
}

// Export singleton instance
export const cmsMenuService = new CmsMenuService();
