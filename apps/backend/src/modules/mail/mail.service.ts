import { TenantService } from '../../core/tenant/tenant.service';
import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { TemplateRendererService } from './template-renderer.service';
import { ResendMailAdapter } from './adapters/resend-mail.adapter';
import { SesMailAdapter } from './adapters/ses-mail.adapter';
import {
  IMailService,
  SendMailOptions,
  SendMailResult,
  BulkSendOptions,
  MailChannel,
} from './interfaces/mail-service.interface';
import { createHash } from 'node:crypto';
import { EmailProvider, EmailSettingsDto } from '../settings/dto/email-settings.dto';

/**
 * Mail Service Facade
 * Routes emails through appropriate provider based on settings
 *
 * Template Rendering Strategy:
 * 1. Try database templates first (Email Builder system with MJML)
 * 2. Fallback to file-based templates (Handlebars HTML)
 *
 * This allows gradual migration from file-based to database templates.
 */
@Injectable()
export class MailService implements IMailService {
  private readonly logger = new Logger(MailService.name);
  private adapters = new Map<string, { revision: number; fingerprint: string; adapter: IMailService }>();

  constructor(
    private readonly settingsService: SettingsService,
    private readonly templateRenderer: TemplateRendererService,
    private readonly tenantService: TenantService,
  ) { }

  private resolveTenant(explicitTenant?: string): string {
    const context = this.tenantService.getTenantContext();
    if (explicitTenant !== undefined && (!explicitTenant || !/^[A-Za-z0-9_-]{1,128}$/.test(explicitTenant))) {
      throw new BadRequestException('Invalid mail tenant');
    }
    if (explicitTenant && context?.tenantId && explicitTenant !== context.tenantId) {
      throw new ForbiddenException('Mail tenant does not match active scope');
    }
    const tenantId = explicitTenant ??
      (context?.source === 'authenticated' || context?.source === 'system' ? context.tenantId : undefined);
    if (!tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId)) {
      throw new ForbiddenException('Verified mail tenant is required');
    }
    return tenantId;
  }

  // UnifiedTemplateService will be injected via setter after module initialization
  private unifiedTemplateService: any;

  /**
   * Set UnifiedTemplateService (called by EmailMarketingModule)
   * This avoids circular dependency issues
   */
  setUnifiedTemplateService(service: any): void {
    this.unifiedTemplateService = service;
    this.logger.log('✅ UnifiedTemplateService injected - database templates enabled');
  }

  /**
   * Get or create mail adapter for a specific tenant
   */
  private getAdapter(tenantId: string, settings: EmailSettingsDto, revision: number): IMailService {
    // Keep credentials out of cache keys/logs; every call supplies one freshly
    // read settings snapshot for both provider selection and sender defaults.
    const fingerprint = createHash('sha256').update(JSON.stringify([
      settings.provider, settings.resend?.apiKey,
      settings.ses?.accessKey, settings.ses?.secretKey, settings.ses?.region || 'eu-central-1',
    ])).digest('hex');
    const cached = this.adapters.get(tenantId);
    if (cached?.revision === revision && cached.fingerprint === fingerprint) return cached.adapter;
    this.adapters.delete(tenantId);

    let newAdapter: IMailService;

    // Create adapter based on provider
    switch (settings.provider) {
      case EmailProvider.RESEND:
        if (!settings.resend?.apiKey) {
          throw new Error(`Resend API key not configured for tenant ${tenantId}`);
        }
        newAdapter = new ResendMailAdapter(settings.resend.apiKey);
        break;

      case EmailProvider.SES:
        if (!settings.ses?.accessKey || !settings.ses?.secretKey) {
          throw new Error(`AWS SES credentials not configured for tenant ${tenantId}`);
        }
        newAdapter = new SesMailAdapter(
          settings.ses.accessKey,
          settings.ses.secretKey,
          settings.ses.region || 'eu-central-1',
        );
        break;

      default:
        throw new Error(`Unsupported email provider or missing configuration for tenant ${tenantId}`);
    }

    this.adapters.set(tenantId, { revision, fingerprint, adapter: newAdapter });
    this.logger.log(`Initialized mail adapter for tenant ${tenantId} using ${settings.provider}`);
    return newAdapter;
  }

  /**
   * Send a single email with automatic provider routing
   */
  async sendMail(options: SendMailOptions, tenantId?: string): Promise<SendMailResult> {
    tenantId = this.resolveTenant(tenantId);
    this.logger.log(`[EMAIL DEBUG] MailService.sendMail called for tenant: ${tenantId}`);
    const toEmail = Array.isArray(options.to) ? options.to[0]?.email : options.to.email;
    this.logger.log(`[EMAIL DEBUG] To: ${toEmail}, Subject: ${options.subject}, Tenant: ${tenantId}`);

    const { settings, revision } = await this.settingsService.getEmailSettingsSnapshot(tenantId);
    const adapter = this.getAdapter(tenantId, settings, revision);
    this.logger.log(`[EMAIL DEBUG] Email settings provider: ${settings.provider}`);

    // Apply channel-specific defaults if not provided
    let enhancedOptions = await this.applyChannelDefaults(options, settings);

    // Inject tenantId into metadata for webhook tracking
    enhancedOptions.metadata = {
      ...enhancedOptions.metadata,
      tenantId,
    };
    enhancedOptions.tags = [
      ...(enhancedOptions.tags || []),
      `tenant:${tenantId}`,
    ];

    // If template is specified, render it to HTML
    if (options.template && !options.html) {
      try {
        this.logger.log(`📧 Rendering template: ${options.template}`);

        // Strategy 1: Try database templates first (Email Builder with MJML)
        let html: string | null = null;

        if (this.unifiedTemplateService) {
          try {
            this.logger.log(`🔍 Checking database for template: ${options.template}`);

            // Try to get template from database
            const dbTemplate = await this.unifiedTemplateService.getTemplate(options.template, tenantId);

            if (dbTemplate) {
              this.logger.log(`✅ Template found in database: ${options.template}`);

              // Render with UnifiedTemplateService (MJML → HTML with dynamic header/footer)
              const renderResult = await this.unifiedTemplateService.renderTemplate(
                options.template,
                {
                  interpolate: true,
                  data: options.context || {},
                }
              );

              html = renderResult.html;
              this.logger.log(`✅ Database template rendered successfully: ${options.template}`);
            }
          } catch (dbError) {
            // Template not found in database - will fallback to file system
            this.logger.log(`ℹ️ Template not in database: ${options.template} - ${dbError.message}`);
          }
        }

        // Strategy 2: Fallback to file-based templates (Handlebars HTML)
        if (!html) {
          this.logger.log(`📁 Using file-based template: ${options.template}`);
          html = await this.templateRenderer.renderTemplate(
            options.template,
            options.context || {},
          );
          this.logger.log(`✅ File-based template rendered: ${options.template}`);
        }

        enhancedOptions = { ...enhancedOptions, html };
      } catch (error) {
        this.logger.error(
          `❌ Template rendering failed for ${options.template}: ${error.message}`,
          error.stack,
        );
        throw error; // Don't continue without template - fail fast
      }
    }

    // Growth Branding: Append "Powered by" footer if enabled
    try {
      const siteSettings = await this.settingsService.getSiteSettings(tenantId);
      if (siteSettings.showPoweredBy === 'true' && enhancedOptions.html) {
        const footerHtml = `
             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
                 <p>Powered by <a href="https://affexai.com" style="color: #666; text-decoration: none; font-weight: bold;">AffeXAI</a></p>
             </div>`;

        // Insert before body close or append
        if (enhancedOptions.html.includes('</body>')) {
          enhancedOptions.html = enhancedOptions.html.replace('</body>', `${footerHtml}</body>`);
        } else {
          enhancedOptions.html += footerHtml;
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to apply branding: ${e.message}`);
    }

    // Send via adapter
    this.logger.log(`[EMAIL DEBUG] Calling adapter.sendMail...`);
    const result = await adapter.sendMail(enhancedOptions);
    this.logger.log(`[EMAIL DEBUG] Adapter response received: ${JSON.stringify(result)}`);

    // Log the result
    if (result.success) {
      this.logger.log(
        `Email sent successfully [${options.channel}]: ${result.messageId}`
      );
    } else {
      this.logger.error(
        `Email failed [${options.channel}]: ${result.error}`
      );
    }

    return result;
  }

  /**
   * Send multiple emails in bulk
   */
  async sendBulk(options: BulkSendOptions, tenantId?: string): Promise<SendMailResult[]> {
    tenantId = this.resolveTenant(tenantId);
    const { settings, revision } = await this.settingsService.getEmailSettingsSnapshot(tenantId);
    const adapter = this.getAdapter(tenantId, settings, revision);

    // Apply defaults to all emails
    const enhancedEmails = await Promise.all(
      options.emails.map((email) => this.applyChannelDefaults(email, settings))
    );

    return adapter.sendBulk({
      ...options,
      emails: enhancedEmails,
    });
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html: string): string {
    // Basic fallback since we don't have tenantId here to get specific adapter config
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Test connection to email provider
   */
  async testConnection(tenantId?: string): Promise<boolean> {
    tenantId = this.resolveTenant(tenantId);
    try {
      const { settings, revision } = await this.settingsService.getEmailSettingsSnapshot(tenantId);
      const adapter = this.getAdapter(tenantId, settings, revision);
      return await adapter.testConnection();
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Apply channel-specific defaults from settings
   */
  private async applyChannelDefaults(
    options: SendMailOptions,
    settings: any,
  ): Promise<SendMailOptions> {
    const enhanced = { ...options };

    // Apply from/replyTo based on channel
    if (!enhanced.from) {
      if (options.channel === MailChannel.MARKETING) {
        enhanced.from = {
          name: settings.marketing.fromName,
          email: settings.marketing.fromEmail,
        };
        enhanced.replyTo = enhanced.replyTo || {
          email: settings.marketing.replyToEmail,
        };
      } else {
        // Transactional, Certificate, Event, System use transactional settings
        enhanced.from = {
          name: settings.transactional.fromName,
          email: settings.transactional.fromEmail,
        };
        enhanced.replyTo = enhanced.replyTo || {
          email: settings.transactional.replyToEmail,
        };
      }
    }

    // Apply tracking settings
    if (!enhanced.tracking) {
      enhanced.tracking = {
        clickTracking: settings.tracking?.clickTracking ?? false,
        openTracking: settings.tracking?.openTracking ?? true,
      };
    }

    // For marketing emails, add List-Unsubscribe if not present
    if (
      options.channel === MailChannel.MARKETING &&
      !enhanced.unsubscribe
    ) {
      // Will be filled by specific marketing service with actual unsubscribe URL
      enhanced.unsubscribe = {
        url: undefined, // Placeholder - should be set by caller
      };
    }

    return enhanced;
  }

  /**
   * Send account creation email (Welcome Email)
   */
  async sendAccountCreated(to: string, context: { name: string; password?: string; loginUrl: string; workspaceName: string }, tenantId: string) {
    return this.sendMail({
      to: { email: to },
      subject: 'Welcome to AffeXAI - Your Account is Ready 🚀',
      template: 'account-created', // Matches template filename in mail/templates
      channel: MailChannel.TRANSACTIONAL,
      context: {
        name: context.name,
        password: context.password, // Template should handle if password is provided
        login_url: context.loginUrl,
        workspace_name: context.workspaceName,
        action_url: context.loginUrl, // Standard variable for button
      }
    }, tenantId);
  }
}
