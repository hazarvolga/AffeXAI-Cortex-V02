import { BadRequestException, Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Setting, SettingCategory, SettingScope } from './entities/setting.entity';
import { SettingAuditLog } from './entities/setting-audit-log.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SiteSettingsDto } from './dto/site-settings.dto';
import {
  EmailSettingsDto,
  EmailSettingsMaskedDto,
  EmailProvider,
} from './dto/email-settings.dto';
import {
  AiSettingsDto,
  AiSettingsMaskedDto,
  AiModel,
  AiProvider,
  AiConnectionTestDto,
} from './dto/ai-settings.dto';
import { ApiKeyDetector } from './utils/api-key-detector';
import {
  StorageSettingsDto,
  StorageSettingsMaskedDto,
  StorageProvider,
} from './dto/storage-settings.dto';
import { CommerceService } from '../commerce/services/commerce.service';
import { TenantService } from '../../core/tenant/tenant.service';
import { normalizeSecretUpdate, SecretUpdateInput } from './dto/secret-update.dto';

type ScopedSettingWrite = {
  key: string;
  value?: string;
  secret?: SecretUpdateInput;
  provider?: string;
  allowClear?: boolean;
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  private static readonly SECRET_KEY = /password|secret|apikey|accesskey/i;

  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
    private tenantService: TenantService,
    @Inject(forwardRef(() => CommerceService))
    private commerceService: CommerceService,
  ) { }

  /**
   * Helper: Get active tenant ID or current context tenant ID
   * Ensures 100% tenant isolation and fail-fast behavior
   */
  private getActiveTenantId(providedId?: string): string {
    const tenantId = providedId || this.tenantService.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is missing for Settings operation');
    }
    return tenantId;
  }

  private secretValue(input: SecretUpdateInput | undefined): string | undefined {
    if (typeof input === 'string') return input;
    return input?.operation === 'replace' ? input.value : undefined;
  }

  async create(createSettingDto: CreateSettingDto, tenantId?: string): Promise<Setting> {
    void createSettingDto;
    void tenantId;
    throw new BadRequestException('Generic setting writes are disabled; use a typed settings endpoint');
  }

  async findAll(tenantId?: string): Promise<Setting[]> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    return this.settingsRepository.find({ where: { tenantId: activeTenantId, scope: SettingScope.TENANT } });
  }

  async findOne(id: string, tenantId?: string): Promise<Setting> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const setting = await this.settingsRepository.findOne({ where: { id, tenantId: activeTenantId, scope: SettingScope.TENANT } });
    if (!setting) {
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }
    return setting;
  }

  async findByCategory(category: SettingCategory, tenantId?: string): Promise<Setting[]> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    return this.settingsRepository.find({ where: { category, tenantId: activeTenantId, scope: SettingScope.TENANT } });
  }

  async findByKeyAndCategory(key: string, category: SettingCategory, tenantId?: string): Promise<Setting | null> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    return this.settingsRepository.findOne({ where: { key, category, tenantId: activeTenantId, scope: SettingScope.TENANT } });
  }

  async update(id: string, updateSettingDto: UpdateSettingDto, tenantId?: string): Promise<Setting> {
    void id;
    void updateSettingDto;
    void tenantId;
    throw new BadRequestException('Generic setting writes are disabled; use a typed settings endpoint');
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    void id;
    void tenantId;
    throw new BadRequestException('Generic setting writes are disabled; use a typed settings endpoint');
  }

  // Site settings specific methods
  async getSiteSettings(tenantId?: string): Promise<SiteSettingsDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const settings = await this.settingsRepository.find({
      where: { tenantId: activeTenantId, scope: SettingScope.TENANT },
    });
    return this.toSiteSettings(settings);
  }

  async updateSiteSettings(settingsDto: SiteSettingsDto, tenantId: string, actorId: string): Promise<SiteSettingsDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    let reportingCycle = settingsDto.strategicRadar?.reportingCycle;
    if (reportingCycle === 'daily') {
      const hasDailyAccess = await this.commerceService.checkFeatureAccess(activeTenantId, 'radar_daily_enabled');
      if (!hasDailyAccess) {
        this.logger.warn(`Tenant ${activeTenantId} attempted to set daily reporting cycle without premium access. Falling back to weekly.`);
        reportingCycle = 'weekly';
      }
    }

    const updates = this.siteSettingEntries(settingsDto, reportingCycle);
    return this.settingsRepository.manager.transaction(async manager => {
      const repository = manager.getRepository(Setting);
      const existing = await repository.find({
        where: { tenantId: activeTenantId, scope: SettingScope.TENANT },
      });
      const byKey = new Map(existing.map(setting => [`${setting.category}.${setting.key}`, setting]));
      const persisted = [...existing];
      const changedKeys: string[] = [];

      for (const update of updates) {
        const compositeKey = `${update.category}.${update.key}`;
        const current = byKey.get(compositeKey);
        if (current?.value === update.value) continue;
        const candidate = repository.create({
          ...(current ?? {}),
          category: update.category,
          key: update.key,
          value: update.value,
          tenantId: activeTenantId,
          scope: SettingScope.TENANT,
        });
        const saved = await repository.save(candidate);
        byKey.set(compositeKey, saved);
        const index = persisted.findIndex(setting => setting.id === saved.id);
        if (index === -1) persisted.push(saved);
        else persisted[index] = saved;
        changedKeys.push(compositeKey);
      }

      if (changedKeys.length > 0) {
        const rows = await manager.query(`
          INSERT INTO setting_revisions (tenant_id, scope, revision)
          VALUES ($1, 'tenant', 1)
          ON CONFLICT (tenant_id) WHERE scope = 'tenant'
          DO UPDATE SET revision = setting_revisions.revision + 1, updated_at = now()
          RETURNING revision
        `, [activeTenantId]);
        const revision = Number(rows[0].revision);
        const auditRepository = manager.getRepository(SettingAuditLog);
        await auditRepository.save(auditRepository.create({
          tenantId: activeTenantId,
          scope: SettingScope.TENANT,
          actorId,
          action: 'site_settings.updated',
          revision,
          changedKeys,
        }));
      }

      return this.toSiteSettings(persisted);
    });
  }

  async getRevision(tenantId?: string): Promise<number> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const rows = await this.settingsRepository.manager.query(
      `SELECT revision FROM setting_revisions WHERE scope = 'tenant' AND tenant_id = $1 LIMIT 1`,
      [activeTenantId],
    );
    return rows.length > 0 ? Number(rows[0].revision) : 0;
  }

  async getEmailSettingsSnapshot(tenantId: string): Promise<{ revision: number; settings: EmailSettingsDto }> {
    return this.readConsistentTenantSnapshot(tenantId, () => this.getEmailSettings(tenantId));
  }

  async getStorageSettingsSnapshot(tenantId: string): Promise<{ revision: number; settings: StorageSettingsDto }> {
    return this.readConsistentTenantSnapshot(tenantId, () => this.getStorageSettings(tenantId));
  }

  async getAiSettingsSnapshot(tenantId: string): Promise<{ revision: number; settings: AiSettingsDto }> {
    return this.readConsistentTenantSnapshot(tenantId, () => this.getAiSettings(tenantId));
  }

  async getAiModuleConfiguration(
    module: 'emailMarketing' | 'social' | 'support' | 'analytics',
    tenantId: string,
  ): Promise<{ revision: number; apiKey: string | null; model: AiModel; provider: AiProvider }> {
    const { revision, settings } = await this.getAiSettingsSnapshot(tenantId);
    const selected = settings.useSingleApiKey && settings.global ? settings.global : settings[module];
    if (!selected?.enabled) {
      return { revision, apiKey: null, model: selected?.model ?? AiModel.GPT_4_TURBO, provider: selected?.provider ?? AiProvider.OPENAI };
    }
    return {
      revision,
      apiKey: this.secretValue(selected.apiKey) ?? null,
      model: selected.model ?? AiModel.GPT_4_TURBO,
      provider: selected.provider ?? AiProvider.OPENAI,
    };
  }

  private async readConsistentTenantSnapshot<T>(
    tenantId: string,
    readSettings: () => Promise<T>,
  ): Promise<{ revision: number; settings: T }> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const revisionBefore = await this.getRevision(activeTenantId);
      const settings = await readSettings();
      const revisionAfter = await this.getRevision(activeTenantId);
      if (revisionBefore === revisionAfter) {
        return { revision: revisionAfter, settings };
      }
    }
    throw new Error(`Settings changed while reading tenant snapshot: ${activeTenantId}`);
  }

  async getPlatformRevision(): Promise<number> {
    const rows = await this.settingsRepository.manager.query(
      `SELECT revision FROM setting_revisions WHERE scope = 'platform' LIMIT 1`,
    );
    return rows.length > 0 ? Number(rows[0].revision) : 0;
  }

  async findAllPlatform(): Promise<Setting[]> {
    return this.settingsRepository.find({
      where: { tenantId: IsNull(), scope: SettingScope.PLATFORM },
    });
  }

  async updatePlatformSetting(
    setting: CreateSettingDto,
    actorId: string | null,
  ): Promise<Setting> {
    void setting;
    void actorId;
    throw new BadRequestException('Platform setting writes are disabled until an effective consumer registry exists');
  }

  private async updateScopedSettings(
    scope: SettingScope,
    tenantId: string | null,
    category: SettingCategory,
    writes: ScopedSettingWrite[],
    actorId: string | null,
    action: string,
  ): Promise<void> {
    await this.settingsRepository.manager.transaction(async manager => {
      const repository = manager.getRepository(Setting);
      const existing = await repository.find({
        where: {
          scope,
          tenantId: scope === SettingScope.PLATFORM ? IsNull() : tenantId,
          category,
        },
      });
      const byKey = new Map(existing.map(setting => [setting.key, setting]));
      const changedKeys: string[] = [];

      for (const write of writes) {
        if (write.secret === undefined) continue;
        const operation = normalizeSecretUpdate(write.secret);
        const current = byKey.get(write.key);
        if (operation.operation === 'preserve' && !current?.value) {
          throw new BadRequestException(`${category}.${write.key} cannot be preserved because no stored credential exists`);
        }
        if (operation.operation === 'replace' && !operation.value) {
          throw new BadRequestException(`${category}.${write.key} replacement cannot be empty`);
        }
        if (operation.operation === 'clear' && !write.allowClear) {
          throw new BadRequestException(`${category}.${write.key} cannot be cleared while active`);
        }
      }

      for (const write of writes) {
        const current = byKey.get(write.key);
        const secretUpdate = write.secret === undefined ? undefined : normalizeSecretUpdate(write.secret);
        if (secretUpdate?.operation === 'preserve') continue;
        if (secretUpdate?.operation === 'clear' && (!current || (!current.value && !current.isEncrypted))) continue;
        if (!secretUpdate && current?.value === write.value) continue;
        const candidate = repository.create({
          ...(current ?? {}),
          tenantId,
          scope,
          category,
          key: write.key,
          value: secretUpdate?.operation === 'replace' ? secretUpdate.value ?? '' : write.value ?? '',
          ...(write.provider ? { provider: write.provider } : {}),
        });
        if (secretUpdate?.operation === 'replace') {
          candidate.setEncryptedValue(secretUpdate.value ?? '');
        } else if (secretUpdate?.operation === 'clear') {
          candidate.value = '';
          candidate.isEncrypted = false;
          candidate.encryptedDek = null;
          candidate.dekCreatedAt = null;
        }
        const saved = await repository.save(candidate);
        byKey.set(write.key, saved);
        changedKeys.push(`${category}.${write.key}`);
      }

      if (changedKeys.length === 0) return;
      const revisionRows = scope === SettingScope.TENANT
        ? await manager.query(`
            INSERT INTO setting_revisions (tenant_id, scope, revision)
            VALUES ($1, 'tenant', 1)
            ON CONFLICT (tenant_id) WHERE scope = 'tenant'
            DO UPDATE SET revision = setting_revisions.revision + 1, updated_at = now()
            RETURNING revision
          `, [tenantId])
        : await manager.query(`
            INSERT INTO setting_revisions (tenant_id, scope, revision)
            VALUES (NULL, 'platform', 1)
            ON CONFLICT (scope) WHERE scope = 'platform'
            DO UPDATE SET revision = setting_revisions.revision + 1, updated_at = now()
            RETURNING revision
          `);
      const auditRepository = manager.getRepository(SettingAuditLog);
      await auditRepository.save(auditRepository.create({
        tenantId,
        scope,
        actorId,
        action,
        revision: Number(revisionRows[0].revision),
        changedKeys,
      }));
    });
  }

  private siteSettingEntries(
    settings: SiteSettingsDto,
    reportingCycle?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly',
  ): Array<{ category: SettingCategory; key: string; value: string }> {
    const entries: Array<{ category: SettingCategory; key: string; value: string }> = [
      { category: SettingCategory.COMPANY, key: 'companyName', value: settings.companyName },
      { category: SettingCategory.COMPANY, key: 'domain', value: settings.domain },
      { category: SettingCategory.COMPANY, key: 'logoUrl', value: settings.logoUrl ?? '' },
      { category: SettingCategory.COMPANY, key: 'logoDarkUrl', value: settings.logoDarkUrl ?? '' },
      { category: SettingCategory.COMPANY, key: 'contact.address', value: settings.contact.address },
      { category: SettingCategory.COMPANY, key: 'contact.phone', value: settings.contact.phone },
      { category: SettingCategory.COMPANY, key: 'contact.email', value: settings.contact.email },
      { category: SettingCategory.COMPANY, key: 'seo.defaultTitle', value: settings.seo.defaultTitle },
      { category: SettingCategory.COMPANY, key: 'seo.defaultDescription', value: settings.seo.defaultDescription },
    ];
    if (settings.showPoweredBy !== undefined) {
      entries.push({ category: SettingCategory.COMPANY, key: 'showPoweredBy', value: String(settings.showPoweredBy) });
    }
    for (const key of ['facebook', 'linkedin', 'twitter', 'youtube', 'instagram', 'pinterest', 'tiktok'] as const) {
      if (settings.socialMedia[key] !== undefined) {
        entries.push({ category: SettingCategory.SOCIAL_MEDIA, key, value: settings.socialMedia[key] ?? '' });
      }
    }
    if (settings.strategicRadar?.competitors) {
      entries.push(
        { category: SettingCategory.STRATEGIC_RADAR, key: 'competitors.enabled', value: String(settings.strategicRadar.competitors.enabled) },
        { category: SettingCategory.STRATEGIC_RADAR, key: 'competitors.urls', value: JSON.stringify(settings.strategicRadar.competitors.urls) },
      );
    }
    if (settings.strategicRadar?.focusPulse) {
      entries.push(
        { category: SettingCategory.STRATEGIC_RADAR, key: 'focusPulse.enabled', value: String(settings.strategicRadar.focusPulse.enabled) },
        { category: SettingCategory.STRATEGIC_RADAR, key: 'focusPulse.keywords', value: JSON.stringify(settings.strategicRadar.focusPulse.keywords) },
      );
    }
    if (reportingCycle) {
      entries.push({ category: SettingCategory.STRATEGIC_RADAR, key: 'reportingCycle', value: reportingCycle });
    }
    return entries;
  }

  private toSiteSettings(settings: Setting[]): SiteSettingsDto {
    return {
      companyName: this.getSettingValue(settings, SettingCategory.COMPANY, 'companyName', 'XYZ Company'),
      showPoweredBy: this.getSettingValue(settings, SettingCategory.COMPANY, 'showPoweredBy', 'true'),
      domain: this.getSettingValue(settings, SettingCategory.COMPANY, 'domain', 'affexai.com'),
      logoUrl: this.getSettingValue(settings, SettingCategory.COMPANY, 'logoUrl', 'https://placehold.co/140x40/f7f7f7/1a1a1a?text=AffeXAI'),
      logoDarkUrl: this.getSettingValue(settings, SettingCategory.COMPANY, 'logoDarkUrl', 'https://placehold.co/140x40/171717/f0f0f0?text=AffeXAI'),
      contact: {
        address: this.getSettingValue(settings, SettingCategory.COMPANY, 'contact.address', ''),
        phone: this.getSettingValue(settings, SettingCategory.COMPANY, 'contact.phone', ''),
        email: this.getSettingValue(settings, SettingCategory.COMPANY, 'contact.email', 'support@affexai.com'),
      },
      socialMedia: {
        facebook: this.getSettingValue(settings, SettingCategory.SOCIAL_MEDIA, 'facebook', ''),
        linkedin: this.getSettingValue(settings, SettingCategory.SOCIAL_MEDIA, 'linkedin', ''),
        twitter: this.getSettingValue(settings, SettingCategory.SOCIAL_MEDIA, 'twitter', ''),
        youtube: this.getSettingValue(settings, SettingCategory.SOCIAL_MEDIA, 'youtube', ''),
        instagram: this.getSettingValue(settings, SettingCategory.SOCIAL_MEDIA, 'instagram', ''),
        pinterest: this.getSettingValue(settings, SettingCategory.SOCIAL_MEDIA, 'pinterest', ''),
        tiktok: this.getSettingValue(settings, SettingCategory.SOCIAL_MEDIA, 'tiktok', ''),
      },
      seo: {
        defaultTitle: this.getSettingValue(settings, SettingCategory.COMPANY, 'seo.defaultTitle', 'XYZ Company'),
        defaultDescription: this.getSettingValue(settings, SettingCategory.COMPANY, 'seo.defaultDescription', 'AI-powered business solutions.'),
      },
      strategicRadar: {
        competitors: {
          enabled: this.getSettingValue(settings, SettingCategory.STRATEGIC_RADAR, 'competitors.enabled', 'false') === 'true',
          urls: this.parseStringArray(this.getSettingValue(settings, SettingCategory.STRATEGIC_RADAR, 'competitors.urls', '[]')),
        },
        focusPulse: {
          enabled: this.getSettingValue(settings, SettingCategory.STRATEGIC_RADAR, 'focusPulse.enabled', 'false') === 'true',
          keywords: this.parseStringArray(this.getSettingValue(settings, SettingCategory.STRATEGIC_RADAR, 'focusPulse.keywords', '[]')),
        },
        reportingCycle: this.getSettingValue(settings, SettingCategory.STRATEGIC_RADAR, 'reportingCycle', 'weekly') as 'daily' | 'weekly' | 'bi-weekly' | 'monthly',
      },
    };
  }

  private parseStringArray(value: string): string[] {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string') ? [...parsed] : [];
    } catch {
      return [];
    }
  }

  // ============ EMAIL SETTINGS METHODS ============

  /**
   * Get email settings from database
   * Returns decrypted values for API keys
   */
  async getEmailSettings(tenantId?: string): Promise<EmailSettingsDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const settings = await this.findByCategory(SettingCategory.EMAIL, activeTenantId);

    const emailSettings: EmailSettingsDto = {
      provider: this.getSettingValue(settings, SettingCategory.EMAIL, 'provider', EmailProvider.RESEND) as EmailProvider,
      transactional: {
        domain: this.getSettingValue(settings, SettingCategory.EMAIL, 'transactional.domain', 'tx.xyz.example'),
        fromName: this.getSettingValue(settings, SettingCategory.EMAIL, 'transactional.fromName', 'XYZ Company'),
        fromEmail: this.getSettingValue(settings, SettingCategory.EMAIL, 'transactional.fromEmail', 'noreply@tx.xyz.example'),
        replyToEmail: this.getSettingValue(settings, SettingCategory.EMAIL, 'transactional.replyToEmail', 'support@xyz.example'),
      },
      marketing: {
        domain: this.getSettingValue(settings, SettingCategory.EMAIL, 'marketing.domain', 'news.xyz.example'),
        fromName: this.getSettingValue(settings, SettingCategory.EMAIL, 'marketing.fromName', 'XYZ Company'),
        fromEmail: this.getSettingValue(settings, SettingCategory.EMAIL, 'marketing.fromEmail', 'newsletter@news.xyz.example'),
        replyToEmail: this.getSettingValue(settings, SettingCategory.EMAIL, 'marketing.replyToEmail', 'hello@xyz.example'),
      },
      tracking: {
        clickTracking: this.getSettingValue(settings, SettingCategory.EMAIL, 'tracking.clickTracking', 'false') === 'true',
        openTracking: this.getSettingValue(settings, SettingCategory.EMAIL, 'tracking.openTracking', 'true') === 'true',
      },
      rateLimit: {
        transactional: parseInt(this.getSettingValue(settings, SettingCategory.EMAIL, 'rateLimit.transactional', '1000')),
        marketing: parseInt(this.getSettingValue(settings, SettingCategory.EMAIL, 'rateLimit.marketing', '500')),
      },
    };

    const secret = (key: string) => this.getSettingValue(settings, SettingCategory.EMAIL, key, '') || null;
    const resendApiKey = secret('resend.apiKey');
    const sendgridApiKey = secret('sendgrid.apiKey');
    const postmarkApiKey = secret('postmark.apiKey');
    const mailgunApiKey = secret('mailgun.apiKey');
    const sesAccessKey = secret('ses.accessKey');
    const sesSecretKey = secret('ses.secretKey');
    const smtpPassword = secret('smtp.password');
    if (resendApiKey) emailSettings.resend = { apiKey: resendApiKey };
    if (sendgridApiKey) emailSettings.sendgrid = { apiKey: sendgridApiKey };
    if (postmarkApiKey) emailSettings.postmark = { apiKey: postmarkApiKey };
    if (mailgunApiKey) {
      emailSettings.mailgun = {
        apiKey: mailgunApiKey,
        domain: this.getSettingValue(settings, SettingCategory.EMAIL, 'mailgun.domain', ''),
      };
    }
    if (sesAccessKey || sesSecretKey) {
      emailSettings.ses = {
        accessKey: sesAccessKey ?? '',
        secretKey: sesSecretKey ?? '',
        region: this.getSettingValue(settings, SettingCategory.EMAIL, 'ses.region', ''),
      };
    }
    if (smtpPassword || this.getSettingValue(settings, SettingCategory.EMAIL, 'smtp.host', '')) {
      emailSettings.smtp = {
        host: this.getSettingValue(settings, SettingCategory.EMAIL, 'smtp.host', ''),
        port: Number(this.getSettingValue(settings, SettingCategory.EMAIL, 'smtp.port', '587')),
        user: this.getSettingValue(settings, SettingCategory.EMAIL, 'smtp.user', ''),
        password: smtpPassword ?? '',
        secure: this.getSettingValue(settings, SettingCategory.EMAIL, 'smtp.secure', 'true') === 'true',
      };
    }

    return emailSettings;
  }

  /**
   * Get masked email settings (for frontend)
   */
  async getEmailSettingsMasked(tenantId?: string): Promise<EmailSettingsMaskedDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const settings = await this.getEmailSettings(activeTenantId);
    return EmailSettingsMaskedDto.mask(settings);
  }

  /**
   * Update email settings
   * Automatically encrypts API keys
   */
  async updateEmailSettings(settingsDto: EmailSettingsDto, tenantId: string, actorId?: string): Promise<EmailSettingsDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    this.validateEmailProviderConfiguration(settingsDto);
    const writes: ScopedSettingWrite[] = [
      { key: 'provider', value: settingsDto.provider },
      { key: 'transactional.domain', value: settingsDto.transactional.domain },
      { key: 'transactional.fromName', value: settingsDto.transactional.fromName },
      { key: 'transactional.fromEmail', value: settingsDto.transactional.fromEmail },
      { key: 'marketing.domain', value: settingsDto.marketing.domain },
      { key: 'marketing.fromName', value: settingsDto.marketing.fromName },
      { key: 'marketing.fromEmail', value: settingsDto.marketing.fromEmail },
    ];
    if (settingsDto.transactional.replyToEmail !== undefined) writes.push({ key: 'transactional.replyToEmail', value: settingsDto.transactional.replyToEmail });
    if (settingsDto.marketing.replyToEmail !== undefined) writes.push({ key: 'marketing.replyToEmail', value: settingsDto.marketing.replyToEmail });
    if (settingsDto.tracking) writes.push(
      { key: 'tracking.clickTracking', value: String(settingsDto.tracking.clickTracking ?? false) },
      { key: 'tracking.openTracking', value: String(settingsDto.tracking.openTracking ?? true) },
    );
    if (settingsDto.rateLimit) writes.push(
      { key: 'rateLimit.transactional', value: String(settingsDto.rateLimit.transactional) },
      { key: 'rateLimit.marketing', value: String(settingsDto.rateLimit.marketing) },
    );
    const emailSecret = (key: string, secret: SecretUpdateInput, provider: EmailProvider) =>
      writes.push({ key, secret, allowClear: settingsDto.provider !== provider });
    if (settingsDto.resend?.apiKey !== undefined) emailSecret('resend.apiKey', settingsDto.resend.apiKey, EmailProvider.RESEND);
    if (settingsDto.sendgrid?.apiKey !== undefined) emailSecret('sendgrid.apiKey', settingsDto.sendgrid.apiKey, EmailProvider.SENDGRID);
    if (settingsDto.postmark?.apiKey !== undefined) emailSecret('postmark.apiKey', settingsDto.postmark.apiKey, EmailProvider.POSTMARK);
    if (settingsDto.mailgun) writes.push(
      { key: 'mailgun.apiKey', secret: settingsDto.mailgun.apiKey, allowClear: settingsDto.provider !== EmailProvider.MAILGUN },
      { key: 'mailgun.domain', value: settingsDto.mailgun.domain },
    );
    if (settingsDto.ses) writes.push(
      { key: 'ses.accessKey', secret: settingsDto.ses.accessKey, allowClear: settingsDto.provider !== EmailProvider.SES },
      { key: 'ses.secretKey', secret: settingsDto.ses.secretKey, allowClear: settingsDto.provider !== EmailProvider.SES },
      { key: 'ses.region', value: settingsDto.ses.region },
    );
    if (settingsDto.smtp) writes.push(
      { key: 'smtp.host', value: settingsDto.smtp.host },
      { key: 'smtp.port', value: String(settingsDto.smtp.port) },
      { key: 'smtp.user', value: settingsDto.smtp.user },
      { key: 'smtp.password', secret: settingsDto.smtp.password, allowClear: settingsDto.provider !== EmailProvider.SMTP },
      { key: 'smtp.secure', value: String(settingsDto.smtp.secure) },
    );
    await this.updateScopedSettings(SettingScope.TENANT, activeTenantId, SettingCategory.EMAIL, writes, actorId ?? null, 'email_settings.updated');
    return this.getEmailSettings(activeTenantId);
  }

  private validateEmailProviderConfiguration(settings: EmailSettingsDto): void {
    const selected = settings[settings.provider as keyof EmailSettingsDto] as Record<string, unknown> | undefined;
    if (!selected) throw new BadRequestException(`Configuration for selected email provider ${settings.provider} is required`);
    const required: Record<EmailProvider, string[]> = {
      [EmailProvider.RESEND]: ['apiKey'],
      [EmailProvider.SENDGRID]: ['apiKey'],
      [EmailProvider.POSTMARK]: ['apiKey'],
      [EmailProvider.MAILGUN]: ['apiKey', 'domain'],
      [EmailProvider.SES]: ['accessKey', 'secretKey', 'region'],
      [EmailProvider.SMTP]: ['host', 'port', 'user', 'password'],
    };
    if (required[settings.provider].some(key => selected[key] === undefined || selected[key] === '')) {
      throw new BadRequestException(`Configuration for selected email provider ${settings.provider} is incomplete`);
    }
  }

  /**
   * Helper: Get decrypted value for a key
   */
  private async getDecryptedValue(key: string, category: SettingCategory, tenantId?: string): Promise<string | null> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const setting = await this.findByKeyAndCategory(key, category, activeTenantId);
    return setting ? setting.getDecryptedValue() : null;
  }

  /**
   * Helper: Update or create setting with automatic encryption
   */
  private async updateOrCreateSettingEncrypted(category: SettingCategory, key: string, plainValue: string, tenantId?: string, providerName?: string): Promise<void> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const existingSetting = await this.findByKeyAndCategory(key, category, activeTenantId);

    if (existingSetting) {
      // Update with encryption
      existingSetting.setEncryptedValue(plainValue);
      if (providerName) {
        existingSetting.provider = providerName;
      }
      await this.settingsRepository.save(existingSetting);
    } else {
      // Create new with encryption
      const newSetting = this.settingsRepository.create({
        category,
        key,
        value: '',
        provider: providerName || null,
        tenantId: activeTenantId,
      });
      newSetting.setEncryptedValue(plainValue);
      await this.settingsRepository.save(newSetting);
    }
  }

  private getSettingValue(settings: Setting[], category: SettingCategory, key: string, defaultValue: string): string {
    const setting = settings.find(s => s.category === category && s.key === key);
    if (!setting) return defaultValue;

    // Return decrypted value if encrypted
    return setting.isEncrypted ? setting.getDecryptedValue() : setting.value;
  }

  async updateCommerceBrandingSetting(tenantId: string, showPoweredBy: boolean): Promise<void> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    await this.updateScopedSettings(
      SettingScope.TENANT,
      activeTenantId,
      SettingCategory.COMPANY,
      [{ key: 'showPoweredBy', value: String(showPoweredBy) }],
      null,
      'commerce_branding.updated',
    );
  }

  // ============ AI SETTINGS METHODS ============

  /**
   * Get AI settings from database
   * Returns decrypted API keys
   */
  async getAiSettings(tenantId?: string): Promise<AiSettingsDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const settings = await this.findByCategory(SettingCategory.AI, activeTenantId);

    const aiSettings: AiSettingsDto = {
      useSingleApiKey: this.getSettingValue(settings, SettingCategory.AI, 'global.useSingleKey', 'false') === 'true',

      emailMarketing: {
        apiKey: this.getSettingValue(settings, SettingCategory.AI, 'emailMarketing.apiKey', '') || undefined,
        model: this.getSettingValue(settings, SettingCategory.AI, 'emailMarketing.model', AiModel.GPT_4_TURBO) as AiModel,
        enabled: this.getSettingValue(settings, SettingCategory.AI, 'emailMarketing.enabled', 'false') === 'true',
        provider: this.getSettingValue(settings, SettingCategory.AI, 'emailMarketing.provider', this.getProviderFromModel(this.getSettingValue(settings, SettingCategory.AI, 'emailMarketing.model', AiModel.GPT_4_TURBO) as AiModel)) as AiProvider,
      },

      social: {
        apiKey: this.getSettingValue(settings, SettingCategory.AI, 'social.apiKey', '') || undefined,
        model: this.getSettingValue(settings, SettingCategory.AI, 'social.model', AiModel.GPT_4_TURBO) as AiModel,
        enabled: this.getSettingValue(settings, SettingCategory.AI, 'social.enabled', 'false') === 'true',
        provider: this.getSettingValue(settings, SettingCategory.AI, 'social.provider', this.getProviderFromModel(this.getSettingValue(settings, SettingCategory.AI, 'social.model', AiModel.GPT_4_TURBO) as AiModel)) as AiProvider,
      },

      support: {
        apiKey: this.getSettingValue(settings, SettingCategory.AI, 'support.apiKey', '') || undefined,
        model: this.getSettingValue(settings, SettingCategory.AI, 'support.model', AiModel.GPT_4_TURBO) as AiModel,
        enabled: this.getSettingValue(settings, SettingCategory.AI, 'support.enabled', 'false') === 'true',
        provider: this.getSettingValue(settings, SettingCategory.AI, 'support.provider', this.getProviderFromModel(this.getSettingValue(settings, SettingCategory.AI, 'support.model', AiModel.GPT_4_TURBO) as AiModel)) as AiProvider,
      },

      analytics: {
        apiKey: this.getSettingValue(settings, SettingCategory.AI, 'analytics.apiKey', '') || undefined,
        model: this.getSettingValue(settings, SettingCategory.AI, 'analytics.model', AiModel.GPT_4_TURBO) as AiModel,
        enabled: this.getSettingValue(settings, SettingCategory.AI, 'analytics.enabled', 'false') === 'true',
        provider: this.getSettingValue(settings, SettingCategory.AI, 'analytics.provider', this.getProviderFromModel(this.getSettingValue(settings, SettingCategory.AI, 'analytics.model', AiModel.GPT_4_TURBO) as AiModel)) as AiProvider,
      },
    };

    // Add global settings if using single API key
    if (aiSettings.useSingleApiKey) {
      aiSettings.global = {
        apiKey: this.getSettingValue(settings, SettingCategory.AI, 'global.apiKey', '') || undefined,
        model: this.getSettingValue(settings, SettingCategory.AI, 'global.model', AiModel.GPT_4_TURBO) as AiModel,
        enabled: true,
        provider: this.getSettingValue(settings, SettingCategory.AI, 'global.provider', this.getProviderFromModel(this.getSettingValue(settings, SettingCategory.AI, 'global.model', AiModel.GPT_4_TURBO) as AiModel)) as AiProvider,
      };
    }

    return aiSettings;
  }

  /**
   * Get masked AI settings (for frontend)
   */
  async getAiSettingsMasked(tenantId?: string): Promise<AiSettingsMaskedDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const settings = await this.getAiSettings(activeTenantId);
    return AiSettingsMaskedDto.mask(settings);
  }

  /**
   * Update AI settings
   * Automatically encrypts API keys and detects provider from key format
   */
  async updateAiSettings(settingsDto: AiSettingsDto, tenantId: string, actorId?: string): Promise<AiSettingsDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const writes: ScopedSettingWrite[] = [
      { key: 'global.useSingleKey', value: String(settingsDto.useSingleApiKey) },
    ];
    if (settingsDto.useSingleApiKey && !settingsDto.global) {
      throw new BadRequestException('Global AI configuration is required when using a single API key');
    }
    if (settingsDto.global) {
      const globalSecret = settingsDto.global.apiKey === undefined
        ? undefined
        : normalizeSecretUpdate(settingsDto.global.apiKey);
      const detection = globalSecret?.operation === 'replace'
        ? ApiKeyDetector.detect(globalSecret.value ?? '')
        : undefined;
      const provider = settingsDto.global.provider ?? detection?.provider;
      const model = settingsDto.global.model ?? detection?.defaultModel;
      if (provider) writes.push({ key: 'global.provider', value: provider });
      if (model) {
        this.validateAiProviderModel(provider, model);
        writes.push({ key: 'global.model', value: model });
      }
      writes.push({
        key: 'global.apiKey',
        secret: settingsDto.global.apiKey ?? ({ operation: 'preserve' } as any),
        provider: 'global',
        allowClear: !settingsDto.useSingleApiKey,
      });
    }
    for (const module of ['emailMarketing', 'social', 'support', 'analytics'] as const) {
      const config = settingsDto[module];
      if (config.provider) writes.push({ key: `${module}.provider`, value: config.provider });
      if (config.model) {
        this.validateAiProviderModel(config.provider, config.model);
        writes.push({ key: `${module}.model`, value: config.model });
      }
      writes.push({ key: `${module}.enabled`, value: String(config.enabled) });
      if (config.apiKey !== undefined || (config.enabled && !settingsDto.useSingleApiKey)) {
        writes.push({
          key: `${module}.apiKey`,
          secret: config.apiKey ?? ({ operation: 'preserve' } as any),
          provider: module,
          allowClear: settingsDto.useSingleApiKey || !config.enabled,
        });
      }
    }
    await this.updateScopedSettings(SettingScope.TENANT, activeTenantId, SettingCategory.AI, writes, actorId ?? null, 'ai_settings.updated');
    return this.getAiSettings(activeTenantId);
  }

  private validateAiProviderModel(provider: AiProvider | undefined, model: AiModel): void {
    if (provider && this.getProviderFromModel(model) !== provider) {
      throw new BadRequestException(`AI model ${model} is not valid for provider ${provider}`);
    }
  }

  /**
   * Helper: Determine provider from model name
   */
  private getProviderFromModel(model: AiModel): AiProvider {
    if (model.includes('/')) {
      return AiProvider.OPENROUTER;
    }
    if (model.startsWith('gpt-')) {
      return AiProvider.OPENAI;
    }
    if (model.startsWith('claude-')) {
      return AiProvider.ANTHROPIC;
    }
    if (model.startsWith('gemini-')) {
      return AiProvider.GOOGLE;
    }
    if (model.startsWith('deepseek-')) {
      return AiProvider.DEEPSEEK;
    }
    if (['llama3.1', 'mistral', 'codellama'].includes(model)) {
      return AiProvider.LOCAL;
    }

    return AiProvider.OPENAI; // default fallback
  }

  // ============ STORAGE SETTINGS METHODS ============

  /**
   * Get storage settings from database
   * Returns decrypted secrets
   */
  async getStorageSettings(tenantId?: string): Promise<StorageSettingsDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const settings = await this.findByCategory(SettingCategory.STORAGE, activeTenantId);

    const storageSettings: StorageSettingsDto = {
      provider: this.getSettingValue(settings, SettingCategory.STORAGE, 'provider', StorageProvider.LOCAL) as StorageProvider,
      useLocalFallback: this.getSettingValue(settings, SettingCategory.STORAGE, 'useLocalFallback', 'true') === 'true',

      awsS3: {
        accessKeyId: this.getSettingValue(settings, SettingCategory.STORAGE, 'awsS3.accessKeyId', ''),
        secretAccessKey: this.getSettingValue(settings, SettingCategory.STORAGE, 'awsS3.secretAccessKey', ''),
        region: this.getSettingValue(settings, SettingCategory.STORAGE, 'awsS3.region', ''),
        bucket: this.getSettingValue(settings, SettingCategory.STORAGE, 'awsS3.bucket', ''),
        endpoint: this.getSettingValue(settings, SettingCategory.STORAGE, 'awsS3.endpoint', ''),
        publicUrl: this.getSettingValue(settings, SettingCategory.STORAGE, 'awsS3.publicUrl', ''),
      },

      cloudflareR2: {
        accountId: this.getSettingValue(settings, SettingCategory.STORAGE, 'cloudflareR2.accountId', ''),
        accessKeyId: this.getSettingValue(settings, SettingCategory.STORAGE, 'cloudflareR2.accessKeyId', ''),
        secretAccessKey: this.getSettingValue(settings, SettingCategory.STORAGE, 'cloudflareR2.secretAccessKey', ''),
        bucket: this.getSettingValue(settings, SettingCategory.STORAGE, 'cloudflareR2.bucket', ''),
        publicUrl: this.getSettingValue(settings, SettingCategory.STORAGE, 'cloudflareR2.publicUrl', ''),
      },

      digitalOceanSpaces: {
        accessKeyId: this.getSettingValue(settings, SettingCategory.STORAGE, 'digitalOceanSpaces.accessKeyId', ''),
        secretAccessKey: this.getSettingValue(settings, SettingCategory.STORAGE, 'digitalOceanSpaces.secretAccessKey', ''),
        region: this.getSettingValue(settings, SettingCategory.STORAGE, 'digitalOceanSpaces.region', ''),
        bucket: this.getSettingValue(settings, SettingCategory.STORAGE, 'digitalOceanSpaces.bucket', ''),
        endpoint: this.getSettingValue(settings, SettingCategory.STORAGE, 'digitalOceanSpaces.endpoint', ''),
        cdnUrl: this.getSettingValue(settings, SettingCategory.STORAGE, 'digitalOceanSpaces.cdnUrl', ''),
      },

      minio: {
        endPoint: this.getSettingValue(settings, SettingCategory.STORAGE, 'minio.endPoint', 'localhost'),
        port: parseInt(this.getSettingValue(settings, SettingCategory.STORAGE, 'minio.port', '9000')),
        useSSL: this.getSettingValue(settings, SettingCategory.STORAGE, 'minio.useSSL', 'false') === 'true',
        accessKey: this.getSettingValue(settings, SettingCategory.STORAGE, 'minio.accessKey', ''),
        secretKey: this.getSettingValue(settings, SettingCategory.STORAGE, 'minio.secretKey', ''),
        bucket: this.getSettingValue(settings, SettingCategory.STORAGE, 'minio.bucket', ''),
        publicUrl: this.getSettingValue(settings, SettingCategory.STORAGE, 'minio.publicUrl', ''),
      },
    };

    return storageSettings;
  }

  /**
   * Get masked storage settings (for frontend)
   */
  async getStorageSettingsMasked(tenantId?: string): Promise<StorageSettingsMaskedDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const settings = await this.getStorageSettings(activeTenantId);
    return StorageSettingsMaskedDto.mask(settings);
  }

  /**
   * Update storage settings
   */
  async updateStorageSettings(settingsDto: StorageSettingsDto, tenantId: string, actorId?: string): Promise<StorageSettingsDto> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    this.validateStorageProviderConfiguration(settingsDto);
    const writes: ScopedSettingWrite[] = [
      { key: 'provider', value: settingsDto.provider },
      { key: 'useLocalFallback', value: String(settingsDto.useLocalFallback ?? true) },
    ];
    const providerByPrefix: Record<string, StorageProvider> = {
      awsS3: StorageProvider.AWS_S3,
      cloudflareR2: StorageProvider.CLOUDFLARE_R2,
      digitalOceanSpaces: StorageProvider.DIGITAL_OCEAN_SPACES,
      minio: StorageProvider.MINIO,
    };
    const add = (prefix: string, config: object | undefined) => {
      if (!config) return;
      for (const [key, value] of Object.entries(config)) {
        if (value === undefined) continue;
        if (SettingsService.SECRET_KEY.test(key)) {
          writes.push({
            key: `${prefix}.${key}`,
            secret: value as SecretUpdateInput,
            allowClear: settingsDto.provider !== providerByPrefix[prefix],
          });
        } else {
          writes.push({ key: `${prefix}.${key}`, value: String(value) });
        }
      }
    };
    add('awsS3', settingsDto.awsS3);
    add('cloudflareR2', settingsDto.cloudflareR2);
    add('digitalOceanSpaces', settingsDto.digitalOceanSpaces);
    add('minio', settingsDto.minio);
    await this.updateScopedSettings(SettingScope.TENANT, activeTenantId, SettingCategory.STORAGE, writes, actorId ?? null, 'storage_settings.updated');
    return this.getStorageSettings(activeTenantId);
  }

  private validateStorageProviderConfiguration(settings: StorageSettingsDto): void {
    if (settings.provider === StorageProvider.LOCAL) return;
    const property: Record<Exclude<StorageProvider, StorageProvider.LOCAL>, keyof StorageSettingsDto> = {
      [StorageProvider.AWS_S3]: 'awsS3',
      [StorageProvider.CLOUDFLARE_R2]: 'cloudflareR2',
      [StorageProvider.DIGITAL_OCEAN_SPACES]: 'digitalOceanSpaces',
      [StorageProvider.MINIO]: 'minio',
    };
    const selected = settings[property[settings.provider]] as unknown as Record<string, unknown> | undefined;
    if (!selected) throw new BadRequestException(`Configuration for selected storage provider ${settings.provider} is required`);
    const required: Record<Exclude<StorageProvider, StorageProvider.LOCAL>, string[]> = {
      [StorageProvider.AWS_S3]: ['accessKeyId', 'secretAccessKey', 'region', 'bucket'],
      [StorageProvider.CLOUDFLARE_R2]: ['accountId', 'accessKeyId', 'secretAccessKey', 'bucket'],
      [StorageProvider.DIGITAL_OCEAN_SPACES]: ['accessKeyId', 'secretAccessKey', 'region', 'bucket', 'endpoint'],
      [StorageProvider.MINIO]: ['endPoint', 'port', 'accessKey', 'secretKey', 'bucket'],
    };
    if (required[settings.provider].some(key => selected[key] === undefined)) {
      throw new BadRequestException(`Configuration for selected storage provider ${settings.provider} is incomplete`);
    }
  }

  /**
   * Get system domain for email threading and webhook URLs
   * @returns Domain string (e.g., 'affexai.com', 'example.com')
   */
  async getDomain(tenantId?: string): Promise<string> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const setting = await this.findByKeyAndCategory('domain', SettingCategory.COMPANY, activeTenantId);
    return setting?.value || 'affexai.com'; // Fallback to default
  }

  /**
   * Get frontend URL for email links (verification, password reset, etc.)
   * Uses domain from site settings with https protocol
   * @returns Full frontend URL (e.g., 'https://xyz.example')
   */
  async getFrontendUrl(tenantId?: string): Promise<string> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const domain = await this.getDomain(activeTenantId);
    // Always use https in production, fallback to env variable for development
    if (process.env.NODE_ENV === 'development') {
      return process.env.FRONTEND_URL || 'http://localhost:9003';
    }
    return `https://${domain}`;
  }
}
