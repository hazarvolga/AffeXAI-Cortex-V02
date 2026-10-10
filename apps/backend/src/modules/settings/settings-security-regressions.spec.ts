import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AiModel, AiProvider, AiSettingsMaskedDto } from './dto/ai-settings.dto';
import { EmailProvider, EmailSettingsMaskedDto } from './dto/email-settings.dto';
import { StorageProvider, StorageSettingsDto, StorageSettingsMaskedDto } from './dto/storage-settings.dto';
import { maskCredential, normalizeSecretUpdate } from './dto/secret-update.dto';
import { Setting, SettingCategory, SettingScope } from './entities/setting.entity';
import { SettingsService } from './settings.service';

describe('Settings security regressions', () => {
  const tenantId = 'tenant-a';
  const actorId = 'actor-a';

  function serviceHarness(existing: Setting[] = []) {
    const persisted = existing.map(setting => Object.assign(new Setting(), setting));
    const repository: any = {
      create: jest.fn((input: Partial<Setting>) => Object.assign(new Setting(), input)),
      save: jest.fn(async (input: Setting) => input),
      remove: jest.fn(async () => undefined),
      find: jest.fn(async () => persisted),
      findOne: jest.fn(async ({ where }: any) => persisted.find(row =>
        Object.entries(where).every(([key, value]) => (row as any)[key] === value)) ?? null),
    };
    const auditRepository = { create: jest.fn((value: unknown) => value), save: jest.fn(async (value: unknown) => value) };
    const manager = {
      getRepository: jest.fn((entity: Function) => entity.name === 'Setting' ? repository : auditRepository),
      query: jest.fn(async () => [{ revision: '2' }]),
    };
    repository.manager = {
      transaction: jest.fn(async (callback: (transactionManager: typeof manager) => unknown) => callback(manager)),
      query: manager.query,
    };
    const service = new SettingsService(
      repository,
      { getTenantId: () => tenantId } as any,
      {} as any,
    );
    return { service, repository, auditRepository, manager };
  }

  it.each(['a', 'ab', 'abc', 'abcd'])('never discloses a short AI secret (%s)', secret => {
    const masked = AiSettingsMaskedDto.mask({
      useSingleApiKey: false,
      emailMarketing: { enabled: true, provider: AiProvider.OPENAI, model: AiModel.GPT_4O, apiKey: secret },
      social: { enabled: false },
      support: { enabled: false },
      analytics: { enabled: false },
    });
    expect(masked.emailMarketing.apiKey).toBe('***');
  });

  it('treats only the exact mask sentinel as preserve and rotates credentials beginning with it', () => {
    expect(maskCredential('credential-ending-1234')).toBe('***');
    expect(normalizeSecretUpdate('***')).toEqual({ operation: 'preserve' });
    expect(normalizeSecretUpdate('***rotated-credential')).toEqual({
      operation: 'replace',
      value: '***rotated-credential',
    });
  });

  it('defaults every AI consumer to disabled until the tenant configures credentials', async () => {
    const { service } = serviceHarness();
    const settings = await service.getAiSettings(tenantId);

    expect(settings.emailMarketing.enabled).toBe(false);
    expect(settings.social.enabled).toBe(false);
    expect(settings.support.enabled).toBe(false);
    expect(settings.analytics.enabled).toBe(false);
  });

  it.each(['a', 'ab', 'abc', 'abcd'])('never discloses a short email or storage credential (%s)', secret => {
    const email = EmailSettingsMaskedDto.mask({
      provider: EmailProvider.RESEND,
      transactional: { domain: 'tx.example.test', fromName: 'Test', fromEmail: 'tx@example.test' },
      marketing: { domain: 'news.example.test', fromName: 'Test', fromEmail: 'news@example.test' },
      resend: { apiKey: secret },
    });
    const storage = StorageSettingsMaskedDto.mask({
      provider: StorageProvider.AWS_S3,
      useLocalFallback: true,
      awsS3: { accessKeyId: secret, secretAccessKey: secret, region: 'eu-central-1', bucket: 'valid-bucket' },
    });
    expect(email.resend?.apiKey).toBe('***');
    expect(storage.awsS3?.accessKeyId).toBe('***');
    expect(JSON.stringify({ email, storage })).not.toContain(secret === 'a' ? '"a"' : secret);
  });

  it('closes all generic setting writes before persistence', async () => {
    const row = Object.assign(new Setting(), {
      id: 'setting-1', tenantId, scope: SettingScope.TENANT,
      category: SettingCategory.COMPANY, key: 'domain', value: 'old.example',
    });
    const { service, repository } = serviceHarness([row]);
    await expect(service.create({ category: SettingCategory.COMPANY, key: 'domain', value: 'new.example' }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.update(row.id, { value: 'new.example' }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.remove(row.id, tenantId)).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('rejects every platform PUT while there is no effective platform consumer registry', async () => {
    const { service, repository } = serviceHarness();
    await expect(service.updatePlatformSetting(
      { category: SettingCategory.COMPANY, key: 'maintenanceMode', value: 'true' },
      actorId,
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('validates concrete nested storage provider payloads', async () => {
    const payload = plainToInstance(StorageSettingsDto, {
      provider: StorageProvider.MINIO,
      useLocalFallback: true,
      minio: {
        endPoint: 'ftp://invalid.example.test',
        port: '9000',
        useSSL: 'yes',
        accessKey: '',
        secretKey: 'secret',
        bucket: 'INVALID_BUCKET',
      },
    });
    const errors = await validate(payload, { whitelist: true, forbidNonWhitelisted: true });
    expect(JSON.stringify(errors)).toMatch(/minio/);
    expect(JSON.stringify(errors)).toMatch(/port|useSSL|accessKey|bucket|endPoint/);
  });

  it('requires TLS for tenant endpoints and a canonical Cloudflare account id', async () => {
    const minio = plainToInstance(StorageSettingsDto, {
      provider: StorageProvider.MINIO,
      useLocalFallback: false,
      minio: {
        endPoint: 'http://storage.example.test', port: 9000, useSSL: false,
        accessKey: 'access', secretKey: 'secret', bucket: 'valid-bucket',
      },
    });
    const r2 = plainToInstance(StorageSettingsDto, {
      provider: StorageProvider.CLOUDFLARE_R2,
      useLocalFallback: false,
      cloudflareR2: {
        accountId: 'evil.example/path', accessKeyId: 'access',
        secretAccessKey: 'secret', bucket: 'valid-bucket',
      },
    });

    expect(JSON.stringify(await validate(minio))).toMatch(/endPoint/);
    expect(JSON.stringify(await validate(r2))).toMatch(/accountId/);
  });

  it('preserves a masked storage secret without changing ciphertext, revision or audit', async () => {
    const rows = [
      ['provider', StorageProvider.AWS_S3], ['useLocalFallback', 'true'],
      ['awsS3.accessKeyId', 'access-id'], ['awsS3.secretAccessKey', 'existing-ciphertext'],
      ['awsS3.region', 'eu-central-1'], ['awsS3.bucket', 'valid-bucket'],
    ].map(([key, value], index) => Object.assign(new Setting(), {
      id: `setting-${index}`, tenantId, scope: SettingScope.TENANT,
      category: SettingCategory.STORAGE, key, value,
      isEncrypted: key === 'awsS3.secretAccessKey',
    }));
    const { service, repository, manager, auditRepository } = serviceHarness(rows);
    jest.spyOn(service, 'getStorageSettings').mockResolvedValue({} as any);

    await service.updateStorageSettings({
      provider: StorageProvider.AWS_S3,
      useLocalFallback: true,
      awsS3: {
        accessKeyId: '***',
        secretAccessKey: { operation: 'preserve' } as any,
        region: 'eu-central-1',
        bucket: 'valid-bucket',
      },
    }, tenantId, actorId);

    expect(rows[3].value).toBe('existing-ciphertext');
    expect(repository.save).not.toHaveBeenCalled();
    expect(manager.query).not.toHaveBeenCalled();
    expect(auditRepository.save).not.toHaveBeenCalled();
  });

  it('supports explicit literal-mask replacement and clear operations', async () => {
    const existing = Object.assign(new Setting(), {
      id: 'secret', tenantId, scope: SettingScope.TENANT,
      category: SettingCategory.STORAGE, key: 'awsS3.secretAccessKey',
      value: 'existing-ciphertext', isEncrypted: true,
    });
    const { service, repository } = serviceHarness([existing]);
    await (service as any).updateScopedSettings(
      SettingScope.TENANT, tenantId, SettingCategory.STORAGE,
      [{ key: 'awsS3.secretAccessKey', secret: { operation: 'replace', value: '***' } }],
      actorId, 'storage_settings.updated',
    );
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ isEncrypted: true }));
    const replaced = repository.save.mock.calls[0][0] as Setting;
    expect(replaced.value).not.toBe('existing-ciphertext');

    repository.save.mockClear();
    await (service as any).updateScopedSettings(
      SettingScope.TENANT, tenantId, SettingCategory.STORAGE,
      [{ key: 'awsS3.secretAccessKey', secret: { operation: 'clear' }, allowClear: true }],
      actorId, 'storage_settings.updated',
    );
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ value: '', isEncrypted: false }));
  });

  it('keeps storage secret placeholders in masked GET payloads for safe round trips', () => {
    const masked = StorageSettingsMaskedDto.mask({
      provider: StorageProvider.AWS_S3,
      useLocalFallback: true,
      awsS3: { accessKeyId: 'long-access-id', secretAccessKey: 'stored-secret', region: 'eu-central-1', bucket: 'valid-bucket' },
    });
    expect(masked.awsS3).toEqual(expect.objectContaining({ secretAccessKey: '***' }));
  });

  it.each([
    [StorageProvider.LOCAL, undefined],
    [StorageProvider.AWS_S3, 'awsS3'],
    [StorageProvider.CLOUDFLARE_R2, 'cloudflareR2'],
    [StorageProvider.DIGITAL_OCEAN_SPACES, 'digitalOceanSpaces'],
    [StorageProvider.MINIO, 'minio'],
  ] as const)('returns only the active %s storage payload for safe GET to PUT round trips', (provider, activeKey) => {
    const masked = StorageSettingsMaskedDto.mask({
      provider,
      useLocalFallback: true,
      awsS3: { accessKeyId: 'aws-access', secretAccessKey: 'aws-secret', region: 'eu-central-1', bucket: 'aws-bucket', endpoint: 'https://s3.example.test' },
      cloudflareR2: { accountId: 'a'.repeat(32), accessKeyId: 'r2-access', secretAccessKey: 'r2-secret', bucket: 'r2-bucket', publicUrl: 'https://r2.example.test' },
      digitalOceanSpaces: { accessKeyId: 'spaces-access', secretAccessKey: 'spaces-secret', region: 'fra1', bucket: 'spaces-bucket', endpoint: 'https://fra1.digitaloceanspaces.com' },
      minio: { endPoint: 'https://minio.example.test', port: 9000, useSSL: true, accessKey: 'minio-access', secretKey: 'minio-secret', bucket: 'minio-bucket' },
    });

    const presentProviderKeys = ['awsS3', 'cloudflareR2', 'digitalOceanSpaces', 'minio']
      .filter(key => Object.prototype.hasOwnProperty.call(masked, key));
    expect(presentProviderKeys).toEqual(activeKey ? [activeKey] : []);
  });

  it('rejects preserve without an existing credential and empty replacement for an active storage provider', async () => {
    const { service, repository } = serviceHarness();
    jest.spyOn(service, 'getStorageSettings').mockResolvedValue({} as any);
    const base = {
      provider: StorageProvider.AWS_S3,
      useLocalFallback: true,
      awsS3: { accessKeyId: 'access-id', region: 'eu-central-1', bucket: 'valid-bucket' },
    };
    await expect(service.updateStorageSettings({
      ...base,
      awsS3: { ...base.awsS3, secretAccessKey: { operation: 'preserve' } as any },
    }, tenantId, actorId)).rejects.toThrow('cannot be preserved');
    await expect(service.updateStorageSettings({
      ...base,
      awsS3: { ...base.awsS3, secretAccessKey: { operation: 'replace', value: '' } as any },
    }, tenantId, actorId)).rejects.toThrow('replacement cannot be empty');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows clearing a storage credential only while switching away from that provider', async () => {
    const secret = Object.assign(new Setting(), {
      id: 'secret', tenantId, scope: SettingScope.TENANT, category: SettingCategory.STORAGE,
      key: 'awsS3.secretAccessKey', value: 'ciphertext', isEncrypted: true,
    });
    const { service, repository } = serviceHarness([secret]);
    jest.spyOn(service, 'getStorageSettings').mockResolvedValue({} as any);
    const aws = { accessKeyId: 'access-id', secretAccessKey: { operation: 'clear' } as any, region: 'eu-central-1', bucket: 'valid-bucket' };
    await expect(service.updateStorageSettings({ provider: StorageProvider.AWS_S3, useLocalFallback: true, awsS3: aws }, tenantId, actorId)).rejects.toThrow('cannot be cleared while active');
    await expect(service.updateStorageSettings({ provider: StorageProvider.LOCAL, useLocalFallback: true, awsS3: aws }, tenantId, actorId)).resolves.toBeDefined();
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ key: 'awsS3.secretAccessKey', value: '' }));
  });

  it('enforces resulting email and AI credentials for active configurations', async () => {
    const { service, repository } = serviceHarness();
    jest.spyOn(service, 'getEmailSettings').mockResolvedValue({} as any);
    jest.spyOn(service, 'getAiSettings').mockResolvedValue({} as any);
    const email = {
      provider: EmailProvider.RESEND,
      transactional: { domain: 'tx.example.test', fromName: 'Test', fromEmail: 'tx@example.test' },
      marketing: { domain: 'news.example.test', fromName: 'Test', fromEmail: 'news@example.test' },
      resend: { apiKey: { operation: 'preserve' } as any },
    };
    await expect(service.updateEmailSettings(email, tenantId, actorId)).rejects.toThrow('cannot be preserved');
    const ai = {
      useSingleApiKey: true,
      global: { enabled: true, provider: AiProvider.OPENAI, model: AiModel.GPT_4O, apiKey: { operation: 'clear' } as any },
      emailMarketing: { enabled: false }, social: { enabled: false }, support: { enabled: false }, analytics: { enabled: false },
    };
    await expect(service.updateAiSettings(ai, tenantId, actorId)).rejects.toThrow('cannot be cleared while active');
    expect(repository.save).not.toHaveBeenCalled();
  });
});
