import { Setting, SettingCategory, SettingScope } from './entities/setting.entity';
import { EmailProvider } from './dto/email-settings.dto';
import { StorageProvider } from './dto/storage-settings.dto';
import { AiModel, AiProvider } from './dto/ai-settings.dto';
import { SettingsService } from './settings.service';

describe('SettingsService site settings integrity', () => {
  const tenantId = 'xyz-company';
  const actorId = '11111111-1111-4111-8111-111111111111';

  const siteUpdate = {
    companyName: 'XYZ Company',
    showPoweredBy: 'false',
    domain: 'xyz.example',
    logoUrl: 'https://xyz.example/logo.svg',
    logoDarkUrl: 'https://xyz.example/logo-dark.svg',
    contact: {
      address: 'Istanbul',
      phone: '+90 212 000 00 00',
      email: 'hello@xyz.example',
    },
    socialMedia: {
      facebook: 'https://facebook.com/xyz',
      linkedin: 'https://linkedin.com/company/xyz',
      twitter: 'https://x.com/xyz',
      youtube: '',
      instagram: 'https://instagram.com/xyz',
      pinterest: '',
      tiktok: 'https://tiktok.com/@xyz',
    },
    seo: {
      defaultTitle: 'XYZ Company',
      defaultDescription: 'XYZ Company services',
    },
    strategicRadar: {
      competitors: { enabled: true, urls: ['https://competitor.example'] },
      focusPulse: { enabled: true, keywords: ['automation'] },
      reportingCycle: 'daily' as const,
    },
  };

  function createHarness(existing: Setting[] = []) {
    const persisted = existing.map(setting => Object.assign(new Setting(), setting));
    const settingRepository: any = {
      create: jest.fn((input: Partial<Setting>) => Object.assign(new Setting(), input)),
      save: jest.fn(async (input: Setting) => {
        const index = persisted.findIndex(setting => setting.id === input.id);
        const saved = Object.assign(new Setting(), input, { id: input.id ?? `setting-${persisted.length + 1}` });
        if (index === -1) persisted.push(saved);
        else persisted[index] = saved;
        return saved;
      }),
      find: jest.fn(async () => persisted.filter(setting => setting.tenantId === tenantId)),
      findOne: jest.fn(async ({ where }: any) => persisted.find(setting =>
        Object.entries(where).every(([key, value]: [string, any]) =>
          value?._type === 'isNull' ? (setting as any)[key] == null : (setting as any)[key] === value)) ?? null),
      remove: jest.fn(),
    };
    const auditRepository = {
      create: jest.fn((input: unknown) => input),
      save: jest.fn(async (input: unknown) => input),
    };
    const revisionRepository = {
      create: jest.fn((input: unknown) => input),
      save: jest.fn(async (input: unknown) => input),
    };
    const manager = {
      getRepository: jest.fn((entity: Function) => {
        if (entity.name === 'Setting') return settingRepository;
        if (entity.name === 'SettingAuditLog') return auditRepository;
        if (entity.name === 'SettingRevision') return revisionRepository;
        throw new Error(`Unexpected repository ${entity.name}`);
      }),
      query: jest.fn(async () => [{ revision: '7' }]),
    };
    (settingRepository as any).manager = {
      transaction: jest.fn(async (callback: (manager: any) => unknown) => callback(manager)),
      query: manager.query,
    };
    const service = new SettingsService(
      settingRepository as any,
      { getTenantId: jest.fn(() => tenantId) } as any,
      { checkFeatureAccess: jest.fn(async () => false) } as any,
    );
    return { service, persisted, settingRepository, auditRepository, manager };
  }

  it('persists the complete typed site update atomically and returns effective values', async () => {
    const { service, persisted, settingRepository } = createHarness();

    const result = await (service.updateSiteSettings as any)(siteUpdate, tenantId, actorId);

    expect(settingRepository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(persisted).toEqual(expect.arrayContaining([
      expect.objectContaining({ tenantId, scope: SettingScope.TENANT, category: SettingCategory.SOCIAL_MEDIA, key: 'facebook', value: siteUpdate.socialMedia.facebook }),
      expect.objectContaining({ tenantId, scope: SettingScope.TENANT, category: SettingCategory.SOCIAL_MEDIA, key: 'tiktok', value: siteUpdate.socialMedia.tiktok }),
      expect.objectContaining({ tenantId, scope: SettingScope.TENANT, category: SettingCategory.STRATEGIC_RADAR, key: 'reportingCycle', value: 'weekly' }),
    ]));
    expect(result.socialMedia).toEqual(siteUpdate.socialMedia);
    expect(result.strategicRadar?.reportingCycle).toBe('weekly');
    expect(result).not.toBe(siteUpdate);
  });

  it('records only redacted changed keys, actor and monotonic revision', async () => {
    const { service, auditRepository, manager } = createHarness();

    await (service.updateSiteSettings as any)(siteUpdate, tenantId, actorId);

    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), [tenantId]);
    expect(auditRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      tenantId,
      scope: SettingScope.TENANT,
      actorId,
      revision: 7,
      action: 'site_settings.updated',
      changedKeys: expect.arrayContaining(['company.companyName', 'social_media.facebook']),
    }));
    const auditPayload = JSON.stringify(auditRepository.save.mock.calls[0][0]);
    expect(auditPayload).not.toContain(siteUpdate.contact.email);
    expect(auditPayload).not.toContain(siteUpdate.socialMedia.facebook);
  });

  it('rejects generic setting updates without mutating or persisting the loaded entity', async () => {
    const original = {
      id: 'setting-1',
      tenantId,
      scope: SettingScope.TENANT,
      category: SettingCategory.COMPANY,
      key: 'domain',
      value: 'old.example',
    } as unknown as Setting;
    const { service, settingRepository } = createHarness([original]);

    await expect(service.update(original.id, { value: 'new.example' }, tenantId)).rejects.toThrow(
      'Generic setting writes are disabled',
    );

    expect(original.value).toBe('old.example');
    expect(settingRepository.save).not.toHaveBeenCalled();
  });

  it('rejects generic secret replacement before plaintext can reach persistence', async () => {
    const original = Object.assign(new Setting(), {
      id: 'setting-secret',
      tenantId,
      scope: SettingScope.TENANT,
      category: SettingCategory.EMAIL,
      key: 'smtp.password',
      value: 'previous-ciphertext',
      isEncrypted: true,
    });
    const { service, settingRepository } = createHarness([original]);

    await expect(service.update(original.id, { value: 'replacement-secret' }, tenantId)).rejects.toThrow(
      'Generic setting writes are disabled',
    );

    expect(original.value).toBe('previous-ciphertext');
    expect(settingRepository.save).not.toHaveBeenCalled();
  });

  it('uses neutral AffeXAI/XYZ defaults rather than customer-specific branding', async () => {
    const { service } = createHarness();

    const settings = await service.getSiteSettings(tenantId);

    expect(settings.companyName).toBe('XYZ Company');
    expect(settings.domain).toBe('affexai.com');
    expect(JSON.stringify(settings)).not.toMatch(/aluplan/i);
    const email = await service.getEmailSettings(tenantId);
    expect(email.transactional.fromName).toBe('XYZ Company');
    expect(email.transactional.domain).toBe('tx.xyz.example');
    expect(JSON.stringify(email)).not.toMatch(/aluplan/i);
  });

  it.each([
    ['email', (service: SettingsService) => (service.updateEmailSettings as any)({
      provider: EmailProvider.RESEND,
      transactional: { domain: 'tx.xyz.test', fromName: 'XYZ', fromEmail: 'tx@xyz.test' },
      marketing: { domain: 'news.xyz.test', fromName: 'XYZ News', fromEmail: 'news@xyz.test' },
      tracking: { clickTracking: true, openTracking: true },
      rateLimit: { transactional: 100, marketing: 50 },
      resend: { apiKey: 're_test_secret' },
    }, tenantId, actorId)],
    ['ai', (service: SettingsService) => (service.updateAiSettings as any)({
      useSingleApiKey: false,
      emailMarketing: { enabled: true, provider: AiProvider.OPENAI, model: AiModel.GPT_4O, apiKey: 'email-ai-key' },
      social: { enabled: false, provider: AiProvider.OPENAI, model: AiModel.GPT_4O },
      support: { enabled: true, provider: AiProvider.OPENAI, model: AiModel.GPT_4O, apiKey: 'support-ai-key' },
      analytics: { enabled: false, provider: AiProvider.OPENAI, model: AiModel.GPT_4O },
    }, tenantId, actorId)],
    ['storage', (service: SettingsService) => (service.updateStorageSettings as any)({
      provider: StorageProvider.LOCAL,
      useLocalFallback: true,
    }, tenantId, actorId)],
  ] as const)('updates %s settings in one audited revision transaction', async (category, update) => {
    const { service, settingRepository, auditRepository, manager } = createHarness();

    const result = await update(service);

    expect(settingRepository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), [tenantId]);
    expect(auditRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      tenantId,
      actorId,
      revision: 7,
      action: `${category}_settings.updated`,
      changedKeys: expect.any(Array),
    }));
    expect(result).toBeDefined();
  });

  it('hydrates every configured email provider independent of the selected provider', async () => {
    const rows = [
      ['provider', EmailProvider.RESEND],
      ['postmark.apiKey', 'postmark-secret'],
      ['mailgun.apiKey', 'mailgun-secret'],
      ['mailgun.domain', 'mg.xyz.test'],
      ['ses.accessKey', 'ses-access'],
      ['ses.secretKey', 'ses-secret'],
      ['ses.region', 'eu-central-1'],
      ['smtp.host', 'smtp.xyz.test'],
      ['smtp.port', '587'],
      ['smtp.user', 'smtp-user'],
      ['smtp.password', 'smtp-secret'],
      ['smtp.secure', 'true'],
    ].map(([key, value], index) => Object.assign(new Setting(), {
      id: `email-${index}`,
      tenantId,
      scope: SettingScope.TENANT,
      category: SettingCategory.EMAIL,
      key,
      value,
      isEncrypted: false,
    }));
    const { service } = createHarness(rows);

    const settings = await service.getEmailSettings(tenantId);

    expect(settings.postmark?.apiKey).toBe('postmark-secret');
    expect(settings.mailgun).toEqual({ apiKey: 'mailgun-secret', domain: 'mg.xyz.test' });
    expect(settings.ses).toEqual({ accessKey: 'ses-access', secretKey: 'ses-secret', region: 'eu-central-1' });
    expect(settings.smtp).toEqual({ host: 'smtp.xyz.test', port: 587, user: 'smtp-user', password: 'smtp-secret', secure: true });
  });

  it('reads tenant revision and rejects platform writes without an effective consumer registry', async () => {
    const { service, persisted, manager } = createHarness();
    manager.query.mockResolvedValueOnce([{ revision: '11' }]);

    await expect((service as any).getRevision(tenantId)).resolves.toBe(11);
    await expect((service as any).updatePlatformSetting(
      { category: SettingCategory.COMPANY, key: 'maintenanceMode', value: 'true' },
      actorId,
    )).rejects.toThrow('Platform setting writes are disabled');

    expect(persisted).not.toContainEqual(expect.objectContaining({ key: 'maintenanceMode' }));
  });

  it('retries a snapshot when settings change between revision reads', async () => {
    const { service } = createHarness();
    const getRevision = jest.spyOn(service, 'getRevision')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2);
    const getAiSettings = jest.spyOn(service, 'getAiSettings')
      .mockResolvedValueOnce({
        useSingleApiKey: false,
        emailMarketing: { enabled: false, model: AiModel.GPT_4_TURBO, provider: AiProvider.OPENAI },
        social: { enabled: false, model: AiModel.GPT_4_TURBO, provider: AiProvider.OPENAI },
        support: { enabled: true, apiKey: 'old-key', model: AiModel.GPT_4_TURBO, provider: AiProvider.OPENAI },
        analytics: { enabled: false, model: AiModel.GPT_4_TURBO, provider: AiProvider.OPENAI },
      })
      .mockResolvedValueOnce({
        useSingleApiKey: false,
        emailMarketing: { enabled: false, model: AiModel.GPT_4_TURBO, provider: AiProvider.OPENAI },
        social: { enabled: false, model: AiModel.GPT_4_TURBO, provider: AiProvider.OPENAI },
        support: { enabled: true, apiKey: 'new-key', model: AiModel.GPT_4O, provider: AiProvider.OPENAI },
        analytics: { enabled: false, model: AiModel.GPT_4_TURBO, provider: AiProvider.OPENAI },
      });

    await expect(service.getAiModuleConfiguration('support', tenantId)).resolves.toEqual({
      revision: 2,
      apiKey: 'new-key',
      model: AiModel.GPT_4O,
      provider: AiProvider.OPENAI,
    });
    expect(getRevision).toHaveBeenCalledTimes(4);
    expect(getAiSettings).toHaveBeenCalledTimes(2);
  });
});
