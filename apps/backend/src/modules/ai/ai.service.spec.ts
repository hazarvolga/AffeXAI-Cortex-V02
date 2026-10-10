import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AiProvider } from '../settings/dto/ai-settings.dto';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('isolates cached clients by tenant and evicts an older tenant revision without storing raw keys', () => {
    const tenantARevision1 = {
      tenantId: 'tenant-a',
      module: 'support' as const,
      provider: AiProvider.OPENAI,
      revision: 1,
    };
    const tenantBRevision1 = { ...tenantARevision1, tenantId: 'tenant-b' };
    const tenantARevision2 = { ...tenantARevision1, revision: 2 };

    const tenantAOldClient = (service as any).getOpenAiClient('secret-a-v1', tenantARevision1);
    const tenantBClient = (service as any).getOpenAiClient('secret-b-v1', tenantBRevision1);
    const tenantANewClient = (service as any).getOpenAiClient('secret-a-v2', tenantARevision2);
    const cache = (service as any).openaiClients as Map<string, unknown>;

    expect(tenantANewClient).not.toBe(tenantAOldClient);
    expect(tenantBClient).toBe((service as any).getOpenAiClient('secret-b-v1', tenantBRevision1));
    expect([...cache.keys()]).toEqual(expect.arrayContaining([
      'tenant-a:support:openai:2',
      'tenant-b:support:openai:1',
    ]));
    expect([...cache.keys()]).not.toContain('tenant-a:support:openai:1');
    expect([...cache.keys()].join('|')).not.toMatch(/secret-[ab]/);
  });

  it('does not let a late older revision evict or enter the cache', () => {
    const latest = {
      tenantId: 'tenant-a',
      module: 'support' as const,
      provider: AiProvider.OPENAI,
      revision: 2,
    };
    const stale = { ...latest, revision: 1 };
    const latestClient = (service as any).getOpenAiClient('secret-v2', latest);

    const staleClient = (service as any).getOpenAiClient('secret-v1', stale);
    const cache = (service as any).openaiClients as Map<string, unknown>;

    expect(staleClient).not.toBe(latestClient);
    expect(cache.get('tenant-a:support:openai:2')).toBe(latestClient);
    expect(cache.has('tenant-a:support:openai:1')).toBe(false);

    service.clearClientCache('tenant-a');
    (service as any).getOpenAiClient('secret-v1', stale);
    expect(cache.has('tenant-a:support:openai:1')).toBe(false);
  });
});
