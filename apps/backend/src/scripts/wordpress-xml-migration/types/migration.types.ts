/**
 * WordPress CMS Migration - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the WordPress to CMS migration process.
 */

// ============================================
// WordPress XML Parsing Types
// ============================================

export interface WordPressPage {
  title: string;
  content: string;  // HTML from content:encoded CDATA
  slug: string;     // from wp:post_name
  pubDate: Date;
  status: string;   // from wp:status
  postId: string;   // from wp:post_id
}

// ============================================
// HTML Parsing Types
// ============================================

export interface ParsedElement {
  type: 'heading' | 'paragraph' | 'image' | 'list' | 'button' | 'video' | 'section';
  tagName: string;
  content: string;
  attributes: Record<string, string>;
  children: ParsedElement[];
}

export interface ParsedContent {
  elements: ParsedElement[];
  images: string[];
  videos: string[];
  buttons: ButtonData[];
}

// ============================================
// Component Mapping Types
// ============================================

export interface ComponentMapping {
  type: 'block';
  blockId: string;
  blockType: string;
  blockCategory: string;
  props: Record<string, any>;
  order: number;
  parentId: string | null;
}

export interface ComponentHierarchy {
  component: ComponentMapping;
  children: ComponentHierarchy[];
}

// ============================================
// Media Types
// ============================================

export interface MediaEntity {
  id: string;
  filename: string;
  url: string;  // Relative path: /cms-media/image.jpg
  mimeType: string;
  type: 'IMAGE';
  storageType: 'S3';
  module: 'CMS';
  category: 'CONTENT';
}

export interface MediaCreationResult {
  mediaEntity: MediaEntity;
  existed: boolean;
}

// ============================================
// Button Types
// ============================================

export interface ButtonData {
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline';
  target?: '_blank' | '_self';
}

// ============================================
// Video Types
// ============================================

export interface VideoData {
  url: string;
  embedUrl: string;
  provider: 'youtube' | 'vimeo';
  videoId: string;
}

// ============================================
// SEO Types
// ============================================

export interface SEOMetadata {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

// ============================================
// Template Mapping Types
// ============================================

export interface TemplateMapping {
  filename: string;
  template: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================
// Migration Configuration Types
// ============================================

export interface MigrationConfig {
  xmlFilePath: string;
  mappingFilePath: string;
  templateMappingPath: string;
  uploadsDir: string;
  dryRun: boolean;
}

// ============================================
// Migration Result Types
// ============================================

export interface MigrationResult {
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  totalComponents: number;
  totalMediaEntities: number;
  totalVideos: number;
  errors: MigrationError[];
  duration: number;
}

export interface PageMigrationResult {
  page: string;
  success: boolean;
  componentsCreated: number;
  mediaEntitiesCreated: number;
  error?: string;
  stack?: string;
}

export interface MigrationError {
  page: string;
  message: string;
  stack?: string;
}

// ============================================
// Validation Types
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  page: string;
  component?: string;
  field: string;
  message: string;
}

export interface ValidationWarning {
  page: string;
  component?: string;
  message: string;
}

// ============================================
// Re-export from shared types
// ============================================

export { ComponentType, PageStatus } from '@affexai/shared-types';
