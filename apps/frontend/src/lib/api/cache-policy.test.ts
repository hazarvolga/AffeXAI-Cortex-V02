import nextConfig from '../../../next.config';

describe('API response cache policy', () => {
  it('prevents shared caching of authenticated API and survey responses', async () => {
    const rules = await nextConfig.headers!();
    const api = rules.find(rule => rule.source === '/api/:path*');
    const cache = api?.headers.find(header => header.key.toLowerCase() === 'cache-control')?.value;
    expect(cache).toContain('private');
    expect(cache).toContain('no-store');
    expect(cache).not.toContain('public');
  });
});
