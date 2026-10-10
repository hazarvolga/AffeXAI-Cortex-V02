/**
 * CMS Template System - Enhanced Type Definitions with Design Token Integration
 *
 * Implements W3C Design Tokens integration with page templates for:
 * - Theme-aware templates supporting multiple contexts (public/admin/portal)
 * - Design token references using {tokenPath} alias format
 * - Template versioning and validation
 * - Component-level template parts for reusability
 */

import type { ThemeContext, ThemeMode, DesignTokens } from './design-tokens';

/**
 * Template Categories for Organization
 */
export type TemplateCategory =
  | 'Landing Page'  // Landing pages and marketing
  | 'Education'     // Educational platforms and courses
  | 'Business'      // Corporate and business websites
  | 'Portfolio'     // Portfolio and case studies
  | 'Blog'          // Blog and articles
  | 'Product'       // Product pages and showcases
  | 'Solutions'     // Solutions and services pages
  | 'Event'         // Events, conferences, training
  | 'Contact'       // Contact pages
  | 'Team'          // Team and about pages
  | 'FAQ'           // Frequently asked questions
  | 'Legal'         // Legal pages (privacy, terms, KVKK)
  | 'Pricing'       // Pricing and plans pages
  | 'News'          // News and announcements
  | 'Case Study'    // Success stories and case studies
  | 'Feature'       // Feature-focused landing pages
  | 'Error'         // Error pages (404, 500)
  | 'Verification'  // Verification pages (certificate, email)
  | 'Campaign'      // Campaign and promotional landing pages
  | 'E-Commerce';   // E-commerce pages (product, cart, checkout)

/**
 * Layout Configuration for Templates
 */
export interface LayoutConfig {
  maxWidth?: 'full' | 'wide' | 'standard' | 'narrow';
  spacing?: 'compact' | 'normal' | 'spacious';
  containerPadding?: string; // Token reference or value
  gridColumns?: number;
  gridGap?: string; // Token reference or value
}

/**
 * Template Constraints to Control Usage
 */
export interface TemplateConstraints {
  requiredBlocks?: string[];      // Block types that must be present
  maxBlocks?: number;             // Maximum number of blocks allowed
  minBlocks?: number;             // Minimum number of blocks required
  allowedCategories?: string[];   // Allowed block categories
  forbiddenBlocks?: string[];     // Block types that cannot be used
  lockLayout?: boolean;           // Prevent layout changes
  lockOrder?: boolean;            // Prevent reordering blocks
}

/**
 * Design System Integration for Templates
 */
export interface TemplateDesignSystem {
  /**
   * Supported theme contexts (public/admin/portal)
   */
  supportedContexts: ThemeContext[];

  /**
   * Preferred theme mode (light/dark)
   */
  preferredMode?: ThemeMode;

  /**
   * Custom token overrides specific to this template
   */
  customTokens?: Partial<DesignTokens>;

  /**
   * Color scheme using design token references
   */
  colorScheme: {
    primary: string;      // Token reference: "{color.primary}"
    secondary?: string;
    accent: string;
    background: string;
    foreground: string;
    muted?: string;
    card?: string;
    border?: string;
  };

  /**
   * Typography using design token references
   */
  typography: {
    heading: string;      // Token reference: "{typography.heading1}"
    subheading?: string;
    body: string;
    caption?: string;
  };

  /**
   * Spacing using design token references
   */
  spacing: {
    section: string;      // Token reference: "{spacing.lg}"
    component: string;
    element?: string;
  };

  /**
   * Optional shadow and border tokens
   */
  effects?: {
    shadow?: string;      // Token reference: "{shadow.card}"
    border?: string;      // Token reference: "{border.default}"
    radius?: string;
  };
}

/**
 * Block Instance in Template
 */
export interface BlockInstance {
  id: string;
  type: string;
  category: string;
  properties: Record<string, any>;
  children?: BlockInstance[];
  locked?: boolean;
}

/**
 * Template Preview Information
 */
export interface TemplatePreview {
  thumbnail: string;        // URL or base64 image
  previewUrl?: string;      // Live preview URL
  screenshots?: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
}

/**
 * Template Metadata
 */
export interface TemplateMetadata {
  author?: string;
  authorUrl?: string;
  license?: string;
  tags?: string[];
  keywords?: string[];
  industry?: string[];      // E.g., ['saas', 'ecommerce', 'education']
  designStyle?: string[];   // E.g., ['modern', 'minimal', 'bold']
}

/**
 * Template Version History
 */
export interface TemplateVersion {
  version: number;
  createdAt: Date;
  createdBy?: string;
  changelog?: string;
  blocks: BlockInstance[];
  designSystem: TemplateDesignSystem;
}

/**
 * Main Page Template Interface
 */
export interface PageTemplate {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Template name (user-facing)
   */
  name: string;

  /**
   * Template description
   */
  description: string;

  /**
   * Template category for organization
   */
  category: TemplateCategory;

  /**
   * Block instances that make up this template
   */
  blocks: BlockInstance[];

  /**
   * Layout configuration
   */
  layoutOptions: LayoutConfig;

  /**
   * Design system integration with token references
   */
  designSystem: TemplateDesignSystem;

  /**
   * Template constraints to control usage
   */
  constraints?: TemplateConstraints;

  /**
   * Preview assets
   */
  preview: TemplatePreview;

  /**
   * Additional metadata
   */
  metadata?: TemplateMetadata;

  /**
   * Usage statistics
   */
  usageCount: number;

  /**
   * Current version number
   */
  version: number;

  /**
   * Version history
   */
  versionHistory?: TemplateVersion[];

  /**
   * Timestamps
   */
  createdAt: Date;
  updatedAt: Date;

  /**
   * Published status
   */
  isPublished: boolean;

  /**
   * Featured template
   */
  isFeatured?: boolean;
}

/**
 * Template Part - Reusable Section
 */
export interface TemplatePart {
  id: string;
  name: string;
  description: string;
  type: 'header' | 'footer' | 'sidebar' | 'section' | 'custom';
  blocks: BlockInstance[];
  designSystem?: Partial<TemplateDesignSystem>;
  preview?: TemplatePreview;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Template Library Filter Options
 */
export interface TemplateFilters {
  category?: TemplateCategory[];
  context?: ThemeContext[];
  tags?: string[];
  industry?: string[];
  designStyle?: string[];
  isFeatured?: boolean;
  sortBy?: 'popular' | 'recent' | 'name' | 'category';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Template Application Result
 */
export interface TemplateApplicationResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
  appliedBlocks: number;
  resolvedTokens: number;
  validationResults?: TemplateValidationResult;
}

/**
 * Template Validation Result
 */
export interface TemplateValidationResult {
  isValid: boolean;
  errors: TemplateValidationError[];
  warnings: TemplateValidationWarning[];
}

/**
 * Template Validation Error
 */
export interface TemplateValidationError {
  type: 'token_not_found' | 'constraint_violation' | 'invalid_block' | 'missing_required_block';
  message: string;
  blockId?: string;
  tokenPath?: string;
  severity: 'error' | 'warning';
}

/**
 * Template Validation Warning
 */
export interface TemplateValidationWarning {
  type: 'deprecated_token' | 'performance' | 'accessibility' | 'best_practice';
  message: string;
  suggestion?: string;
}

/**
 * Type guard to check if a value is a token alias
 */
export function isTokenAlias(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

/**
 * Extract token path from alias format
 * @example "{color.primary}" -> "color.primary"
 */
export function extractTokenPath(alias: string): string {
  if (isTokenAlias(alias)) {
    return alias.slice(1, -1);
  }
  return alias;
}

/**
 * Create token alias from path
 * @example "color.primary" -> "{color.primary}"
 */
export function createTokenAlias(path: string): string {
  if (isTokenAlias(path)) {
    return path;
  }
  return `{${path}}`;
}
