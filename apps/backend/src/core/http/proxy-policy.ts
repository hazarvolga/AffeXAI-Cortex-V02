import { isIP } from "node:net";

const SUBNET_KEYWORDS: ReadonlySet<string> = new Set([
  "loopback",
  "linklocal",
  "uniquelocal",
]);

export function parseTrustProxyHops(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return 0;
  if (!/^\d+$/.test(value))
    throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 8");
  const hops = Number(value);
  if (!Number.isSafeInteger(hops) || hops < 0 || hops > 8) {
    throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 8");
  }
  return hops;
}

/** A keyword, an address or a CIDR narrower than "everything". */
function isSafeSubnet(entry: string): boolean {
  if (SUBNET_KEYWORDS.has(entry)) return true;
  const [address, prefix, ...rest] = entry.split("/");
  const family = isIP(address);
  if (!family || rest.length > 0) return false;
  if (prefix === undefined) return true;
  if (!/^\d+$/.test(prefix)) return false;
  const bits = Number(prefix);
  const max = family === 4 ? 32 : 128;
  return bits >= 1 && bits <= max;
}

export function parseTrustProxySubnets(value: string): string[] {
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (entries.length === 0 || !entries.every(isSafeSubnet)) {
    throw new Error(
      "TRUST_PROXY_SUBNETS must list loopback, linklocal, uniquelocal or IP/CIDR ranges narrower than /0",
    );
  }
  return entries;
}

/**
 * Express "trust proxy" setting. Prefer TRUST_PROXY_SUBNETS: trusting the
 * private network the proxies live on makes req.ip the first public address in
 * X-Forwarded-For whatever the number of hops (Traefik alone, or Traefik then
 * the Next.js rewrite). A hop count is only right for one fixed topology.
 */
export function resolveTrustProxy(config: {
  hops?: string;
  subnets?: string;
}): number | string[] | false {
  const hasSubnets = config.subnets !== undefined;
  const hops = parseTrustProxyHops(config.hops);
  if (hasSubnets && hops > 0) {
    throw new Error(
      "Configure either TRUST_PROXY_HOPS or TRUST_PROXY_SUBNETS, not both",
    );
  }
  if (hasSubnets) return parseTrustProxySubnets(config.subnets ?? "");
  return hops > 0 ? hops : false;
}
