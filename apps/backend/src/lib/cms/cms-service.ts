// Frontend CMS Service
// This service interacts with the backend CMS API

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9005/api';

// Layout options interface
interface LayoutOptions {
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  showTitle?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Menu {
  id: string;
  name: string;
  slug: string;
  items?: MenuItem[];
}

interface MenuItem {
  id: string;
  menuId: string;
  label: string;
  url?: string;
  pageId?: string;
  parentId?: string;
  orderIndex: number;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  components: Component[];
  layoutOptions?: LayoutOptions; // Add layout options
  version?: number;
  parentId?: string;
  categoryId?: string;
  category?: Category;
}

export interface Component {
  id: string;
  pageId: string;
  parentId: string;
  type: 'text' | 'button' | 'image' | 'container' | 'card' | 'grid' | 'block';
  props: any;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  children?: Component[];
}

interface CreatePageDto {
  title: string;
  slug: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  layoutOptions?: LayoutOptions; // Add layout options
  createdBy?: string;
  categoryId?: string;
}

interface CreateComponentDto {
  pageId: string;
  parentId?: string;
  type: 'text' | 'button' | 'image' | 'container' | 'card' | 'grid' | 'block';
  props: any;
  orderIndex?: number;
}

export type { CreateComponentDto };

export class CmsService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include', // Include cookies in cross-origin requests
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to parse error response, but handle case where there's no body
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse JSON, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Handle case where response is empty (204 No Content, etc.)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If response is not JSON, return null cast to T
      return null as T;
    }
    
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse server response');
    }
  }

  // Page methods
  async getPages(status?: 'draft' | 'published' | 'archived'): Promise<Page[]> {
    const query = status ? `?status=${status}` : '';
    return this.request<Page[]>(`/cms/pages${query}`);
  }

  async getPage(id: string, withComponents: boolean = false): Promise<Page> {
    const headers: Record<string, string> = {};
    if (withComponents) {
      headers['x-version'] = 'with-components';
    }
    return this.request<Page>(`/cms/pages/${id}`, { headers });
  }

  async getPageBySlug(slug: string, withComponents: boolean = false): Promise<Page> {
    const headers: Record<string, string> = {};
    if (withComponents) {
      headers['x-version'] = 'with-components';
    }
    return this.request<Page>(`/cms/pages/slug/${slug}`, { headers });
  }

  async createPage(data: CreatePageDto): Promise<Page> {
    return this.request<Page>('/cms/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePage(id: string, data: Partial<CreatePageDto>): Promise<Page> {
    return this.request<Page>(`/cms/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePage(id: string): Promise<void> {
    return this.request<void>(`/cms/pages/${id}`, {
      method: 'DELETE',
    });
  }

  async publishPage(id: string): Promise<Page> {
    return this.request<Page>(`/cms/pages/${id}/publish`, {
      method: 'POST',
    });
  }

  async unpublishPage(id: string): Promise<Page> {
    return this.request<Page>(`/cms/pages/${id}/unpublish`, {
      method: 'POST',
    });
  }

  // Versioning methods
  async createPageVersion(id: string): Promise<Page> {
    return this.request<Page>(`/cms/pages/${id}/version`, {
      method: 'POST',
    });
  }

  async getPageVersion(id: string, version: number): Promise<Page> {
    return this.request<Page>(`/cms/pages/${id}/version/${version}`);
  }

  async getPageVersions(id: string): Promise<Page[]> {
    return this.request<Page[]>(`/cms/pages/${id}/versions`);
  }

  async rollbackPageToVersion(id: string, version: number): Promise<Page> {
    return this.request<Page>(`/cms/pages/${id}/rollback/${version}`, {
      method: 'POST',
    });
  }

  // Component methods
  async getComponents(pageId?: string): Promise<Component[]> {
    const query = pageId ? `?pageId=${pageId}` : '';
    return this.request<Component[]>(`/cms/components${query}`);
  }

  async getComponent(id: string): Promise<Component> {
    return this.request<Component>(`/cms/components/${id}`);
  }

  async createComponent(data: CreateComponentDto): Promise<Component> {
    return this.request<Component>('/cms/components', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComponent(id: string, data: Partial<CreateComponentDto>): Promise<Component> {
    return this.request<Component>(`/cms/components/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteComponent(id: string): Promise<void> {
    return this.request<void>(`/cms/components/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderComponents(componentIds: string[], orderIndexes: number[]): Promise<Component[]> {
    return this.request<Component[]>('/cms/components/reorder', {
      method: 'POST',
      body: JSON.stringify({ componentIds, orderIndexes }),
    });
  }

  // Batch operations
  async batchCreateComponents(components: CreateComponentDto[]): Promise<Component[]> {
    return this.request<Component[]>('/cms/components/batch', {
      method: 'POST',
      body: JSON.stringify(components),
    });
  }

  async batchUpdateComponents(updates: { id: string; data: Partial<CreateComponentDto> }[]): Promise<Component[]> {
    return this.request<Component[]>('/cms/components/batch', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async batchDeleteComponents(ids: string[]): Promise<void> {
    return this.request<void>('/cms/components/batch', {
      method: 'DELETE',
      body: JSON.stringify(ids),
    });
  }

  // Batch page operations
  async batchCreatePages(pages: CreatePageDto[]): Promise<Page[]> {
    return this.request<Page[]>('/cms/pages/batch', {
      method: 'POST',
      body: JSON.stringify(pages),
    });
  }

  async batchUpdatePages(updates: { id: string; data: Partial<CreatePageDto> }[]): Promise<Page[]> {
    return this.request<Page[]>('/cms/pages/batch', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/cms/categories');
  }

  async getCategory(id: string): Promise<Category> {
    return this.request<Category>(`/cms/categories/${id}`);
  }

  async createCategory(data: { name: string; slug: string; description?: string }): Promise<Category> {
    return this.request<Category>('/cms/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Menu methods
  async getMenus(): Promise<Menu[]> {
    return this.request<Menu[]>('/cms/menus');
  }

  async getMenu(id: string): Promise<Menu> {
    return this.request<Menu>(`/cms/menus/${id}`);
  }

  async addPageToMenu(menuId: string, pageId: string, label: string, orderIndex?: number): Promise<MenuItem> {
    return this.request<MenuItem>(`/cms/menus/${menuId}/items`, {
      method: 'POST',
      body: JSON.stringify({ pageId, label, orderIndex }),
    });
  }

  async removePageFromMenu(menuId: string, itemId: string): Promise<void> {
    return this.request<void>(`/cms/menus/${menuId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }
}

export const cmsService = new CmsService();
export type { Category, Menu, MenuItem };