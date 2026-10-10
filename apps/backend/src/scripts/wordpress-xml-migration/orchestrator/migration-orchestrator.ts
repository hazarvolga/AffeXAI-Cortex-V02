/**
 * WordPress CMS Migration - Migration Orchestrator
 * 
 * Coordinates the entire migration process by orchestrating all components:
 * - XML Parser
 * - HTML Parser
 * - Component Mapper
 * - Media Manager
 * - Template Mapper
 * - SEO Metadata Extractor
 * - Button Extractor
 * - Video Extractor
 * - Hierarchy Manager
 * 
 * Handles page creation with components in database transactions.
 */

import { DataSource, Repository } from 'typeorm';
import { Page } from '../../../modules/cms/entities/page.entity';
import { Component } from '../../../modules/cms/entities/component.entity';
import { Media } from '../../../modules/media/entities/media.entity';
import { XMLParser } from '../parsers/xml-parser';
import { HTMLParser } from '../parsers/html-parser';
import { ComponentMapper } from '../mappers/component-mapper';
import { MediaManager } from '../managers/media-manager';
import { TemplateMapper } from '../mappers/template-mapper';
import { SEOMetadataExtractor } from '../extractors/seo-metadata-extractor';
import { ButtonExtractor } from '../extractors/button-extractor';
import { VideoExtractor } from '../extractors/video-extractor';
import { HierarchyManager } from '../managers/hierarchy-manager';
import { HTMLSanitizer } from '../utils/html-sanitizer';
import { log } from '../utils/logger';
import {
  MigrationConfig,
  MigrationResult,
  PageMigrationResult,
  MigrationError,
  WordPressPage,
  ComponentMapping,
  ComponentType,
  PageStatus,
  ParsedElement,
} from '../types/migration.types';

export class MigrationOrchestrator {
  private xmlParser: XMLParser;
  private htmlParser: HTMLParser;
  private componentMapper: ComponentMapper;
  private mediaManager: MediaManager;
  private templateMapper: TemplateMapper;
  private seoExtractor: SEOMetadataExtractor;
  private buttonExtractor: ButtonExtractor;
  private videoExtractor: VideoExtractor;
  private hierarchyManager: HierarchyManager;
  private htmlSanitizer: HTMLSanitizer;
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    
    // Initialize components
    this.xmlParser = new XMLParser();
    this.htmlParser = new HTMLParser();
    this.componentMapper = new ComponentMapper();
    this.mediaManager = new MediaManager(dataSource);
    this.templateMapper = new TemplateMapper(dataSource);
    this.seoExtractor = new SEOMetadataExtractor();
    this.buttonExtractor = new ButtonExtractor();
    this.videoExtractor = new VideoExtractor();
    this.hierarchyManager = new HierarchyManager();
    this.htmlSanitizer = new HTMLSanitizer();
  }

  /**
   * Main migration method - orchestrates entire migration process
   */
  async migrate(config: MigrationConfig): Promise<MigrationResult> {
    const startTime = Date.now();
    
    log.info('='.repeat(80));
    log.info('Starting WordPress to CMS Migration');
    log.info('='.repeat(80));
    log.info(`XML File: ${config.xmlFilePath}`);
    log.info(`Mapping File: ${config.mappingFilePath}`);
    log.info(`Template Mapping: ${config.templateMappingPath}`);
    log.info(`Dry Run: ${config.dryRun}`);
    log.info('='.repeat(80));

    const result: MigrationResult = {
      totalPages: 0,
      successfulPages: 0,
      failedPages: 0,
      totalComponents: 0,
      totalMediaEntities: 0,
      totalVideos: 0,
      errors: [],
      duration: 0,
    };

    try {
      // Step 1: Load media mapping
      log.info('Step 1: Loading media mapping...');
      await this.mediaManager.loadMediaMapping(config.mappingFilePath);
      const mappingStats = this.mediaManager.getMappingStats();
      log.info(`Loaded ${mappingStats.total} media mappings`);

      // Step 2: Load templates
      log.info('Step 2: Loading templates...');
      await this.templateMapper.loadTemplates();
      const templateStats = this.templateMapper.getStats();
      log.info(`Loaded ${templateStats.totalTemplates} templates`);
      log.info(`Default template: ${templateStats.defaultTemplate}`);

      // Step 3: Parse WordPress XML
      log.info('Step 3: Parsing WordPress XML...');
      const pages = await this.xmlParser.parseWordPressXML(config.xmlFilePath);
      result.totalPages = pages.length;
      log.info(`Found ${pages.length} pages to migrate`);

      // Step 4: Migrate each page
      log.info('Step 4: Migrating pages...');
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        log.info(`\n[${ i + 1}/${pages.length}] Migrating: ${page.title} (${page.slug})`);
        
        try {
          const pageResult = await this.migratePage(page, config.dryRun);
          
          if (pageResult.success) {
            result.successfulPages++;
            result.totalComponents += pageResult.componentsCreated;
            result.totalMediaEntities += pageResult.mediaEntitiesCreated;
            log.info(`✓ Success: ${pageResult.componentsCreated} components, ${pageResult.mediaEntitiesCreated} media entities`);
          } else {
            result.failedPages++;
            result.errors.push({
              page: page.title,
              message: pageResult.error || 'Unknown error',
              stack: pageResult.stack,
            });
            log.error(`✗ Failed: ${pageResult.error}`);
          }
        } catch (error) {
          result.failedPages++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          result.errors.push({
            page: page.title,
            message: errorMessage,
            stack: errorStack,
          });
          log.error(`✗ Failed with exception: ${errorMessage}`);
        }
      }

      // Calculate duration
      result.duration = Date.now() - startTime;

      // Print summary
      this.printMigrationSummary(result);

      return result;
    } catch (error) {
      log.error('Migration failed with critical error', error);
      throw error;
    }
  }

  /**
   * Migrate a single WordPress page
   */
  private async migratePage(
    wpPage: WordPressPage,
    dryRun: boolean
  ): Promise<PageMigrationResult> {
    const result: PageMigrationResult = {
      page: wpPage.title,
      success: false,
      componentsCreated: 0,
      mediaEntitiesCreated: 0,
    };

    try {
      // Step 1: Parse HTML content
      log.info('  → Parsing HTML content...');
      const parsedContent = this.htmlParser.parse(wpPage.content);
      log.info(`    Found: ${parsedContent.images.length} images, ${parsedContent.videos.length} videos, ${parsedContent.buttons.length} buttons`);

      // Step 2: Extract SEO metadata
      log.info('  → Extracting SEO metadata...');
      const seoMetadata = this.seoExtractor.extractMetadata(wpPage.content, wpPage.title);
      log.info(`    Meta title: ${seoMetadata.metaTitle}`);
      log.info(`    Meta description: ${seoMetadata.metaDescription?.substring(0, 50)}...`);

      // Step 3: Get template
      log.info('  → Looking up template...');
      const template = await this.templateMapper.getTemplateForPage(wpPage.title, wpPage.slug);
      log.info(`    Template: ${template.name}`);

      // Step 4: Process media entities
      log.info('  → Processing media entities...');
      const mediaIdMap = new Map<string, string>();
      for (const imageUrl of parsedContent.images) {
        const mediaId = await this.mediaManager.getOrCreateMediaEntity(imageUrl);
        if (mediaId) {
          mediaIdMap.set(imageUrl, mediaId);
          result.mediaEntitiesCreated++;
        }
      }
      log.info(`    Created/found ${result.mediaEntitiesCreated} media entities`);

      // Step 5: Build component hierarchy from parsed elements
      log.info('  → Building component hierarchy...');
      const hierarchicalElements = this.hierarchyManager.buildHierarchy(parsedContent.elements);
      const flatElements = this.hierarchyManager.flattenHierarchy(hierarchicalElements);
      log.info(`    Built hierarchy with ${flatElements.length} elements`);

      // Step 6: Map HTML elements to components
      log.info('  → Mapping HTML to components...');
      const mappedComponents: ComponentMapping[] = [];
      
      for (const flatElement of flatElements) {
        const mappedComponent = this.mapElementToComponent(
          flatElement.element,
          flatElement.order,
          flatElement.parentId
        );
        
        if (mappedComponent) {
          // Update image components with media IDs
          if (mappedComponent.blockId === 'gallery-single-image' && mappedComponent.props.imageUrl) {
            const mediaId = mediaIdMap.get(mappedComponent.props.imageUrl);
            if (mediaId) {
              mappedComponent.props.imageMediaId = mediaId;
            }
          }
          
          mappedComponents.push(mappedComponent);
        }
      }
      
      log.info(`    Mapped ${mappedComponents.length} components`);

      // Step 7: Create page and components in database
      if (!dryRun) {
        log.info('  → Creating page in database...');
        await this.createPageWithComponents(wpPage, mappedComponents, template, seoMetadata);
        result.componentsCreated = mappedComponents.length;
        log.info(`    Created page with ${result.componentsCreated} components`);
      } else {
        log.info('  → [DRY RUN] Skipping database creation');
        result.componentsCreated = mappedComponents.length;
      }

      result.success = true;
      return result;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.stack = error instanceof Error ? error.stack : undefined;
      return result;
    }
  }

  /**
   * Map a single parsed element to a component mapping
   */
  private mapElementToComponent(
    element: any,
    order: number,
    parentId: string | null
  ): ComponentMapping | null {
    const { type, tagName, content, attributes } = element;

    // Map based on element type
    switch (type) {
      case 'image':
        return {
          type: 'block',
          blockId: 'gallery-single-image',
          blockType: 'gallery',
          blockCategory: 'content',
          props: {
            imageUrl: attributes.src || '',
            alt: attributes.alt || '',
            caption: content || '',
          },
          order,
          parentId,
        };

      case 'heading':
        return {
          type: 'block',
          blockId: 'content-single-fullwidth',
          blockType: 'content',
          blockCategory: 'content',
          props: {
            title: this.stripHtmlTags(content || ''),
            titleHtml: this.htmlSanitizer.sanitize(content || ''),
            titleVariant: this.getHeadingVariant(tagName),
            content: '',
          },
          order,
          parentId,
        };

      case 'paragraph':
      case 'list':
        return {
          type: 'block',
          blockId: 'content-single-fullwidth',
          blockType: 'content',
          blockCategory: 'content',
          props: {
            title: '',
            content: this.stripHtmlTags(content || ''),
            contentHtml: this.htmlSanitizer.sanitize(content || ''),
          },
          order,
          parentId,
        };

      case 'button':
        return {
          type: 'block',
          blockId: 'element-button-group',
          blockType: 'element',
          blockCategory: 'interactive',
          props: {
            buttons: [
              {
                text: content || 'Button',
                href: attributes.href || '#',
                variant: attributes.variant || 'primary',
              },
            ],
          },
          order,
          parentId,
        };

      case 'video':
        return {
          type: 'block',
          blockId: 'video-embed-section',
          blockType: 'video',
          blockCategory: 'media',
          props: {
            videoUrl: attributes.src || '',
            provider: attributes.provider || 'youtube',
            title: content || '',
          },
          order,
          parentId,
        };

      case 'section':
        return {
          type: 'block',
          blockId: 'content-section-with-title',
          blockType: 'content',
          blockCategory: 'layout',
          props: {
            title: content || '',
          },
          order,
          parentId,
        };

      default:
        log.warn(`Unknown element type: ${type}`);
        return null;
    }
  }

  /**
   * Create page with components in database transaction
   */
  private async createPageWithComponents(
    wpPage: WordPressPage,
    components: ComponentMapping[],
    template: { id: string; name: string },
    seoMetadata: any
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Check if page already exists
      const existingPages = await manager.query(
        `SELECT id FROM cms_pages WHERE slug = $1`,
        [wpPage.slug]
      );

      let pageId: string;

      if (existingPages.length > 0) {
        // Update existing page
        pageId = existingPages[0].id;
        log.info(`    Page already exists, updating: ${wpPage.slug}`);
        
        await manager.query(
          `UPDATE cms_pages 
           SET title = $1, description = $2, status = $3, layout_options = $4, published_at = $5, updated_at = NOW()
           WHERE id = $6`,
          [
            wpPage.title,
            seoMetadata.metaDescription || '',
            PageStatus.PUBLISHED,
            JSON.stringify({
              templateId: template.id,
              templateName: template.name,
              useTemplateBlocks: false,
              seoMetadata,
            }),
            wpPage.pubDate,
            pageId,
          ]
        );

        // Delete existing components
        await manager.query(`DELETE FROM cms_components WHERE page_id = $1`, [pageId]);
        log.info(`    Deleted existing components for page: ${pageId}`);
      } else {
        // Create new page
        const result = await manager.query(
          `INSERT INTO cms_pages (id, title, slug, description, status, layout_options, published_at, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING id`,
          [
            wpPage.title,
            wpPage.slug,
            seoMetadata.metaDescription || '',
            PageStatus.PUBLISHED,
            JSON.stringify({
              templateId: template.id,
              templateName: template.name,
              useTemplateBlocks: false,
              seoMetadata,
            }),
            wpPage.pubDate,
          ]
        );
        
        pageId = result[0].id;
        log.info(`    Created new page: ${pageId}`);
      }

      // Create components
      for (const comp of components) {
        await manager.query(
          `INSERT INTO cms_components (id, page_id, parent_id, type, block_id, block_type, block_category, props, order_index, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            pageId,
            comp.parentId || null,
            ComponentType.BLOCK,
            comp.blockId,
            comp.blockType,
            comp.blockCategory,
            JSON.stringify(comp.props),
            comp.order,
          ]
        );
      }

      log.info(`    Created ${components.length} components`);
    });
  }

  /**
   * Print migration summary
   */
  private printMigrationSummary(result: MigrationResult): void {
    log.info('\n' + '='.repeat(80));
    log.info('Migration Summary');
    log.info('='.repeat(80));
    log.info(`Total Pages: ${result.totalPages}`);
    log.info(`Successful: ${result.successfulPages}`);
    log.info(`Failed: ${result.failedPages}`);
    log.info(`Total Components: ${result.totalComponents}`);
    log.info(`Total Media Entities: ${result.totalMediaEntities}`);
    log.info(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    
    if (result.errors.length > 0) {
      log.info('\nErrors:');
      for (const error of result.errors) {
        log.error(`  - ${error.page}: ${error.message}`);
      }
    }
    
    log.info('='.repeat(80));
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtmlTags(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Get heading variant based on tag name
   */
  private getHeadingVariant(tagName?: string): string {
    switch (tagName?.toLowerCase()) {
      case 'h1': return 'heading1';
      case 'h2': return 'heading2';
      case 'h3': return 'heading3';
      default: return 'heading2';
    }
  }
}
