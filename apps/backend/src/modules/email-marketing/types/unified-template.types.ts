/**
 * Unified Template Types
 *
 * Supports both database-based (JSON/MJML) and file-based (HTML) templates
 * with a single, consistent interface.
 */

export enum TemplateSource {
  DATABASE = 'database',
  FILE = 'file',
}

export interface UnifiedTemplate {
  id: string;
  name: string;
  description?: string;
  source: TemplateSource;

  // Database-based (JSON structure)
  structure?: {
    rows: any[];
    settings: {
      backgroundColor?: string;
      contentWidth?: string;
      fonts?: string[];
    };
  };

  // File-based or compiled HTML
  content?: string;

  // MJML compiled output (for database templates)
  compiledMjml?: string;
  compiledHtml?: string;

  // Metadata
  type?: string;
  isActive?: boolean;
  isEditable?: boolean;
  version?: number;
  variables?: Record<string, any>;
  createdFrom?: string;
  thumbnailUrl?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TemplateRenderOptions {
  data?: Record<string, any>;
  interpolate?: boolean;
  minify?: boolean;
}

export interface TemplateRenderResult {
  html: string;
  mjml?: string;
  source: TemplateSource;
}
