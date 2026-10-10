/**
 * WordPress CMS Migration - Validator
 * 
 * Validates migrated content to ensure quality and correctness:
 * - Pages have required fields (title, slug, template)
 * - Components have valid structure (type='block', valid block_id)
 * - Media Entities use relative paths (/cms-media/*)
 * - References are valid (imageMediaId, parentId, pageId)
 * - Props use correct naming (imageUrl not src, htmlContent not content)
 * 
 * Generates detailed validation report with errors and warnings.
 */

import { DataSource } from 'typeorm';
import { Page } from '../../../modules/cms/entities/page.entity';
import { Component } from '../../../modules/cms/entities/component.entity';
import { Media } from '../../../modules/media/entities/media.entity';
import { PageTemplate } from '../../../modules/cms/entities/page-template.entity';
import { log } from '../utils/logger';

export interface ValidationError {
  type: 'page' | 'component' | 'media' | 'reference' | 'props';
  severity: 'error' | 'warning';
  entity: string;
  entityId: string;
  field?: string;
  message: string;
  details?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalPages: number;
    totalComponents: number;
    totalMediaEntities: number;
    errorCount: number;
    warningCount: number;
    validPages: number;
    validComponents: number;
    validMediaEntities: number;
  };
}

// Block registry - available blocks from frontend
const BLOCK_REGISTRY = [
  'content-rich-text',
  'content-simple-block',
  'content-image-side-by-side',
  'content-section-with-title',
  'gallery-single-image',
  'video-embed-section',
  'element-button-group',
];

// Expected props for each block type
const BLOCK_PROPS_SCHEMA: Record<string, string[]> = {
  'gallery-single-image': ['imageUrl', 'imageMediaId', 'alt', 'caption', 'title'],
  'content-rich-text': ['htmlContent'],
  'content-image-side-by-side': ['imageUrl', 'imageMediaId', 'htmlContent', 'imagePosition'],
  'element-button-group': ['buttons'],
  'video-embed-section': ['videoUrl', 'provider', 'title', 'autoplay', 'aspectRatio'],
  'content-section-with-title': ['title'],
};

export class Validator {
  private dataSource: DataSource;
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Main validation method - validates entire migration
   */
  async validateMigration(): Promise<ValidationResult> {
    log.info('='.repeat(80));
    log.info('Starting Migration Validation');
    log.info('='.repeat(80));

    this.errors = [];
    this.warnings = [];

    // Step 1: Validate pages
    log.info('Step 1: Validating pages...');
    await this.validatePages();

    // Step 2: Validate components
    log.info('Step 2: Validating components...');
    await this.validateComponents();

    // Step 3: Validate media entities
    log.info('Step 3: Validating media entities...');
    await this.validateMediaEntities();

    // Step 4: Validate references
    log.info('Step 4: Validating references...');
    await this.validateReferences();

    // Step 5: Validate props
    log.info('Step 5: Validating component props...');
    await this.validateProps();

    // Generate summary
    const summary = await this.generateSummary();

    const result: ValidationResult = {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary,
    };

    // Print report
    this.printValidationReport(result);

    return result;
  }

  /**
   * Validate pages have required fields
   */
  private async validatePages(): Promise<void> {
    const pages = await this.dataSource.query(`
      SELECT id, title, slug, layout_options
      FROM cms_pages
    `);

    for (const page of pages) {
      // Check title
      if (!page.title || page.title.trim() === '') {
        this.errors.push({
          type: 'page',
          severity: 'error',
          entity: 'Page',
          entityId: page.id,
          field: 'title',
          message: 'Page has empty title',
        });
      }

      // Check slug
      if (!page.slug || page.slug.trim() === '') {
        this.errors.push({
          type: 'page',
          severity: 'error',
          entity: 'Page',
          entityId: page.id,
          field: 'slug',
          message: 'Page has empty slug',
        });
      }

      // Check template
      if (!page.layout_options || !page.layout_options.templateId) {
        this.errors.push({
          type: 'page',
          severity: 'error',
          entity: 'Page',
          entityId: page.id,
          field: 'layout_options.templateId',
          message: 'Page has no template assigned',
        });
      }
    }

    log.info(`  Validated ${pages.length} pages`);
  }

  /**
   * Validate components have valid structure
   */
  private async validateComponents(): Promise<void> {
    const components = await this.dataSource.query(`
      SELECT id, page_id, type, block_id, block_type, block_category, props
      FROM cms_components
    `);

    for (const component of components) {
      // Check type='block'
      if (component.type !== 'block') {
        this.errors.push({
          type: 'component',
          severity: 'error',
          entity: 'Component',
          entityId: component.id,
          field: 'type',
          message: `Component type must be 'block', got '${component.type}'`,
        });
      }

      // Check block_id exists
      if (!component.block_id || component.block_id.trim() === '') {
        this.errors.push({
          type: 'component',
          severity: 'error',
          entity: 'Component',
          entityId: component.id,
          field: 'block_id',
          message: 'Component has empty block_id',
        });
      } else {
        // Check block_id is in registry
        if (!BLOCK_REGISTRY.includes(component.block_id)) {
          this.errors.push({
            type: 'component',
            severity: 'error',
            entity: 'Component',
            entityId: component.id,
            field: 'block_id',
            message: `Component block_id '${component.block_id}' not found in block registry`,
            details: { validBlocks: BLOCK_REGISTRY },
          });
        }
      }

      // Check block_type
      if (!component.block_type || component.block_type.trim() === '') {
        this.errors.push({
          type: 'component',
          severity: 'error',
          entity: 'Component',
          entityId: component.id,
          field: 'block_type',
          message: 'Component has empty block_type',
        });
      }

      // Check block_category
      if (!component.block_category || component.block_category.trim() === '') {
        this.errors.push({
          type: 'component',
          severity: 'error',
          entity: 'Component',
          entityId: component.id,
          field: 'block_category',
          message: 'Component has empty block_category',
        });
      }
    }

    log.info(`  Validated ${components.length} components`);
  }

  /**
   * Validate media entities use relative paths
   */
  private async validateMediaEntities(): Promise<void> {
    const mediaEntities = await this.dataSource.query(`
      SELECT id, filename, url, "mimeType"
      FROM media
      WHERE module = 'cms'
    `);

    for (const media of mediaEntities) {
      // Check URL is relative path
      if (!media.url || !media.url.startsWith('/cms-media/')) {
        this.errors.push({
          type: 'media',
          severity: 'error',
          entity: 'Media',
          entityId: media.id,
          field: 'url',
          message: `Media Entity URL must start with '/cms-media/', got '${media.url}'`,
        });
      }

      // Check filename exists
      if (!media.filename || media.filename.trim() === '') {
        this.errors.push({
          type: 'media',
          severity: 'error',
          entity: 'Media',
          entityId: media.id,
          field: 'filename',
          message: 'Media Entity has empty filename',
        });
      }

      // Check mimeType exists
      if (!media.mimeType || media.mimeType.trim() === '') {
        this.warnings.push({
          type: 'media',
          severity: 'warning',
          entity: 'Media',
          entityId: media.id,
          field: 'mimeType',
          message: 'Media Entity has empty mimeType',
        });
      }
    }

    log.info(`  Validated ${mediaEntities.length} media entities`);
  }

  /**
   * Validate references are valid
   */
  private async validateReferences(): Promise<void> {
    // Validate imageMediaId references
    const componentsWithImages = await this.dataSource.query(`
      SELECT id, props
      FROM cms_components
      WHERE props->>'imageMediaId' IS NOT NULL
    `);

    for (const component of componentsWithImages) {
      const imageMediaId = component.props.imageMediaId;
      
      const mediaExists = await this.dataSource.query(
        `SELECT id FROM media WHERE id = $1`,
        [imageMediaId]
      );

      if (mediaExists.length === 0) {
        this.errors.push({
          type: 'reference',
          severity: 'error',
          entity: 'Component',
          entityId: component.id,
          field: 'props.imageMediaId',
          message: `Component references non-existent Media Entity: ${imageMediaId}`,
        });
      }
    }

    // Validate parentId references
    const componentsWithParent = await this.dataSource.query(`
      SELECT id, parent_id
      FROM cms_components
      WHERE parent_id IS NOT NULL
    `);

    for (const component of componentsWithParent) {
      const parentExists = await this.dataSource.query(
        `SELECT id FROM cms_components WHERE id = $1`,
        [component.parent_id]
      );

      if (parentExists.length === 0) {
        this.errors.push({
          type: 'reference',
          severity: 'error',
          entity: 'Component',
          entityId: component.id,
          field: 'parent_id',
          message: `Component references non-existent parent: ${component.parent_id}`,
        });
      }
    }

    // Validate pageId references
    const components = await this.dataSource.query(`
      SELECT id, page_id
      FROM cms_components
    `);

    for (const component of components) {
      const pageExists = await this.dataSource.query(
        `SELECT id FROM cms_pages WHERE id = $1`,
        [component.page_id]
      );

      if (pageExists.length === 0) {
        this.errors.push({
          type: 'reference',
          severity: 'error',
          entity: 'Component',
          entityId: component.id,
          field: 'page_id',
          message: `Component references non-existent page: ${component.page_id}`,
        });
      }
    }

    log.info(`  Validated references for ${components.length} components`);
  }

  /**
   * Validate component props use correct naming
   */
  private async validateProps(): Promise<void> {
    const components = await this.dataSource.query(`
      SELECT id, block_id, props
      FROM cms_components
    `);

    for (const component of components) {
      const props = component.props || {};

      // Check for incorrect prop names
      if (props.src) {
        this.errors.push({
          type: 'props',
          severity: 'error',
          entity: 'Component',
          entityId: component.id,
          field: 'props.src',
          message: "Component uses 'src' property, should use 'imageUrl'",
        });
      }

      if (props.content && component.block_id === 'content-rich-text') {
        this.errors.push({
          type: 'props',
          severity: 'error',
          entity: 'Component',
          entityId: component.id,
          field: 'props.content',
          message: "Component uses 'content' property, should use 'htmlContent'",
        });
      }

      // Check for undefined or null values
      for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === null) {
          this.warnings.push({
            type: 'props',
            severity: 'warning',
            entity: 'Component',
            entityId: component.id,
            field: `props.${key}`,
            message: `Component prop '${key}' is ${value}`,
          });
        }
      }

      // Check props match expected schema
      const expectedProps = BLOCK_PROPS_SCHEMA[component.block_id];
      if (expectedProps) {
        const propKeys = Object.keys(props);
        const unexpectedProps = propKeys.filter(key => !expectedProps.includes(key));
        
        if (unexpectedProps.length > 0) {
          this.warnings.push({
            type: 'props',
            severity: 'warning',
            entity: 'Component',
            entityId: component.id,
            field: 'props',
            message: `Component has unexpected props: ${unexpectedProps.join(', ')}`,
            details: { expected: expectedProps, actual: propKeys },
          });
        }
      }
    }

    log.info(`  Validated props for ${components.length} components`);
  }

  /**
   * Generate validation summary
   */
  private async generateSummary(): Promise<ValidationResult['summary']> {
    const pages = await this.dataSource.query('SELECT COUNT(*) as count FROM cms_pages');
    const components = await this.dataSource.query('SELECT COUNT(*) as count FROM cms_components');
    const media = await this.dataSource.query("SELECT COUNT(*) as count FROM media WHERE module = 'cms'");

    const pageErrors = this.errors.filter(e => e.type === 'page').length;
    const componentErrors = this.errors.filter(e => e.type === 'component').length;
    const mediaErrors = this.errors.filter(e => e.type === 'media').length;

    return {
      totalPages: parseInt(pages[0].count),
      totalComponents: parseInt(components[0].count),
      totalMediaEntities: parseInt(media[0].count),
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      validPages: parseInt(pages[0].count) - pageErrors,
      validComponents: parseInt(components[0].count) - componentErrors,
      validMediaEntities: parseInt(media[0].count) - mediaErrors,
    };
  }

  /**
   * Print validation report
   */
  private printValidationReport(result: ValidationResult): void {
    log.info('\n' + '='.repeat(80));
    log.info('Validation Report');
    log.info('='.repeat(80));
    log.info(`Status: ${result.valid ? '✓ PASSED' : '✗ FAILED'}`);
    log.info('');
    log.info('Summary:');
    log.info(`  Total Pages: ${result.summary.totalPages} (${result.summary.validPages} valid)`);
    log.info(`  Total Components: ${result.summary.totalComponents} (${result.summary.validComponents} valid)`);
    log.info(`  Total Media Entities: ${result.summary.totalMediaEntities} (${result.summary.validMediaEntities} valid)`);
    log.info(`  Errors: ${result.summary.errorCount}`);
    log.info(`  Warnings: ${result.summary.warningCount}`);
    log.info('');

    if (result.errors.length > 0) {
      log.info('Errors:');
      for (const error of result.errors.slice(0, 20)) {
        log.error(`  [${error.type}] ${error.entity} ${error.entityId}: ${error.message}`);
      }
      if (result.errors.length > 20) {
        log.info(`  ... and ${result.errors.length - 20} more errors`);
      }
      log.info('');
    }

    if (result.warnings.length > 0) {
      log.info('Warnings:');
      for (const warning of result.warnings.slice(0, 10)) {
        log.warn(`  [${warning.type}] ${warning.entity} ${warning.entityId}: ${warning.message}`);
      }
      if (result.warnings.length > 10) {
        log.info(`  ... and ${result.warnings.length - 10} more warnings`);
      }
      log.info('');
    }

    log.info('='.repeat(80));
  }

  /**
   * Generate detailed validation report as JSON
   */
  generateJSONReport(result: ValidationResult): string {
    return JSON.stringify(result, null, 2);
  }
}
