import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TemplateService } from '../template.service';
import { MjmlRendererService } from './mjml-renderer.service';
import { BlockRendererService } from './block-renderer.service';
import {
  UnifiedTemplate,
  TemplateSource,
  TemplateRenderOptions,
  TemplateRenderResult,
} from '../types/unified-template.types';
import { EmailTemplate } from '../entities/email-template.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * UnifiedTemplateService
 *
 * Single entry point for all email template operations.
 * **Database-only architecture** (Phase 4: File-based templates removed)
 *
 * Strategy:
 * 1. UUID pattern → Database lookup by ID
 * 2. Name lookup → Database lookup by name
 *
 * All templates are now stored in database with MJML-compatible structures.
 * This ensures:
 * - Single source of truth (database)
 * - Universal preview capability (all templates)
 * - Email Builder editing (all templates)
 * - Consistent user experience
 */
@Injectable()
export class UnifiedTemplateService {
  private readonly logger = new Logger(UnifiedTemplateService.name);

  constructor(
    private readonly templateService: TemplateService,
    private readonly mjmlRenderer: MjmlRendererService,
    private readonly blockRenderer: BlockRendererService,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    return tenantId;
  }

  /**
   * Get template from database
   *
   * @param identifier - UUID or template name
   * @returns Unified template object
   */
  async getTemplate(identifier: string): Promise<UnifiedTemplate> {
    const tenantId = this.getTenantId();
    this.logger.debug(`Getting template: ${identifier} for tenant: ${tenantId}`);

    // Strategy 1: UUID pattern → Database lookup by ID
    if (this.isUUID(identifier)) {
      return this.getFromDatabase(identifier);
    }

    // Strategy 2: Name → Database lookup by name
    const dbTemplate = await this.templateService.findByName(identifier);
    // TemplateService.findByName is already tenant-filtered
    if (!dbTemplate) {
      throw new NotFoundException(
        `Template not found with identifier: ${identifier}`,
      );
    }

    this.logger.debug(`Template found in database: ${identifier}`);
    return this.mapToUnified(dbTemplate, TemplateSource.DATABASE);
  }

  /**
   * Render template to HTML
   *
   * @param identifier - Template UUID or name
   * @param options - Render options with data
   * @returns Rendered HTML with MJML
   */
  async renderTemplate(
    identifier: string,
    options: TemplateRenderOptions = {},
  ): Promise<TemplateRenderResult> {
    const template = await this.getTemplate(identifier);
    const { data = {}, interpolate = true } = options;

    if (template.structure) {
      // Email Builder structure → MJML → HTML (with header/footer)
      this.logger.debug(`Rendering template with MJML: ${identifier}`);
      const { mjml, html } = await this.mjmlRenderer.renderEmail(template.structure);

      const finalHtml = interpolate
        ? this.interpolateVariables(html, data)
        : html;

      return {
        html: finalHtml,
        mjml,
        source: TemplateSource.DATABASE,
      };
    } else if (template.content) {
      // Legacy HTML content (old custom templates)
      this.logger.debug(`Rendering legacy HTML template: ${identifier}`);
      const finalHtml = interpolate
        ? this.interpolateVariables(template.content, data)
        : template.content;

      return {
        html: finalHtml,
        source: TemplateSource.DATABASE,
      };
    } else {
      throw new Error(
        `Template ${identifier} has neither structure nor content`,
      );
    }
  }

  /**
   * Render Email Builder template (block-based structure)
   *
   * @param identifier - Template UUID or name
   * @param options - Render options with data
   * @returns Rendered HTML using BlockRendererService
   */
  async renderEmailBuilderTemplate(
    identifier: string,
    options: TemplateRenderOptions = {},
  ): Promise<TemplateRenderResult> {
    const template = await this.getTemplate(identifier);
    const { data = {}, interpolate = true } = options;

    // Email Builder templates have structure property with rows/columns/blocks
    if (template.structure) {
      this.logger.debug(`Rendering Email Builder template: ${identifier}`);

      try {
        const html = await this.blockRenderer.renderToHtml(template.structure);
        const finalHtml = interpolate
          ? this.interpolateVariables(html, data)
          : html;

        return {
          html: finalHtml,
          source: template.source,
        };
      } catch (error) {
        this.logger.error(`Failed to render Email Builder template: ${error.message}`);
        throw error;
      }
    }

    // Fallback to regular render if no structure
    return this.renderTemplate(identifier, options);
  }

  /**
   * Get template from database by UUID
   */
  private async getFromDatabase(id: string): Promise<UnifiedTemplate> {
    try {
      const template = await this.templateService.findOne(id);
      return this.mapToUnified(template, TemplateSource.DATABASE);
    } catch (error) {
      throw new NotFoundException(
        `Database template not found with ID: ${id}`,
      );
    }
  }


  /**
   * Map database entity to unified template
   */
  private mapToUnified(
    template: EmailTemplate,
    source: TemplateSource,
  ): UnifiedTemplate {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      source,
      structure: template.structure,
      content: template.content,
      compiledMjml: template.compiledMjml,
      compiledHtml: template.compiledHtml,
      type: template.type,
      isActive: template.isActive,
      isEditable: template.isEditable,
      version: template.version,
      variables: template.variables,
      createdFrom: template.createdFrom,
      thumbnailUrl: template.thumbnailUrl,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Check if string is a valid UUID
   */
  private isUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Interpolate variables in template
   * Supports {{variable}} syntax
   */
  private interpolateVariables(
    html: string,
    data: Record<string, any>,
  ): string {
    return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * List all available templates (database-only)
   */
  async listAllTemplates(): Promise<UnifiedTemplate[]> {
    const dbTemplates = await this.templateService.findAll();
    // TemplateService.findAll is already tenant-filtered
    return dbTemplates.map((t) =>
      this.mapToUnified(t, TemplateSource.DATABASE),
    );
  }

  /**
   * Check if template exists
   */
  async exists(identifier: string): Promise<boolean> {
    try {
      await this.getTemplate(identifier);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get template source type (always DATABASE now)
   */
  async getTemplateSource(identifier: string): Promise<TemplateSource> {
    // All templates are now in database
    return TemplateSource.DATABASE;
  }
}
