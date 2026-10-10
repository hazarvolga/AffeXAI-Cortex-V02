/**
 * Validator - Validates migrated content and pages
 * 
 * Responsibilities:
 * - Validate required fields (title, slug)
 * - Validate component props against schema
 * - Verify created pages via CMS API
 * - Check for broken image references
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from './Logger';
import {
  ParsedContent,
  MediaMapping,
  ImageReference,
} from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  context?: string;
}

export interface ComponentValidationResult {
  componentId: string;
  isValid: boolean;
  errors: ValidationError[];
}

export interface PageVerificationResult {
  pageId: string;
  exists: boolean;
  isAccessible: boolean;
  componentCount: number;
  errors: ValidationError[];
}

export class Validator {
  private apiClient: AxiosInstance;
  private logger: Logger;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string, logger: Logger) {
    this.apiBaseUrl = apiBaseUrl;
    this.logger = logger;

    // Create axios instance
    this.apiClient = axios.create({
      baseURL: apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
  }

  /**
   * Validate parsed content before page creation
   */
  validateContent(content: ParsedContent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    if (!content.title || content.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Title is required and cannot be empty',
        severity: 'critical',
      });
    }

    if (!content.slug || content.slug.trim().length === 0) {
      errors.push({
        field: 'slug',
        message: 'Slug is required and cannot be empty',
        severity: 'critical',
      });
    }

    // Validate slug format (lowercase, hyphens, no spaces)
    if (content.slug && !/^[a-z0-9-]+$/.test(content.slug)) {
      errors.push({
        field: 'slug',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
        severity: 'error',
      });
    }

    // Validate title length
    if (content.title && content.title.length > 200) {
      warnings.push({
        field: 'title',
        message: 'Title is longer than 200 characters',
        context: `Length: ${content.title.length}`,
      });
    }

    // Validate sections exist
    if (!content.sections || content.sections.length === 0) {
      warnings.push({
        field: 'sections',
        message: 'No content sections found',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate component props against expected schema
   */
  validateComponentProps(
    blockType: string,
    props: Record<string, any>,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate props is an object
    if (!props || typeof props !== 'object') {
      errors.push({
        field: 'props',
        message: 'Component props must be an object',
        severity: 'critical',
      });
      return { isValid: false, errors, warnings };
    }

    // Block-specific validation
    switch (blockType) {
      case 'hero-centered-bg-image':
      case 'hero-split-image':
        this.validateHeroProps(props, errors, warnings);
        break;

      case 'features-grid':
      case 'features-list':
        this.validateFeaturesProps(props, errors, warnings);
        break;

      case 'workflow-tabs':
        this.validateWorkflowTabsProps(props, errors, warnings);
        break;

      case 'stats-grid':
        this.validateStatsProps(props, errors, warnings);
        break;

      case 'cta-centered':
      case 'cta-split':
        this.validateCTAProps(props, errors, warnings);
        break;

      default:
        // Generic validation for unknown block types
        this.validateGenericProps(props, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate hero block props
   */
  private validateHeroProps(
    props: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    if (!props.title || typeof props.title !== 'string') {
      errors.push({
        field: 'props.title',
        message: 'Hero block requires a title string',
        severity: 'error',
      });
    }

    if (props.backgroundImage && typeof props.backgroundImage !== 'string') {
      errors.push({
        field: 'props.backgroundImage',
        message: 'Background image must be a string URL',
        severity: 'error',
      });
    }

    if (props.buttons && !Array.isArray(props.buttons)) {
      errors.push({
        field: 'props.buttons',
        message: 'Buttons must be an array',
        severity: 'error',
      });
    }
  }

  /**
   * Validate features block props
   */
  private validateFeaturesProps(
    props: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    if (!props.features || !Array.isArray(props.features)) {
      errors.push({
        field: 'props.features',
        message: 'Features block requires a features array',
        severity: 'error',
      });
      return;
    }

    // Validate each feature
    props.features.forEach((feature: any, index: number) => {
      if (!feature.title || typeof feature.title !== 'string') {
        errors.push({
          field: `props.features[${index}].title`,
          message: 'Feature title is required',
          severity: 'error',
        });
      }

      if (!feature.description || typeof feature.description !== 'string') {
        warnings.push({
          field: `props.features[${index}].description`,
          message: 'Feature description is missing',
        });
      }
    });
  }

  /**
   * Validate workflow tabs props
   */
  private validateWorkflowTabsProps(
    props: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    if (!props.mainTabs || !Array.isArray(props.mainTabs)) {
      errors.push({
        field: 'props.mainTabs',
        message: 'Workflow tabs requires mainTabs array',
        severity: 'error',
      });
      return;
    }

    // Validate each main tab
    props.mainTabs.forEach((tab: any, index: number) => {
      if (!tab.id || typeof tab.id !== 'string') {
        errors.push({
          field: `props.mainTabs[${index}].id`,
          message: 'Tab id is required',
          severity: 'error',
        });
      }

      if (!tab.label || typeof tab.label !== 'string') {
        errors.push({
          field: `props.mainTabs[${index}].label`,
          message: 'Tab label is required',
          severity: 'error',
        });
      }

      if (!tab.subTabs || !Array.isArray(tab.subTabs)) {
        warnings.push({
          field: `props.mainTabs[${index}].subTabs`,
          message: 'Tab has no subTabs',
        });
      }
    });
  }

  /**
   * Validate stats block props
   */
  private validateStatsProps(
    props: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    if (!props.stats || !Array.isArray(props.stats)) {
      errors.push({
        field: 'props.stats',
        message: 'Stats block requires stats array',
        severity: 'error',
      });
      return;
    }

    props.stats.forEach((stat: any, index: number) => {
      if (!stat.value || typeof stat.value !== 'string') {
        errors.push({
          field: `props.stats[${index}].value`,
          message: 'Stat value is required',
          severity: 'error',
        });
      }
    });
  }

  /**
   * Validate CTA block props
   */
  private validateCTAProps(
    props: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    if (!props.title || typeof props.title !== 'string') {
      errors.push({
        field: 'props.title',
        message: 'CTA block requires a title',
        severity: 'error',
      });
    }

    if (props.buttons && !Array.isArray(props.buttons)) {
      errors.push({
        field: 'props.buttons',
        message: 'CTA buttons must be an array',
        severity: 'error',
      });
    }
  }

  /**
   * Generic validation for unknown block types
   */
  private validateGenericProps(
    props: Record<string, any>,
    warnings: ValidationWarning[],
  ): void {
    // Check if props is empty
    if (Object.keys(props).length === 0) {
      warnings.push({
        field: 'props',
        message: 'Component has no props',
      });
    }
  }

  /**
   * Verify that a created page exists and is accessible via CMS API
   */
  async verifyPage(pageId: string): Promise<PageVerificationResult> {
    const errors: ValidationError[] = [];

    try {
      // Try to fetch the page
      const response = await this.apiClient.get(`/cms/pages/${pageId}`);
      const page = response.data;

      // Verify page has required fields
      if (!page.id) {
        errors.push({
          field: 'id',
          message: 'Page is missing id field',
          severity: 'critical',
        });
      }

      if (!page.title) {
        errors.push({
          field: 'title',
          message: 'Page is missing title field',
          severity: 'error',
        });
      }

      if (!page.slug) {
        errors.push({
          field: 'slug',
          message: 'Page is missing slug field',
          severity: 'error',
        });
      }

      // Try to fetch page components
      let componentCount = 0;
      try {
        const componentsResponse = await this.apiClient.get(
          `/cms/pages/${pageId}/components`,
        );
        componentCount = componentsResponse.data.length || 0;
      } catch (error) {
        errors.push({
          field: 'components',
          message: 'Failed to fetch page components',
          severity: 'error',
        });
      }

      return {
        pageId,
        exists: true,
        isAccessible: true,
        componentCount,
        errors,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          pageId,
          exists: false,
          isAccessible: false,
          componentCount: 0,
          errors: [
            {
              field: 'page',
              message: `Page ${pageId} not found`,
              severity: 'critical',
            },
          ],
        };
      }

      return {
        pageId,
        exists: false,
        isAccessible: false,
        componentCount: 0,
        errors: [
          {
            field: 'page',
            message: `Failed to verify page: ${error instanceof Error ? error.message : String(error)}`,
            severity: 'critical',
          },
        ],
      };
    }
  }

  /**
   * Check for broken image references
   */
  checkBrokenImages(
    images: ImageReference[],
    mediaMapping: MediaMapping,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const image of images) {
      // Check if image URL is in media mapping
      if (!mediaMapping[image.originalUrl]) {
        warnings.push({
          field: 'image',
          message: `Image not found in media mapping: ${image.originalUrl}`,
          context: image.context,
        });
      }

      // Check if original URL is valid
      if (!image.originalUrl || image.originalUrl.trim().length === 0) {
        errors.push({
          field: 'image.originalUrl',
          message: 'Image has empty URL',
          severity: 'error',
        });
      }

      // Check if URL is a valid format
      if (image.originalUrl && !this.isValidUrl(image.originalUrl)) {
        warnings.push({
          field: 'image.originalUrl',
          message: `Image URL may be invalid: ${image.originalUrl}`,
          context: image.context,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if a string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    // Check for relative URLs (valid)
    if (url.startsWith('/')) {
      return true;
    }

    // Check for absolute URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate batch of pages
   */
  async validateBatch(
    pageIds: string[],
  ): Promise<PageVerificationResult[]> {
    const results: PageVerificationResult[] = [];

    for (const pageId of pageIds) {
      try {
        const result = await this.verifyPage(pageId);
        results.push(result);
      } catch (error) {
        this.logger.error(
          'Validator',
          `Failed to validate page ${pageId}`,
          error as Error,
        );
        results.push({
          pageId,
          exists: false,
          isAccessible: false,
          componentCount: 0,
          errors: [
            {
              field: 'page',
              message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
              severity: 'critical',
            },
          ],
        });
      }
    }

    return results;
  }

  /**
   * Generate validation report
   */
  generateValidationReport(
    contentValidation: ValidationResult,
    imageValidation: ValidationResult,
    pageVerification?: PageVerificationResult,
  ): string {
    const lines: string[] = [];

    lines.push('=== Validation Report ===\n');

    // Content validation
    lines.push('Content Validation:');
    lines.push(`  Valid: ${contentValidation.isValid ? 'Yes' : 'No'}`);
    lines.push(`  Errors: ${contentValidation.errors.length}`);
    lines.push(`  Warnings: ${contentValidation.warnings.length}`);

    if (contentValidation.errors.length > 0) {
      lines.push('\n  Errors:');
      contentValidation.errors.forEach((error) => {
        lines.push(`    - [${error.severity}] ${error.field}: ${error.message}`);
      });
    }

    if (contentValidation.warnings.length > 0) {
      lines.push('\n  Warnings:');
      contentValidation.warnings.forEach((warning) => {
        lines.push(`    - ${warning.field}: ${warning.message}`);
      });
    }

    // Image validation
    lines.push('\n\nImage Validation:');
    lines.push(`  Valid: ${imageValidation.isValid ? 'Yes' : 'No'}`);
    lines.push(`  Errors: ${imageValidation.errors.length}`);
    lines.push(`  Warnings: ${imageValidation.warnings.length}`);

    if (imageValidation.warnings.length > 0) {
      lines.push('\n  Warnings:');
      imageValidation.warnings.forEach((warning) => {
        lines.push(`    - ${warning.message}`);
        if (warning.context) {
          lines.push(`      Context: ${warning.context}`);
        }
      });
    }

    // Page verification
    if (pageVerification) {
      lines.push('\n\nPage Verification:');
      lines.push(`  Page ID: ${pageVerification.pageId}`);
      lines.push(`  Exists: ${pageVerification.exists ? 'Yes' : 'No'}`);
      lines.push(`  Accessible: ${pageVerification.isAccessible ? 'Yes' : 'No'}`);
      lines.push(`  Components: ${pageVerification.componentCount}`);

      if (pageVerification.errors.length > 0) {
        lines.push('\n  Errors:');
        pageVerification.errors.forEach((error) => {
          lines.push(`    - [${error.severity}] ${error.field}: ${error.message}`);
        });
      }
    }

    return lines.join('\n');
  }
}
