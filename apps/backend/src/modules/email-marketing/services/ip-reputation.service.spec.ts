import * as dns from "dns";

jest.mock("dns", () => ({ ...jest.requireActual("dns"), resolve4: jest.fn() }));
import { CacheService } from "../../../core/shared/services/cache.service";
import { TenantService } from "../../../core/tenant/tenant.service";
import { IpReputationService } from "./ip-reputation.service";

type Answer = { error?: string; addresses?: string[] };

// Answers per DNSBL host; hosts without an entry answer NXDOMAIN (not listed).
function stubDns(
  answers: Record<string, Answer> = {},
  fallback: Answer = { error: "ENOTFOUND" },
) {
  const resolve4 = dns.resolve4 as unknown as jest.Mock;
  resolve4.mockReset();
  return resolve4.mockImplementation(((
    query: string,
    callback: (err: NodeJS.ErrnoException | null, addresses: string[]) => void,
  ) => {
    const host = Object.keys(answers).find((name) => query.endsWith(name));
    const answer = host ? answers[host] : fallback;
    if (answer.error) {
      callback(
        Object.assign(new Error(answer.error), { code: answer.error }),
        [],
      );
    } else {
      callback(null, answer.addresses ?? []);
    }
  }) as never);
}

function setup() {
  const cache = {
    get: jest.fn(async () => undefined),
    set: jest.fn(async () => undefined),
  };
  const service = new IpReputationService(
    cache as unknown as CacheService,
    { getTenantId: () => "tenant-a" } as unknown as TenantService,
  );
  return { service, cache };
}

describe("IpReputationService", () => {
  afterEach(() => jest.restoreAllMocks());

  it("reports a clean IP when the lists answer NXDOMAIN", async () => {
    const lookups = stubDns();
    const { service, cache } = setup();
    const result = await service.checkIpReputation("192.0.2.10");
    expect(lookups).toHaveBeenCalledWith(
      "10.2.0.192.zen.spamhaus.org",
      expect.any(Function),
    );
    expect(result).toMatchObject({
      reputation: "clean",
      isListed: false,
      details: "IP not listed on the 8 blacklists that answered",
    });
    expect(cache.set).toHaveBeenCalledWith(
      "tenant-a_ip_reputation_192.0.2.10",
      expect.objectContaining({ reputation: "clean" }),
      86400,
    );
  });

  it("reports listings from 127.0.0.x answers", async () => {
    stubDns({
      "zen.spamhaus.org": { addresses: ["127.0.0.2"] },
      "bl.spamcop.net": { addresses: ["127.0.0.2"] },
    });
    const result = await setup().service.checkIpReputation("192.0.2.10");
    expect(result).toMatchObject({
      reputation: "listed",
      isListed: true,
      listedOn: ["zen.spamhaus.org", "bl.spamcop.net"],
      confidence: 25,
    });
  });

  it("does not count a Spamhaus refusal code as a listing", async () => {
    stubDns({ "zen.spamhaus.org": { addresses: ["127.255.255.254"] } });
    const result = await setup().service.checkIpReputation("192.0.2.10");
    expect(result.reputation).toBe("clean");
    expect(result.listedOn).toEqual([]);
    expect(result.errors).toEqual([
      expect.stringContaining("zen.spamhaus.org: DNSBL refused the query"),
    ]);
  });

  it("says unknown and caches nothing when no list can be reached", async () => {
    stubDns({}, { error: "ECONNREFUSED" });
    const { service, cache } = setup();
    const result = await service.checkIpReputation("192.0.2.10");
    expect(result).toMatchObject({
      reputation: "unknown",
      isListed: false,
      details: "No blacklist could be queried",
    });
    expect(result.errors).toHaveLength(8);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it("rejects malformed addresses without querying", async () => {
    const lookups = stubDns();
    await expect(
      setup().service.checkIpReputation("300.1.1.1"),
    ).resolves.toMatchObject({
      reputation: "unknown",
      details: "Invalid IP address format",
    });
    expect(lookups).not.toHaveBeenCalled();
  });

  it("returns a cached result without DNS traffic", async () => {
    const lookups = stubDns();
    const { service, cache } = setup();
    cache.get.mockResolvedValueOnce({
      ip: "192.0.2.10",
      reputation: "clean",
    } as never);
    await expect(
      service.checkIpReputation("192.0.2.10"),
    ).resolves.toMatchObject({ reputation: "clean" });
    expect(lookups).not.toHaveBeenCalled();
  });

  it("flags temporary mail domains", async () => {
    const { service } = setup();
    await expect(
      service.checkDomainReputation("mailinator.com"),
    ).resolves.toMatchObject({ isSuspicious: true, reputation: "poor" });
    await expect(
      service.checkDomainReputation("example.com"),
    ).resolves.toMatchObject({ isSuspicious: false, reputation: "good" });
  });
});
