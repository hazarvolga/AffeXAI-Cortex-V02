import express from "express";
import request from "supertest";
import { parseTrustProxyHops, resolveTrustProxy } from "./proxy-policy";

/** The address Express reports for a request that crossed the given proxies. */
async function clientIp(
  trust: ReturnType<typeof resolveTrustProxy>,
  forwardedFor: string,
): Promise<string> {
  const app = express();
  if (trust !== false) app.set("trust proxy", trust);
  app.get("/ip", (req, res) => {
    res.json({ ip: req.ip, first: req.ips[0] ?? req.ip });
  });
  const response = await request(app)
    .get("/ip")
    .set("X-Forwarded-For", forwardedFor);
  return (response.body as { first: string }).first;
}

describe("proxy trust policy", () => {
  it("does not trust forwarded addresses unless the deployment opts in", () => {
    expect(parseTrustProxyHops(undefined)).toBe(0);
    expect(resolveTrustProxy({})).toBe(false);
  });

  it.each(["-1", "9", "all", "1.5"])(
    "rejects unsafe TRUST_PROXY_HOPS=%s",
    (value) => {
      expect(() => parseTrustProxyHops(value)).toThrow("TRUST_PROXY_HOPS");
    },
  );

  it("accepts private-range keywords and CIDRs for TRUST_PROXY_SUBNETS", () => {
    expect(
      resolveTrustProxy({ subnets: "loopback, linklocal,uniquelocal" }),
    ).toEqual(["loopback", "linklocal", "uniquelocal"]);
    expect(resolveTrustProxy({ subnets: "10.0.0.0/8,fd00::/8" })).toEqual([
      "10.0.0.0/8",
      "fd00::/8",
    ]);
  });

  it.each(["everything", "10.0.0.0/33", "0.0.0.0/0", "::/0", ""])(
    "rejects unsafe TRUST_PROXY_SUBNETS=%s",
    (value) => {
      expect(() => resolveTrustProxy({ subnets: value })).toThrow(
        "TRUST_PROXY_SUBNETS",
      );
    },
  );

  it("refuses to guess when both a hop count and subnets are configured", () => {
    expect(() =>
      resolveTrustProxy({ hops: "1", subnets: "uniquelocal" }),
    ).toThrow("either");
  });

  // Browser -> Traefik (172.18.0.2) -> Next rewrite (172.18.0.5) -> backend; the test socket is loopback.
  it("a single trusted hop collapses every client behind Traefik onto one address (the reported bug)", async () => {
    const ip = await clientIp(
      resolveTrustProxy({ hops: "1" }),
      "203.0.113.7, 172.18.0.2",
    );
    expect(ip).toBe("172.18.0.2");
  });

  it("trusting the private network finds the real client through both proxies", async () => {
    const trust = resolveTrustProxy({
      subnets: "loopback,linklocal,uniquelocal",
    });
    expect(await clientIp(trust, "203.0.113.7, 172.18.0.2")).toBe(
      "203.0.113.7",
    );
    // Direct Traefik -> backend path, one proxy fewer.
    expect(await clientIp(trust, "198.51.100.4")).toBe("198.51.100.4");
  });

  it("a client cannot spoof its address by sending its own X-Forwarded-For", async () => {
    const trust = resolveTrustProxy({
      subnets: "loopback,linklocal,uniquelocal",
    });
    // The client sent "1.2.3.4"; Traefik appended the real address it saw.
    expect(await clientIp(trust, "1.2.3.4, 203.0.113.7, 172.18.0.2")).toBe(
      "203.0.113.7",
    );
  });
});
