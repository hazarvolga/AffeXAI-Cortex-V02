import { createHmac, createHash } from 'crypto';
import { of } from 'rxjs';
import { signCortexRequest, postToCortex } from './signed-request';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

const secret = 'isolated-cortex-service-secret-at-least-32-chars';

describe('Cortex service transport boundary', () => {
  it('signs the exact serialized body, method, path, timestamp, nonce and tenant', () => {
    const payload = { tenantId: 'tenant-a', query: 'context', limit: 3 };
    const signed = signCortexRequest(secret, '/retrieve', payload, 1800000000, 'fixed-test-nonce-1234');
    const canonical = ['v1', 'POST', '/retrieve', 'tenant-a', '1800000000', 'fixed-test-nonce-1234', createHash('sha256').update(JSON.stringify(payload)).digest('hex')].join('\n');
    expect(signed.body).toBe(JSON.stringify(payload));
    expect(signed.headers['x-cortex-signature']).toBe('491c199a1ffbc8194ff2f2706628c5425163845eddee8039327ffe844452105b');
    expect(signed.headers['x-cortex-signature']).toBe(createHmac('sha256', secret).update(canonical).digest('hex'));
    expect(signed.headers['x-cortex-tenant']).toBe('tenant-a');
  });

  it.each(['', 'short'])('does not sign with missing/weak service secret', value => {
    expect(() => signCortexRequest(value, '/retrieve', { tenantId: 'tenant-a' })).toThrow();
  });

  it('rejects malformed tenants and excessive payloads before transport', () => {
    expect(() => signCortexRequest(secret, '/retrieve', { tenantId: 'tenant-a,tenant-b' })).toThrow();
    expect(() => signCortexRequest(secret, '/retrieve', { tenantId: 'tenant-a', query: 'x'.repeat(70000) })).toThrow();
  });

  it('transports the unchanged signed bytes with a bounded timeout', async () => {
    const post = jest.fn().mockReturnValue(of({ data: { results: [] } }));
    const config = { get: (key: string) => key === 'cortex.serviceSecret' ? secret : 'http://cortex:8000' };
    await expect(postToCortex({ post } as unknown as HttpService, config as ConfigService, '/retrieve', { tenantId: 'tenant-a', query: 'context' })).resolves.toEqual({ results: [] });
    const [url, body, options] = post.mock.calls[0];
    expect(url).toBe('http://cortex:8000/retrieve');
    expect(typeof body).toBe('string');
    expect(options.timeout).toBe(5000);
    expect(options.transformRequest[0](body)).toBe(body);
    expect(options.headers['x-cortex-signature']).toHaveLength(64);
  });
});
