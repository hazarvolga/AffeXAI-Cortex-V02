import { parseTrustProxyHops } from './proxy-policy';

describe('proxy trust policy', () => {
  it('does not trust forwarded addresses unless the deployment opts in', () => {
    expect(parseTrustProxyHops(undefined, true)).toBe(0);
    expect(parseTrustProxyHops(undefined, false)).toBe(0);
  });

  it.each(['-1', '9', 'all', '1.5'])('rejects unsafe TRUST_PROXY_HOPS=%s', (value) => {
    expect(() => parseTrustProxyHops(value, true)).toThrow('TRUST_PROXY_HOPS');
  });
});
