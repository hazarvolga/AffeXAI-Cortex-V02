export function parseTrustProxyHops(value: string | undefined, _production: boolean): number {
  if (value === undefined || value.trim() === '') return 0;
  if (!/^\d+$/.test(value)) throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 8');
  const hops = Number(value);
  if (!Number.isSafeInteger(hops) || hops < 0 || hops > 8) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 8');
  }
  return hops;
}
