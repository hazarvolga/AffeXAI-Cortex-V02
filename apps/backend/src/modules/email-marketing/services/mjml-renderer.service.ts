import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mjml2html from 'mjml';
import { SettingsService } from '../../settings/settings.service';
import { SiteSettingsDto } from '../../settings/dto/site-settings.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface EmailStructure {
  rows: Array<{
    id: string;
    type: string;
    columns: Array<{
      id: string;
      width: string;
      blocks: Array<{
        id: string;
        type: string;
        properties: Record<string, any>;
        styles: Record<string, any>;
      }>;
    }>;
    settings: Record<string, any>;
  }>;
  settings: {
    backgroundColor?: string;
    contentWidth?: string;
    fonts?: string[];
  };
}

@Injectable()
export class MjmlRendererService {
  private readonly logger = new Logger(MjmlRendererService.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Build base URL dynamically from environment variables
   * This ensures URLs work in development, staging, and production
   */
  private getBaseUrl(): string {
    const protocol = this.configService.get<string>('APP_PROTOCOL') || 'http';
    const host = this.configService.get<string>('APP_HOST') || 'localhost';
    const port = this.configService.get<string>('PORT') || '9006';

    // In production, port might be omitted (e.g., https://api.affexai.com)
    // In development, include port (e.g., http://localhost:9006)
    if (port && (host === 'localhost' || host === '127.0.0.1')) {
      return `${protocol}://${host}:${port}`;
    }

    return `${protocol}://${host}`;
  }

  /**
   * Build frontend URL for user-facing links (unsubscribe, etc.)
   */
  private getFrontendUrl(): string {
    const frontendProtocol = this.configService.get<string>('FRONTEND_PROTOCOL') || 'http';
    const frontendHost = this.configService.get<string>('FRONTEND_HOST') || 'localhost';
    const frontendPort = this.configService.get<string>('FRONTEND_PORT') || '9003';

    if (frontendPort && (frontendHost === 'localhost' || frontendHost === '127.0.0.1')) {
      return `${frontendProtocol}://${frontendHost}:${frontendPort}`;
    }

    return `${frontendProtocol}://${frontendHost}`;
  }

  /**
   * Convert JSON email structure to MJML markup
   */
  structureToMjml(structure: EmailStructure): string {
    const { rows, settings } = structure;

    const mjmlContent = `
      <mjml>
        <mj-head>
          ${this.renderHead(settings)}
        </mj-head>
        <mj-body ${this.renderBodyAttributes(settings)}>
          ${rows.map((row) => this.renderRow(row)).join('\n')}
        </mj-body>
      </mjml>
    `;

    return mjmlContent;
  }

  /**
   * Convert MJML to HTML
   */
  mjmlToHtml(mjml: string): { html: string; errors: any[] } {
    try {
      const result = mjml2html(mjml, {
        validationLevel: 'soft',
        minify: false,
      });

      return {
        html: result.html,
        errors: result.errors || [],
      };
    } catch (error) {
      this.logger.error('MJML compilation error:', error);
      throw new Error(`MJML compilation failed: ${error.message}`);
    }
  }

  /**
   * Full pipeline: JSON structure → MJML → HTML
   * Automatically injects header and footer with site settings
   */
  async renderEmail(
    structure: EmailStructure,
    options: { skipHeaderFooter?: boolean } = {}
  ): Promise<{
    mjml: string;
    html: string;
    errors: any[];
  }> {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');

    // Get site settings for header/footer
    const siteSettings = await this.settingsService.getSiteSettings(tenantId);

    // Clone structure to avoid mutating original
    const enhancedStructure = { ...structure, rows: [...structure.rows] };

    // Add header and footer if not skipped
    if (!options.skipHeaderFooter) {
      // Prepend header
      enhancedStructure.rows.unshift(this.createHeaderRow(siteSettings));

      // Append footer
      enhancedStructure.rows.push(this.createFooterRow(siteSettings));
    }

    const mjml = this.structureToMjml(enhancedStructure);
    const { html, errors } = this.mjmlToHtml(mjml);

    return { mjml, html, errors };
  }

  /**
   * Render MJML head section (styles, fonts, meta tags)
   */
  private renderHead(settings: EmailStructure['settings']): string {
    const fonts = settings.fonts || [];

    return `
      <mj-attributes>
        <mj-all font-family="Arial, sans-serif" />
        <mj-text font-size="14px" color="#333333" line-height="1.6" />
        <mj-button font-size="14px" border-radius="4px" />
      </mj-attributes>
      ${fonts.map((font) => `<mj-font name="${font}" href="https://fonts.googleapis.com/css?family=${font}" />`).join('\n')}
      <mj-style>
        .link { color: #0066cc; text-decoration: none; }
        .link:hover { text-decoration: underline; }
      </mj-style>
    `;
  }

  /**
   * Render body attributes
   */
  private renderBodyAttributes(settings: EmailStructure['settings']): string {
    const attrs: string[] = [];

    if (settings.backgroundColor) {
      attrs.push(`background-color="${settings.backgroundColor}"`);
    }
    if (settings.contentWidth) {
      attrs.push(`width="${settings.contentWidth}"`);
    }

    return attrs.join(' ');
  }

  /**
   * Render a single row (section)
   */
  private renderRow(row: EmailStructure['rows'][0]): string {
    const { columns, settings } = row;

    const sectionAttrs = this.renderSectionAttributes(settings);

    return `
      <mj-section ${sectionAttrs}>
        ${columns.map((col) => this.renderColumn(col)).join('\n')}
      </mj-section>
    `;
  }

  /**
   * Render section attributes
   */
  private renderSectionAttributes(settings: Record<string, any>): string {
    const attrs: string[] = [];

    if (settings.backgroundColor) {
      attrs.push(`background-color="${settings.backgroundColor}"`);
    }
    if (settings.paddingTop) {
      attrs.push(`padding-top="${settings.paddingTop}"`);
    }
    if (settings.paddingBottom) {
      attrs.push(`padding-bottom="${settings.paddingBottom}"`);
    }

    return attrs.join(' ');
  }

  /**
   * Render a column
   */
  private renderColumn(column: EmailStructure['rows'][0]['columns'][0]): string {
    const { width, blocks } = column;

    return `
      <mj-column width="${width}">
        ${blocks.map((block) => this.renderBlock(block)).join('\n')}
      </mj-column>
    `;
  }

  /**
   * Render a block based on its type
   */
  private renderBlock(block: EmailStructure['rows'][0]['columns'][0]['blocks'][0]): string {
    const { type, properties, styles } = block;

    switch (type) {
      case 'heading':
        return this.renderHeading(properties, styles);
      case 'text':
        return this.renderText(properties, styles);
      case 'button':
        return this.renderButton(properties, styles);
      case 'image':
        return this.renderImage(properties, styles);
      case 'divider':
        return this.renderDivider(properties, styles);
      case 'spacer':
        return this.renderSpacer(properties, styles);
      case 'html':
        return this.renderHtml(properties);
      default:
        this.logger.warn(`Unknown block type: ${type}`);
        return '';
    }
  }

  private renderHeading(props: Record<string, any>, styles: Record<string, any>): string {
    const attrs = this.buildAttributes({
      'font-size': styles.fontSize || '24px',
      'font-weight': styles.fontWeight || 'bold',
      'color': styles.color || '#333333',
      'align': styles.textAlign || props.align || 'left',
      'padding': styles.padding || '10px 0',
    });

    // Support both 'content' (Email Builder) and 'text' (legacy)
    const text = props.content || props.text || '';
    return `<mj-text ${attrs}>${text}</mj-text>`;
  }

  private renderText(props: Record<string, any>, styles: Record<string, any>): string {
    const attrs = this.buildAttributes({
      'font-size': styles.fontSize || '14px',
      'color': styles.color || '#333333',
      'align': styles.textAlign || props.align || 'left',
      'padding': styles.padding || '10px 0',
      'line-height': styles.lineHeight || '1.6',
    });

    // Support both 'content' (Email Builder) and 'text' (legacy)
    const text = props.content || props.text || '';
    return `<mj-text ${attrs}>${text}</mj-text>`;
  }

  private renderButton(props: Record<string, any>, styles: Record<string, any>): string {
    const attrs = this.buildAttributes({
      'background-color': styles.backgroundColor || '#0066cc',
      'color': styles.color || '#ffffff',
      'font-size': styles.fontSize || '14px',
      'font-weight': styles.fontWeight || 'bold',
      'border-radius': styles.borderRadius || '4px',
      'padding': styles.padding || '12px 24px',
      'align': styles.textAlign || props.align || 'center',
      'href': props.href || props.url || '#',
    });

    // Support both 'content' (Email Builder) and 'text' (legacy)
    const text = props.content || props.text || 'Click here';
    return `<mj-button ${attrs}>${text}</mj-button>`;
  }

  private renderImage(props: Record<string, any>, styles: Record<string, any>): string {
    const attrs = this.buildAttributes({
      'src': props.src || '',
      'alt': props.alt || '',
      'width': styles.width || 'auto',
      'align': props.align || 'center',
      'padding': styles.padding || '10px 0',
    });

    if (props.href) {
      attrs.push(`href="${props.href}"`);
    }

    return `<mj-image ${attrs.join(' ')} />`;
  }

  private renderDivider(props: Record<string, any>, styles: Record<string, any>): string {
    const attrs = this.buildAttributes({
      'border-color': styles.borderColor || '#dddddd',
      'border-width': styles.borderWidth || '1px',
      'padding': styles.padding || '10px 0',
    });

    return `<mj-divider ${attrs} />`;
  }

  private renderSpacer(props: Record<string, any>, styles: Record<string, any>): string {
    const height = styles.height || '20px';
    return `<mj-spacer height="${height}" />`;
  }

  private renderHtml(props: Record<string, any>): string {
    return `<mj-raw>${props.html || ''}</mj-raw>`;
  }

  /**
   * Helper: Build attribute string from object
   */
  private buildAttributes(attrs: Record<string, string>): string[] {
    return Object.entries(attrs)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}="${value}"`);
  }

  /**
   * Create email header row with logo and company name
   */
  private createHeaderRow(siteSettings: SiteSettingsDto): EmailStructure['rows'][0] {
    // Build full URL for logo using environment-based base URL
    const baseUrl = this.getBaseUrl();
    let logoUrl = 'https://via.placeholder.com/200x60?text=Logo';

    if (siteSettings.logoUrl) {
      // If logoUrl is absolute (S3), use it directly
      if (siteSettings.logoUrl.startsWith('http')) {
        logoUrl = siteSettings.logoUrl;
      } else {
        // Otherwise assume local upload
        logoUrl = `${baseUrl}/uploads/${siteSettings.logoUrl}`;
      }
    }

    return {
      id: 'header-row',
      type: 'section',
      columns: [
        {
          id: 'header-col',
          width: '100%',
          blocks: [
            // Logo
            {
              id: 'header-logo',
              type: 'image',
              properties: {
                src: logoUrl,
                alt: siteSettings.companyName || 'Company Logo',
                href: '#',
              },
              styles: {
                width: '200px',
                padding: '20px 0 10px 0',
              },
            },
          ],
        },
      ],
      settings: {
        backgroundColor: '#ffffff',
        padding: '20px 0',
      },
    };
  }

  /**
   * Create email footer row with contact info and social links
   */
  private createFooterRow(siteSettings: SiteSettingsDto): EmailStructure['rows'][0] {
    const footerBlocks: EmailStructure['rows'][0]['columns'][0]['blocks'] = [];

    // Divider
    footerBlocks.push({
      id: 'footer-divider',
      type: 'divider',
      properties: {},
      styles: {
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        padding: '20px 0',
      },
    });

    // Company name
    if (siteSettings.companyName) {
      footerBlocks.push({
        id: 'footer-company',
        type: 'text',
        properties: {
          content: `<strong>${siteSettings.companyName}</strong>`,
        },
        styles: {
          fontSize: '14px',
          color: '#1a202c',
          textAlign: 'center',
          padding: '10px 0 5px 0',
        },
      });
    }

    // Contact info
    const contactParts: string[] = [];
    if (siteSettings.contact?.address) {
      contactParts.push(siteSettings.contact.address);
    }
    if (siteSettings.contact?.phone) {
      contactParts.push(`Tel: ${siteSettings.contact.phone}`);
    }
    if (siteSettings.contact?.email) {
      contactParts.push(`Email: ${siteSettings.contact.email}`);
    }

    if (contactParts.length > 0) {
      footerBlocks.push({
        id: 'footer-contact',
        type: 'text',
        properties: {
          content: contactParts.join(' | '),
        },
        styles: {
          fontSize: '12px',
          color: '#64748b',
          textAlign: 'center',
          padding: '5px 0',
          lineHeight: '1.5',
        },
      });
    }

    // Social media icons with links
    if (siteSettings.socialMedia && Object.keys(siteSettings.socialMedia).length > 0) {
      const socialIcons: string[] = [];

      if (siteSettings.socialMedia.facebook) {
        socialIcons.push(`
          <a href="${siteSettings.socialMedia.facebook}" target="_blank" style="text-decoration: none; margin: 0 8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/145/145802.png" alt="Facebook" width="32" height="32" style="display: inline-block;" />
          </a>
        `);
      }
      if (siteSettings.socialMedia.twitter) {
        socialIcons.push(`
          <a href="${siteSettings.socialMedia.twitter}" target="_blank" style="text-decoration: none; margin: 0 8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" width="32" height="32" style="display: inline-block;" />
          </a>
        `);
      }
      if (siteSettings.socialMedia.linkedin) {
        socialIcons.push(`
          <a href="${siteSettings.socialMedia.linkedin}" target="_blank" style="text-decoration: none; margin: 0 8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/145/145807.png" alt="LinkedIn" width="32" height="32" style="display: inline-block;" />
          </a>
        `);
      }
      if (siteSettings.socialMedia.instagram) {
        socialIcons.push(`
          <a href="${siteSettings.socialMedia.instagram}" target="_blank" style="text-decoration: none; margin: 0 8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="32" height="32" style="display: inline-block;" />
          </a>
        `);
      }
      if (siteSettings.socialMedia.youtube) {
        socialIcons.push(`
          <a href="${siteSettings.socialMedia.youtube}" target="_blank" style="text-decoration: none; margin: 0 8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" width="32" height="32" style="display: inline-block;" />
          </a>
        `);
      }

      if (socialIcons.length > 0) {
        footerBlocks.push({
          id: 'footer-social',
          type: 'text',
          properties: {
            content: `<div style="text-align: center;">${socialIcons.join('')}</div>`,
          },
          styles: {
            padding: '15px 0',
          },
        });
      }
    }

    // Unsubscribe link - token will be injected during actual email sending
    const frontendUrl = this.getFrontendUrl();
    footerBlocks.push({
      id: 'footer-unsubscribe',
      type: 'text',
      properties: {
        content: `<a href="${frontendUrl}/unsubscribe?token={{unsubscribeToken}}" style="color: #94a3b8; text-decoration: underline;">Abonelikten Çık / Unsubscribe</a>`,
      },
      styles: {
        fontSize: '11px',
        color: '#94a3b8',
        textAlign: 'center',
        padding: '10px 0 20px 0',
      },
    });

    return {
      id: 'footer-row',
      type: 'section',
      columns: [
        {
          id: 'footer-col',
          width: '100%',
          blocks: footerBlocks,
        },
      ],
      settings: {
        backgroundColor: '#f8fafc',
        padding: '0 20px',
      },
    };
  }
}
