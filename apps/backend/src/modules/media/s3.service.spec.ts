import { lookup } from 'node:dns/promises';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service';
import { StorageProvider } from '../settings/dto/storage-settings.dto';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

jest.mock('@aws-sdk/client-s3', () => {
  class Command {
    constructor(public readonly input: unknown) {}
  }
  return {
    S3Client: jest.fn().mockImplementation((config) => ({
      config: {
        ...config,
        requestHandler: { updateHttpClientConfig: jest.fn() },
        endpoint: async () => new URL(config.endpoint),
      },
      send: jest.fn(async () => ({ Body: { transformToByteArray: async () => [1] } })),
    })),
    PutObjectCommand: Command,
    DeleteObjectCommand: Command,
    GetObjectCommand: Command,
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(async () => 'https://signed.example/object'),
}));

describe('S3Service tenant storage boundaries', () => {
  const publicDns = lookup as jest.MockedFunction<typeof lookup>;

  beforeEach(() => {
    jest.clearAllMocks();
    publicDns.mockResolvedValue([{ address: '8.8.8.8', family: 4 }] as any);
  });

  function serviceWith(settings: any) {
    return new S3Service(
      { get: jest.fn() } as any,
      { getStorageSettingsSnapshot: jest.fn(async () => ({ revision: 1, settings })) } as any,
    );
  }

  it.each(['deleteFile', 'getSignedUrl', 'getFileBuffer'] as const)(
    'rejects a tenant-b object key from tenant-a in %s',
    async (method) => {
      const service = serviceWith({ provider: StorageProvider.LOCAL, useLocalFallback: true });
      await expect((service[method] as any)('tenant-b/private.txt', 'tenant-a')).rejects.toThrow(/tenant/i);
    },
  );

  it('normalizes traversal before enforcing the tenant prefix', async () => {
    const service = serviceWith({ provider: StorageProvider.LOCAL, useLocalFallback: true });
    await expect(service.deleteFile('tenant-a/../tenant-b/private.txt', 'tenant-a')).rejects.toThrow(/tenant/i);
  });

  it('uses the MinIO URL protocol and host once and adds only a missing configured port', async () => {
    const service = serviceWith({
      provider: StorageProvider.MINIO,
      useLocalFallback: false,
      minio: {
        endPoint: 'https://storage.example.com',
        port: 9443,
        useSSL: true,
        accessKey: 'access',
        secretKey: 'secret',
        bucket: 'files',
      },
    });

    const resolved = await (service as any).getClient('tenant-a');

    expect(S3Client).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'https://storage.example.com:9443/',
      followRegionRedirects: false,
    }));
    expect(resolved.client.config.requestHandler.updateHttpClientConfig).toHaveBeenCalledTimes(2);
  });

  it('rejects a legacy cleartext tenant endpoint even when it bypassed current DTO validation', async () => {
    const service = serviceWith({ provider: StorageProvider.LOCAL, useLocalFallback: true });
    await expect((service as any).createTenantClient({
      endpoint: 'http://storage.example.com:9000',
    })).rejects.toThrow('Invalid tenant storage endpoint');
    expect(publicDns).not.toHaveBeenCalled();
  });

  it.each([
    [StorageProvider.AWS_S3, { awsS3: { endpoint: 'https://internal.example', region: 'eu-1', accessKeyId: 'a', secretAccessKey: 's', bucket: 'files' } }],
    [StorageProvider.DIGITAL_OCEAN_SPACES, { digitalOceanSpaces: { endpoint: 'https://internal.example', region: 'eu-1', accessKeyId: 'a', secretAccessKey: 's', bucket: 'files' } }],
    [StorageProvider.MINIO, { minio: { endPoint: 'https://internal.example', port: 443, useSSL: true, accessKey: 'a', secretKey: 's', bucket: 'files' } }],
  ])('rejects %s endpoints resolving to private addresses', async (provider, providerSettings) => {
    publicDns.mockResolvedValue([{ address: '127.0.0.1', family: 4 }] as any);
    const service = serviceWith({ provider, useLocalFallback: false, ...providerSettings });

    await expect((service as any).getClient('tenant-a')).rejects.toThrow(/private|reserved/i);
    expect(S3Client).not.toHaveBeenCalled();
  });
});
