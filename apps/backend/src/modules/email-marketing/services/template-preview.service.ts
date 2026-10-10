import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EmailTemplate } from '../entities/email-template.entity';
import { SiteSettingsDto } from '../../settings/dto/site-settings.dto';
import { SettingsService } from '../../settings/settings.service';
import { MjmlRendererService } from './mjml-renderer.service';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * Service for previewing email templates with site settings injected
 * Database-only architecture - all templates are stored in the database
 */
@Injectable()
export class TemplatePreviewService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly mjmlRenderer: MjmlRendererService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Preview template with site settings injected
   * @param template EmailTemplate entity from database
   * @returns Processed HTML content with site settings injected
   */
  async previewTemplate(template: EmailTemplate): Promise<string> {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');

    // Get site settings for placeholder replacement
    const siteSettings = await this.settingsService.getSiteSettings(tenantId);

    // If template has Email Builder structure, render with MJML (includes dynamic header/footer)
    if (template.structure) {
      // MjmlRendererService now handles tenantId internally for header/footer injection in renderEmail options if needed
      // But wait, renderEmail signature is: renderEmail(structure, options)
      // Ah, MjmlRendererService also injects header/footer using settingsService internally.
      // So renderEmail CALL in MjmlRendererService will fetch settings again.
      // However, here we also fetch settings for replacePlaceholders. Double fetch, acceptable for now.

      const { html } = await this.mjmlRenderer.renderEmail(template.structure);
      // Replace placeholders in the rendered HTML
      return this.replacePlaceholders(html, siteSettings);
    }

    // Fallback: Legacy HTML templates (use compiledHtml or content)
    const templateContent = template.compiledHtml || template.content || '';
    const htmlWithSettings = this.injectSiteSettings(templateContent, siteSettings);
    return this.replacePlaceholders(htmlWithSettings, siteSettings);
  }

  private injectSiteSettings(
    templateContent: string,
    siteSettings: SiteSettingsDto,
  ): string {
    // Replace placeholders with actual site settings
    let processedContent = templateContent;

    // Replace company name
    processedContent = processedContent.replace(
      /siteSettingsData\.companyName/g,
      JSON.stringify(siteSettings.companyName),
    );

    // Replace logo URLs
    processedContent = processedContent.replace(
      /siteSettingsData\.logoUrl/g,
      JSON.stringify(siteSettings.logoUrl),
    );

    processedContent = processedContent.replace(
      /siteSettingsData\.logoDarkUrl/g,
      JSON.stringify(siteSettings.logoDarkUrl),
    );

    // Replace contact information
    processedContent = processedContent.replace(
      /siteSettingsData\.contact\.address/g,
      JSON.stringify(siteSettings.contact.address),
    );

    processedContent = processedContent.replace(
      /siteSettingsData\.contact\.phone/g,
      JSON.stringify(siteSettings.contact.phone),
    );

    processedContent = processedContent.replace(
      /siteSettingsData\.contact\.email/g,
      JSON.stringify(siteSettings.contact.email),
    );

    // Replace social media
    const socialMediaStr = JSON.stringify(siteSettings.socialMedia);
    processedContent = processedContent.replace(
      /siteSettingsData\.socialMedia/g,
      socialMediaStr,
    );

    return processedContent;
  }

  /**
   * Replace common email placeholders with preview data
   */
  private replacePlaceholders(html: string, siteSettings: SiteSettingsDto): string {
    let result = html;

    // Replace common template placeholders with sample data for preview
    const placeholders = {
      '{{companyName}}': siteSettings.companyName || 'Your Company',
      '{{content}}': '<p style="margin: 20px 0; line-height: 1.6;">This is preview content. In actual emails, this will be replaced with the campaign content or event details.</p>',
      '{{eventName}}': 'Sample Event Name',
      '{{eventDate}}': 'January 15, 2025',
      '{{eventTime}}': '14:00',
      '{{eventLocation}}': 'Online Webinar',
      '{{userName}}': 'Preview User',
      '{{userEmail}}': 'preview@example.com',
      '{{unsubscribeUrl}}': '#unsubscribe',
      '{{year}}': new Date().getFullYear().toString(),
      '{{address}}': siteSettings.contact?.address || 'Company Address',
      '{{phone}}': siteSettings.contact?.phone || '+90 XXX XXX XX XX',
      '{{email}}': siteSettings.contact?.email || 'info@company.com',
    };

    // Replace all placeholders
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }
}