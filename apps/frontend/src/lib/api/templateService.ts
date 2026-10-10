import { httpClient } from './http-client';
import type { PageTemplate } from '@/types/cms-template';

const API_BASE = '/cms/templates';

export interface TemplateQueryOptions {
  category?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface TemplateStats {
  total: number;
  byCategory: Record<string, number>;
  featured: number;
  totalUsage: number;
}

export interface ImportTemplateRequest {
  templateData: string;
  authorId?: string;
}

export interface ExportTemplateResponse {
  id: string;
  name: string;
  data: PageTemplate;
  exportedAt: Date;
}

/**
 * Template API Service
 * Handles all template-related API calls
 */
export const templateService = {
  /**
   * Get all templates with optional filtering
   */
  async getAll(options?: TemplateQueryOptions): Promise<PageTemplate[]> {
    const params = new URLSearchParams();

    if (options?.category) params.append('category', options.category);
    if (options?.isFeatured !== undefined) params.append('isFeatured', String(options.isFeatured));
    if (options?.isActive !== undefined) params.append('isActive', String(options.isActive));

    const queryString = params.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

    return await httpClient.getWrapped<PageTemplate[]>(url);
  },

  /**
   * Get a single template by ID
   */
  async getById(id: string): Promise<PageTemplate> {
    return await httpClient.getWrapped<PageTemplate>(`${API_BASE}/${id}`);
  },

  /**
   * Create a new template
   */
  async create(template: Partial<PageTemplate>): Promise<PageTemplate> {
    return await httpClient.postWrapped<PageTemplate>(API_BASE, template);
  },

  /**
   * Update a template
   */
  async update(id: string, template: Partial<PageTemplate>): Promise<PageTemplate> {
    return await httpClient.putWrapped<PageTemplate>(`${API_BASE}/${id}`, template);
  },

  /**
   * Delete a template (soft delete)
   */
  async delete(id: string): Promise<void> {
    await httpClient.deleteWrapped<void>(`${API_BASE}/${id}`);
  },

  /**
   * Get template statistics
   */
  async getStats(): Promise<TemplateStats> {
    return await httpClient.getWrapped<TemplateStats>(`${API_BASE}/stats`);
  },

  /**
   * Increment template usage count
   */
  async incrementUsage(id: string): Promise<{ message: string }> {
    return await httpClient.postWrapped<{ message: string }>(`${API_BASE}/${id}/use`, {});
  },

  /**
   * Import template from JSON
   */
  async import(request: ImportTemplateRequest): Promise<PageTemplate> {
    return await httpClient.postWrapped<PageTemplate>(`${API_BASE}/import`, request);
  },

  /**
   * Export template as JSON
   */
  async export(id: string): Promise<ExportTemplateResponse> {
    return await httpClient.getWrapped<ExportTemplateResponse>(`${API_BASE}/${id}/export`);
  },

  /**
   * Duplicate a template
   */
  async duplicate(id: string, newName?: string): Promise<PageTemplate> {
    return await httpClient.post<PageTemplate>(`${API_BASE}/${id}/duplicate`, { name: newName });
  },

  /**
   * Import template from file
   */
  async importFromFile(file: File, authorId?: string): Promise<PageTemplate> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const templateData = event.target?.result as string;
          const result = await this.import({ templateData, authorId });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  },

  /**
   * Export template to file (download)
   */
  async exportToFile(id: string, filename?: string): Promise<void> {
    const exportData = await this.export(id);
    
    const blob = new Blob([JSON.stringify(exportData.data, null, 2)], {
      type: 'application/json',
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${exportData.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
