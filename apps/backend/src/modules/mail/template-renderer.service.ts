import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

/**
 * Template Renderer Service
 * Loads pre-compiled HTML email templates
 *
 * Architecture:
 * - Build time: React Email templates (.tsx) → compiled to static HTML (.html)
 * - Runtime: Simply load pre-compiled HTML from disk
 *
 * Why pre-compiled templates?
 * - NestJS can't dynamically import .tsx files at runtime
 * - No JSX/React runtime dependency in production
 * - Fastest possible email rendering (just file read)
 * - Production-ready and reliable
 *
 * IMPORTANT: Templates are compiled with sample data at build time.
 * For production, you must implement dynamic variable injection (Handlebars/Mustache/etc)
 * or generate multiple variants at build time.
 */
@Injectable()
export class TemplateRendererService {
  private readonly logger = new Logger(TemplateRendererService.name);
  private readonly templatesDir: string;
  private templateCache: Map<string, string> = new Map();

  constructor(private readonly settingsService: SettingsService) {
    // Templates are now organized by module
    // Legacy path for backward compatibility
    this.templatesDir = path.join(__dirname, '../../templates');
    this.logger.log(`📧 Template directory (legacy): ${this.templatesDir}`);

    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Helper for equality check
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    this.logger.log('✅ Handlebars helpers registered');
  }

  /**
   * Render a pre-compiled HTML template with Handlebars
   * @param templateName - Name of the template (e.g., 'ticket-created')
   * @param context - Variables to inject into template
   */
  async renderTemplate(
    templateName: string,
    context: Record<string, any> = {},
  ): Promise<string> {
    try {
      this.logger.log(`📧 Loading template: ${templateName}`);
      this.logger.log(`📋 Context keys: ${Object.keys(context).join(', ')}`);

      // Load pre-compiled HTML template (Handlebars template)
      const templateSource = await this.loadTemplate(templateName);

      // Compile Handlebars template
      const template = Handlebars.compile(templateSource);

      // Render with context
      const html = template(context);

      this.logger.log(`✅ Template rendered successfully: ${templateName}`);
      return html;
    } catch (error) {
      this.logger.error(
        `❌ Failed to render template ${templateName}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Resolve template path based on module
   * ticket-created → dist/modules/tickets/templates/ticket-created.html
   * email-verification → dist/modules/mail/templates/email-verification.html
   * abandoned-cart → dist/modules/email-marketing/templates/abandoned-cart.html
   */
  private resolveTemplatePath(templateName: string): string {
    const basePath = path.join(__dirname, '../..');

    // Ticket templates
    if (templateName.startsWith('ticket-') || templateName.startsWith('csat-') || templateName.startsWith('sla-')) {
      return path.join(basePath, 'modules/tickets/templates', `${templateName}.html`);
    }

    // Marketing templates
    if (templateName.match(/abandoned-cart|flash-sale|loyalty|newsletter|product-|seasonal/)) {
      return path.join(basePath, 'modules/email-marketing/templates', `${templateName}.html`);
    }

    // Mail (transactional) templates
    if (templateName.match(/email-verification|password-reset|welcome|order-|invoice/)) {
      return path.join(basePath, 'modules/mail/templates', `${templateName}.html`);
    }

    // Fallback to legacy location
    return path.join(this.templatesDir, `${templateName}.html`);
  }

  /**
   * Load pre-compiled HTML template from disk
   * Uses caching to avoid repeated file reads
   */
  private async loadTemplate(templateName: string): Promise<string> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      this.logger.debug(`📦 Template loaded from cache: ${templateName}`);
      return this.templateCache.get(templateName)!;
    }

    // Resolve template path based on module
    const templatePath = this.resolveTemplatePath(templateName);

    if (!fs.existsSync(templatePath)) {
      const available = this.getAvailableTemplates();
      throw new Error(
        `Template file not found: ${templatePath}\n` +
        `Template name: ${templateName}\n` +
        `Available templates (${available.length}): ${available.join(', ')}\n` +
        `Did you run 'npm run compile:templates' before 'npm run build'?`
      );
    }

    const html = fs.readFileSync(templatePath, 'utf-8');

    // Cache the template
    this.templateCache.set(templateName, html);

    this.logger.log(`📄 Template loaded: ${templateName} (${html.length} bytes) from ${templatePath}`);
    return html;
  }

  /**
   * Get list of available pre-compiled templates
   */
  private getAvailableTemplates(): string[] {
    try {
      if (!fs.existsSync(this.templatesDir)) {
        return [];
      }

      return fs.readdirSync(this.templatesDir)
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
    } catch (error) {
      this.logger.warn(`Failed to list templates: ${error.message}`);
      return [];
    }
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.logger.log('🗑️  Template cache cleared');
  }
}
