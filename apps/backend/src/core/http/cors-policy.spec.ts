import { API_ALLOWED_HEADERS, isAllowedOrigin } from './cors-policy';
describe('CORS origin boundary', () => {
  it('allows the required public-form idempotency header', () => {
    expect(API_ALLOWED_HEADERS).toContain('Idempotency-Key');
  });
  it('allows exact configured origins and requests without browser origin', () => {
    expect(isAllowedOrigin(undefined, ['https://tenant.example'], 'production')).toBe(true);
    expect(isAllowedOrigin('https://tenant.example', ['https://tenant.example'], 'production')).toBe(true);
  });
  it.each(['https://localhost.attacker.example','https://127.0.0.1.attacker.example','null','not a URL','https://attacker.example'])('rejects deceptive or untrusted dev origin %s', origin => {
    expect(isAllowedOrigin(origin, [], 'development')).toBe(false);
  });
  it('allows local development only for real loopback hostnames', () => {
    expect(isAllowedOrigin('http://localhost:9003', [], 'development')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:9003', [], 'development')).toBe(true);
    expect(isAllowedOrigin('http://[::1]:9003', [], 'development')).toBe(true);
    expect(isAllowedOrigin('http://localhost:9003', [], 'production')).toBe(false);
  });
});
