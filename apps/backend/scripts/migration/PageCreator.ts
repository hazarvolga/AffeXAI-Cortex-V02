/**
 * PageCreator - Creates CMS pages from parsed WordPress content
 * 
 * Responsibilities:
 * - Load page templates from CMS
 * - Create pages via CMS API
 * - Map template blocks to components
 * - Create components with block metadata
 * - Handle errors and rollback
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';
import {
  ParsedContent,
  PageCreationResult,
  MediaMapping,
  TemplateMapping,
} from './types';
import { ComponentType } from '@affexai/shared-types';

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks: TemplateBlock[];
  layoutOptions: Record<string, any>;
}

interface TemplateBlock {
  id: string;
  type: string;
  props: Record<string, any>;
}

interface CreatePageDto {
  title: string;
  slug: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  categoryId?: string;
  layoutOptions?: Record<string, any>;
}

interface CreateComponentDto {
  pageId: string;
  parentId?: string;
  type: ComponentType;
  blockType?: string;
  blockCategory?: string;
  blockId?: string;
  props: Record<string, any>;
  orderIndex: number;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface Component {
  id: string;
  pageId: string;
  type: ComponentType;
  blockType?: string;
  blockId?: string;
  orderIndex: number;
}

export class PageCreator {
  private apiClient: AxiosInstance;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private apiBaseUrl: string;

  constructor(
    apiBaseUrl: string,
    logger: Logger,
    errorHandler: ErrorHandler,
  ) {
    this.apiBaseUrl = apiBaseUrl;
    this.logger = logger;
    this.errorHandler = errorHandler;

    // Create axios instance with default config
    this.apiClient = axios.create({
      baseURL: apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for debugging
    this.apiClient.interceptors.request.use(
      (config) => {
        this.logger.debug('PageCreator', `API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('PageCreator', 'API Request Error', error);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        this.logger.debug('PageCreator', `API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(
          'PageCreator',
          `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.message}`,
          error
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a page from parsed content and template
   */
  async createPage(
    content: ParsedContent,
    templateMapping: TemplateMapping,
    mediaMapping: MediaMapping,
  ): Promise<PageCreationResult> {
    let createdPage: Page | null = null;

    try {
      this.logger.info(
        'PageCreator',
        `Creating page: ${content.title} (template: ${templateMapping.templateName})`,
      );

      // 1. Create page first
      createdPage = await this.createPageFromContent(content);
      this.logger.success('PageCreator', `Page created: ${createdPage.id}`);

      // 2. Try to load template (optional - skip if not available)
      let template: PageTemplate | null = null;
      try {
        template = await this.loadTemplate(templateMapping.templateId);
        this.logger.debug(
          'PageCreator',
          `Loaded template: ${template.name} with ${template.blocks.length} blocks`,
        );
      } catch (templateError) {
        this.logger.warn(
          'PageCreator',
          `Template not available, creating page without template blocks`,
        );
      }

      // 3. Create components from parsed content
      let componentCount = 0;
      
      // Check content type and use appropriate transformer
      const isCorporateHomepage = 'heroCarousel' in content;
      const isIndustrySolution = 'hero' in content && 'workflowTabs' in content;
      
      if (isCorporateHomepage) {
        // Transform Corporate Homepage content to components
        const components = this.transformCorporateHomepageToComponents(
          createdPage.id,
          content as any, // CorporateHomepageContent
          mediaMapping,
        );

        this.logger.debug('PageCreator', `Transformed ${components.length} components from Corporate Homepage content`);

        await this.batchCreateComponents(components);
        componentCount = components.length;
        this.logger.success(
          'PageCreator',
          `Created ${components.length} Corporate Homepage components for page ${createdPage.id}`,
        );
      } else if (isIndustrySolution) {
        // Transform Industry Solution content to components
        const components = this.transformIndustrySolutionToComponents(
          createdPage.id,
          content as any, // IndustrySolutionContent
          mediaMapping,
        );

        this.logger.debug('PageCreator', `Transformed ${components.length} components from Industry Solution content`);

        await this.batchCreateComponents(components);
        componentCount = components.length;
        this.logger.success(
          'PageCreator',
          `Created ${components.length} Industry Solution components for page ${createdPage.id}`,
        );
      } else if (content.sections && content.sections.length > 0) {
        // Fallback: Create components from generic parsed content sections
        const components = this.transformSectionsToComponents(
          createdPage.id,
          content.sections,
          mediaMapping,
        );

        this.logger.debug('PageCreator', `Transformed ${components.length} components from parsed content`);

        await this.batchCreateComponents(components);
        componentCount = components.length;
        this.logger.success(
          'PageCreator',
          `Created ${components.length} components from content for page ${createdPage.id}`,
        );
      } else {
        this.logger.warn(
          'PageCreator',
          `No parseable content available for page ${createdPage.id}`,
        );
      }

      return {
        success: true,
        pageId: createdPage.id,
        componentCount,
      };
    } catch (error) {
      // Rollback: Delete page if created
      if (createdPage) {
        try {
          await this.deletePage(createdPage.id);
          this.logger.warn('PageCreator', `Rolled back page: ${createdPage.id}`);
        } catch (rollbackError) {
          this.logger.error(
            'PageCreator',
            `Failed to rollback page ${createdPage.id}`,
            rollbackError as Error,
          );
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.errorHandler.handleError(
        error as Error,
        'PageCreator',
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Load template from CMS API
   * Supports both ID and name lookup
   */
  private async loadTemplate(templateIdOrName: string): Promise<PageTemplate> {
    try {
      // First try as ID
      try {
        const response = await this.apiClient.get(
          `/cms/templates/${templateIdOrName}`,
        );
        return response.data;
      } catch (idError) {
        // If ID lookup fails, try searching by name
        const response = await this.apiClient.get('/cms/templates');
        const templates = response.data;
        
        // Find template by name (case-insensitive)
        const template = templates.find(
          (t: PageTemplate) => 
            t.name.toLowerCase() === templateIdOrName.toLowerCase() ||
            t.name.toLowerCase().replace(/\s+/g, '-') === templateIdOrName.toLowerCase()
        );
        
        if (!template) {
          throw new Error(`Template not found: ${templateIdOrName}`);
        }
        
        return template;
      }
    } catch (error) {
      throw new Error(
        `Failed to load template ${templateIdOrName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Slugify a string (convert to URL-friendly format)
   * Handles Turkish characters properly
   */
  private slugify(text: string): string {
    const turkishMap: Record<string, string> = {
      'ç': 'c', 'Ç': 'c',
      'ğ': 'g', 'Ğ': 'g',
      'ı': 'i', 'İ': 'i',
      'ö': 'o', 'Ö': 'o',
      'ş': 's', 'Ş': 's',
      'ü': 'u', 'Ü': 'u',
    };

    return text
      .split('')
      .map(char => turkishMap[char] || char)
      .join('')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Create page via CMS API
   */
  private async createPageFromContent(
    content: ParsedContent,
  ): Promise<Page> {
    // Extract year from filename if present (e.g., "2024-Ana-Sayfa.txt" -> "2024")
    const yearMatch = content.metadata.filename.match(/^(\d{4})-/);
    const year = yearMatch ? yearMatch[1] : null;
    
    // Slugify the content slug (handle Turkish characters)
    let baseSlug = this.slugify(content.slug);
    
    // Generate slug with year prefix if available
    if (year) {
      // If slug doesn't already start with year, prepend it
      if (!baseSlug.startsWith(year)) {
        baseSlug = `${year}-${baseSlug}`;
      }
    }

    const pageData: CreatePageDto = {
      title: content.title,
      slug: await this.generateUniqueSlug(baseSlug),
      description: content.metadata.filename,
      status: 'draft', // Start as draft
      layoutOptions: {
        showHeader: true,
        showFooter: true,
        fullWidth: false,
      },
    };

    try {
      const response = await this.apiClient.post('/cms/pages', pageData);
      // API returns { success: true, data: { id, title, ... } }
      const page = response.data.data || response.data;
      return page;
    } catch (error) {
      throw new Error(
        `Failed to create page: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Generate unique slug (handle duplicates)
   */
  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    // First try the base slug
    if (!(await this.pageExists(baseSlug))) {
      this.logger.debug('PageCreator', `Using base slug: ${baseSlug}`);
      return baseSlug;
    }

    this.logger.warn('PageCreator', `Slug ${baseSlug} already exists, generating unique slug`);

    // If base slug exists, try numbered suffixes (1, 2, 3, etc.)
    for (let attempt = 1; attempt <= 100; attempt++) {
      const slug = `${baseSlug}-${attempt}`;
      if (!(await this.pageExists(slug))) {
        this.logger.debug('PageCreator', `Using unique slug: ${slug}`);
        return slug;
      }
    }

    // If all numbered attempts fail, use timestamp as last resort
    const timestamp = Date.now();
    const fallbackSlug = `${baseSlug}-${timestamp}`;
    this.logger.warn('PageCreator', `Using timestamp fallback slug: ${fallbackSlug}`);
    return fallbackSlug;
  }

  /**
   * Check if page with slug exists
   */
  private async pageExists(slug: string): Promise<boolean> {
    try {
      const response = await this.apiClient.get(`/cms/pages/slug/${slug}`);
      // Check if data is not null (page exists)
      const pageData = response.data.data !== undefined ? response.data.data : response.data;
      const exists = pageData !== null && pageData !== undefined && (typeof pageData !== 'object' || Object.keys(pageData).length > 0);
      
      this.logger.debug('PageCreator', `Slug check for "${slug}": ${exists ? 'EXISTS' : 'AVAILABLE'}`);
      return exists;
    } catch (error) {
      // Any error means page doesn't exist
      this.logger.debug('PageCreator', `Slug check for "${slug}": AVAILABLE (error)`);
      return false;
    }
  }

  /**
   * Transform template blocks to component DTOs
   */
  private transformBlocksToComponents(
    pageId: string,
    blocks: TemplateBlock[],
    content: ParsedContent,
    mediaMapping: MediaMapping,
  ): CreateComponentDto[] {
    return blocks.map((block, index) => {
      // Transform props (replace media URLs)
      const transformedProps = this.transformProps(block.props, mediaMapping);

      // Extract block metadata
      const blockCategory = this.extractBlockCategory(block.type);

      return {
        pageId,
        type: ComponentType.BLOCK,
        blockType: block.type,
        blockCategory,
        blockId: block.id,
        props: transformedProps,
        orderIndex: index,
      };
    });
  }

  /**
   * Transform parsed content sections to component DTOs
   */
  private transformSectionsToComponents(
    pageId: string,
    sections: any[],
    mediaMapping: MediaMapping,
  ): CreateComponentDto[] {
    if (sections.length === 0) {
      return [];
    }

    return sections.map((section, index) => {
      const content = section.content || {};
      
      // Transform props (replace media URLs)
      const transformedProps = this.transformProps(content, mediaMapping);
      
      // Get block type from section content or map from section type
      const blockType = content.blockType || this.mapSectionTypeToBlockType(section.type);
      const blockCategory = this.extractBlockCategory(blockType);

      return {
        pageId,
        type: ComponentType.BLOCK,
        blockType,
        blockCategory,
        blockId: `${blockType}-${index}`,
        props: {
          ...transformedProps,
          sectionType: section.type,
          order: section.order || index,
        },
        orderIndex: section.order || index,
      };
    });
  }

  /**
   * Transform Corporate Homepage content to CMS components
   */
  private transformCorporateHomepageToComponents(
    pageId: string,
    content: any, // CorporateHomepageContent
    mediaMapping: MediaMapping,
  ): CreateComponentDto[] {
    const components: CreateComponentDto[] = [];
    let orderIndex = 0;

    // 1. Hero Carousel - Use existing hero-carousel-slides component
    if (content.heroCarousel && content.heroCarousel.slides && content.heroCarousel.slides.length > 0) {
      const carouselProps = this.transformProps(content.heroCarousel, mediaMapping);
      components.push({
        pageId,
        type: ComponentType.BLOCK,
        blockType: 'hero-carousel-slides',
        blockCategory: 'hero',
        blockId: 'hero-carousel-slides',
        props: carouselProps,
        orderIndex: orderIndex++,
      });
    }

    // 2. Solutions Sections - Use cms-solutions-carousel
    if (content.solutionsSections && content.solutionsSections.length > 0) {
      content.solutionsSections.forEach((section: any, index: number) => {
        const solutionsProps = this.transformProps(section, mediaMapping);
        components.push({
          pageId,
          type: ComponentType.BLOCK,
          blockType: 'cms-solutions-carousel',
          blockCategory: 'content',
          blockId: `cms-solutions-carousel-${index}`,
          props: solutionsProps,
          orderIndex: orderIndex++,
        });
      });
    }

    // 3. Products Sections - Use cms-products-carousel
    if (content.productsSections && content.productsSections.length > 0) {
      content.productsSections.forEach((section: any, index: number) => {
        const productsProps = this.transformProps(section, mediaMapping);
        components.push({
          pageId,
          type: ComponentType.BLOCK,
          blockType: 'cms-products-carousel',
          blockCategory: 'content',
          blockId: `cms-products-carousel-${index}`,
          props: productsProps,
          orderIndex: orderIndex++,
        });
      });
    }

    // 4. Features - Use features-icon-grid-three
    if (content.features && content.features.length > 0) {
      const featuresProps = this.transformProps({ features: content.features }, mediaMapping);
      components.push({
        pageId,
        type: ComponentType.BLOCK,
        blockType: 'features-icon-grid-three',
        blockCategory: 'features',
        blockId: 'features-icon-grid-three',
        props: featuresProps,
        orderIndex: orderIndex++,
      });
    }

    // 5. CTA Section - Use cta-banner
    if (content.cta) {
      const ctaProps = this.transformProps(content.cta, mediaMapping);
      components.push({
        pageId,
        type: ComponentType.BLOCK,
        blockType: 'cta-banner',
        blockCategory: 'cta',
        blockId: 'cta-banner',
        props: ctaProps,
        orderIndex: orderIndex++,
      });
    }

    // 6. Newsletter Section - Use newsletter-signup
    if (content.newsletter) {
      const newsletterProps = this.transformProps(content.newsletter, mediaMapping);
      components.push({
        pageId,
        type: ComponentType.BLOCK,
        blockType: 'newsletter-signup',
        blockCategory: 'newsletter',
        blockId: 'newsletter-signup',
        props: newsletterProps,
        orderIndex: orderIndex++,
      });
    }

    return components;
  }

  /**
   * Transform Industry Solution content to CMS components
   */
  private transformIndustrySolutionToComponents(
    pageId: string,
    content: any, // IndustrySolutionContent
    mediaMapping: MediaMapping,
  ): CreateComponentDto[] {
    const components: CreateComponentDto[] = [];
    let orderIndex = 0;

    // 1. Hero Section
    if (content.hero) {
      const heroProps = this.transformProps(content.hero, mediaMapping);
      components.push({
        pageId,
        type: ComponentType.BLOCK,
        blockType: 'hero-centered-bg-image',
        blockCategory: 'hero',
        blockId: 'hero-section',
        props: heroProps,
        orderIndex: orderIndex++,
      });
    }

    // 2. Workflow Tabs Section
    if (content.workflowTabs) {
      const workflowProps = this.transformProps(content.workflowTabs, mediaMapping);
      components.push({
        pageId,
        type: ComponentType.BLOCK,
        blockType: 'workflow-tabs',
        blockCategory: 'workflow',
        blockId: 'workflow-section',
        props: workflowProps,
        orderIndex: orderIndex++,
      });
    }

    // 3. Features Section - Use features-icon-grid-three
    if (content.features) {
      const featuresProps = this.transformProps(content.features, mediaMapping);
      components.push({
        pageId,
        type: ComponentType.BLOCK,
        blockType: 'features-icon-grid-three',
        blockCategory: 'features',
        blockId: 'features-icon-grid-three',
        props: featuresProps,
        orderIndex: orderIndex++,
      });
    }

    // 4. Stats Section - Use stats-metrics-grid
    if (content.stats) {
      const statsProps = this.transformProps(content.stats, mediaMapping);
      components.push({
        pageId,
        type: ComponentType.BLOCK,
        blockType: 'stats-metrics-grid',
        blockCategory: 'stats',
        blockId: 'stats-metrics-grid',
        props: statsProps,
        orderIndex: orderIndex++,
      });
    }

    // 5. CTA Section - Use cta-banner
    if (content.cta) {
      const ctaProps = this.transformProps(content.cta, mediaMapping);
      components.push({
        pageId,
        type: ComponentType.BLOCK,
        blockType: 'cta-banner',
        blockCategory: 'cta',
        blockId: 'cta-banner',
        props: ctaProps,
        orderIndex: orderIndex++,
      });
    }

    return components;
  }

  /**
   * Map content section type to CMS block type
   */
  private mapSectionTypeToBlockType(sectionType: string): string {
    const mapping: Record<string, string> = {
      'hero': 'hero-centered-bg-image',
      'features': 'features-grid',
      'stats': 'stats-section',
      'cta': 'cta-section',
      'text': 'text-content',
      'workflow': 'workflow-tabs',
    };

    return mapping[sectionType] || 'text-content';
  }

  /**
   * Extract block category from block type
   * Example: 'hero-centered-bg-image' -> 'hero'
   */
  private extractBlockCategory(blockType: string): string {
    const parts = blockType.split('-');
    return parts[0] || 'content';
  }

  /**
   * Transform props (replace media URLs with new CMS URLs)
   */
  private transformProps(
    props: Record<string, any>,
    mediaMapping: MediaMapping,
  ): Record<string, any> {
    const transformed = { ...props };

    // Recursively replace URLs in props
    const replaceUrls = (obj: any): any => {
      if (typeof obj === 'string') {
        // Check if it's a URL that needs replacement
        return mediaMapping[obj] || obj;
      } else if (Array.isArray(obj)) {
        return obj.map(replaceUrls);
      } else if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = replaceUrls(value);
        }
        return result;
      }
      return obj;
    };

    return replaceUrls(transformed);
  }

  /**
   * Batch create components
   */
  private async batchCreateComponents(
    components: CreateComponentDto[],
  ): Promise<Component[]> {
    try {
      // Check if batch endpoint exists, otherwise create one by one
      try {
        const response = await this.apiClient.post(
          '/cms/components/batch',
          components,
        );
        return response.data;
      } catch (error) {
        // Batch endpoint doesn't exist, create one by one
        this.logger.debug(
          'PageCreator',
          'Batch endpoint not available, creating components individually',
        );
        return await this.createComponentsIndividually(components);
      }
    } catch (error) {
      throw new Error(
        `Failed to create components: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Create components one by one (fallback)
   */
  private async createComponentsIndividually(
    components: CreateComponentDto[],
  ): Promise<Component[]> {
    const created: Component[] = [];

    for (const component of components) {
      try {
        const response = await this.apiClient.post(
          '/cms/components',
          component,
        );
        created.push(response.data);
      } catch (error) {
        this.logger.error(
          'PageCreator',
          `Failed to create component ${component.blockId}`,
          error as Error,
        );
        throw error;
      }
    }

    return created;
  }

  /**
   * Delete page (for rollback)
   */
  private async deletePage(pageId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/cms/pages/${pageId}`);
    } catch (error) {
      throw new Error(
        `Failed to delete page ${pageId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Publish page
   */
  async publishPage(pageId: string): Promise<void> {
    try {
      await this.apiClient.post(`/cms/pages/${pageId}/publish`);
      this.logger.success('PageCreator', `Published page: ${pageId}`);
    } catch (error) {
      throw new Error(
        `Failed to publish page ${pageId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
