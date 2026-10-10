import { createServer, request as httpRequest, Server } from "node:http";
import { AddressInfo } from "node:net";
import { gzipSync } from "node:zlib";
import {
  PublicUrlFetcher,
  assertPublicUrl,
  isPublicAddress,
  RequestTransport,
} from "./public-url-fetcher";

describe("public URL network boundary", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.100.100.200",
    "0.0.0.0",
    "224.0.0.1",
    "198.18.0.1",
    "192.0.2.1",
    "168.63.129.16",
    "::1",
    "::",
    "::ffff:127.0.0.1",
    "::ffff:8.8.8.8",
    "fc00::1",
    "fe80::1",
    "ff02::1",
    "64:ff9b::a00:1",
    "2001:db8::1",
    "2002:7f00:1::",
    "3fff::1",
  ])("rejects special destination %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
  it.each(["8.8.8.8", "172.32.1.1", "2606:4700:4700::1111"])(
    "allows ordinary global destination %s",
    (address) => expect(isPublicAddress(address)).toBe(true),
  );
  it.each([
    "file:///etc/passwd",
    "ftp://example.com",
    "http://user:pass@example.com",
    "http://example.com:3000",
    "http://localhost.",
    "http://127.1",
    "http://2130706433",
    "http://0x7f000001",
    "http://[::1]",
    "http://host.internal",
  ])("rejects unsafe URL before DNS %s", (url) =>
    expect(() => assertPublicUrl(url)).toThrow(),
  );

  let server: Server;
  let port: number;
  let arrivals: string[];
  let pinChecks: number;
  const transport: RequestTransport = (url, options, callback) => {
    expect(options.agent).toBe(false);
    expect(options.lookup).toBeDefined();
    options.lookup!(url.hostname, { all: false }, (error, address) => {
      expect(error).toBeNull();
      expect(address).toBe("8.8.8.8");
      pinChecks++;
    });
    // Test-only transport routes to controlled loopback; production has no such override.
    return httpRequest(
      {
        ...options,
        hostname: "127.0.0.1",
        port,
        path: url.pathname,
        lookup: undefined,
      },
      callback,
    );
  };
  beforeAll(async () => {
    server = createServer((req, res) => {
      arrivals.push(req.url!);
      if (req.url === "/redirect") {
        res.writeHead(302, {
          location: "http://169.254.169.254/latest/meta-data",
        });
        res.end();
      } else if (req.url === "/loop") {
        res.writeHead(302, { location: "/loop" });
        res.end();
      } else if (req.url === "/error") {
        res.writeHead(500, { "content-type": "text/html" });
        res.end("<html>not knowledge</html>");
      } else if (req.url === "/gzip") {
        res.writeHead(200, { "content-encoding": "gzip" });
        res.end(gzipSync("x".repeat(4096)));
      } else if (req.url === "/encoding") {
        res.writeHead(200, { "content-encoding": "unsupported" });
        res.end("x");
      } else if (req.url === "/truncated") {
        res.writeHead(200, { "content-length": "1000" });
        res.end("short");
      } else if (req.url === "/no-location") {
        res.writeHead(302);
        res.end();
      } else if (req.url === "/large") {
        res.end("x".repeat(2048));
      } else if (req.url === "/slow") {
        /* timeout test */
      } else {
        res.writeHead(200, { "content-type": "text/html" });
        res.end("<html><body>Verified public content</body></html>");
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    port = (server.address() as AddressInfo).port;
  });
  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  beforeEach(() => {
    arrivals = [];
    pinChecks = 0;
  });
  const resolver = jest.fn(async () => [{ address: "8.8.8.8", family: 4 }]);
  it("pins the validated DNS answer in the socket lookup (no second DNS lookup)", async () => {
    resolver.mockClear();
    const result = await new PublicUrlFetcher(resolver, transport).fetch(
      "http://example.com/ok",
    );
    expect(result.text).toContain("Verified public content");
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(pinChecks).toBe(1);
  });
  it("rejects mixed public/private DNS answers before opening a socket", async () => {
    const resolve = async () => [
      { address: "8.8.8.8", family: 4 },
      { address: "::1", family: 6 },
    ];
    await expect(
      new PublicUrlFetcher(resolve, transport).fetch("http://example.com/ok"),
    ).rejects.toThrow();
    expect(arrivals).toEqual([]);
  });
  it("rejects redirect to metadata before a second request", async () => {
    await expect(
      new PublicUrlFetcher(resolver, transport).fetch(
        "http://example.com/redirect",
      ),
    ).rejects.toThrow();
    expect(arrivals).toEqual(["/redirect"]);
  });
  it("rejects HTTP error bodies", async () => {
    await expect(
      new PublicUrlFetcher(resolver, transport).fetch(
        "http://example.com/error",
      ),
    ).rejects.toThrow("HTTP 500");
  });
  it("revalidates DNS for each redirect and rejects rebinding", async () => {
    const resolve = jest
      .fn()
      .mockResolvedValueOnce([{ address: "8.8.8.8", family: 4 }])
      .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
    await expect(
      new PublicUrlFetcher(resolve, transport).fetch("http://example.com/loop"),
    ).rejects.toThrow("DNS");
    expect(arrivals).toEqual(["/loop"]);
  });
  it("bounds DNS resolution and rejects empty answers", async () => {
    await expect(
      new PublicUrlFetcher(async () => []).fetch("http://example.com"),
    ).rejects.toThrow("DNS");
    await expect(
      new PublicUrlFetcher(() => new Promise(() => {})).fetch(
        "http://example.com",
        { timeoutMs: 10 },
      ),
    ).rejects.toThrow("timeout");
  });
  it("rejects missing redirect location and unsupported content encoding", async () => {
    const fetcher = new PublicUrlFetcher(resolver, transport);
    await expect(
      fetcher.fetch("http://example.com/no-location"),
    ).rejects.toThrow("redirect");
    await expect(fetcher.fetch("http://example.com/encoding")).rejects.toThrow(
      "encoding",
    );
  });
  it("bounds decompressed output and handles HEAD without a body", async () => {
    const fetcher = new PublicUrlFetcher(resolver, transport);
    await expect(
      fetcher.fetch("http://example.com/gzip", { maxBytes: 100 }),
    ).rejects.toThrow();
    expect((await fetcher.fetch("http://example.com/gzip")).text.length).toBe(
      4096,
    );
    expect(
      (await fetcher.fetch("http://example.com/ok", { method: "HEAD" })).text,
    ).toBe("");
  });
  it("bounds redirects, response bytes and stalled responses", async () => {
    const fetcher = new PublicUrlFetcher(resolver, transport);
    await expect(
      fetcher.fetch("http://example.com/loop", { maxRedirects: 2 }),
    ).rejects.toThrow("redirect");
    await expect(
      fetcher.fetch("http://example.com/large", { maxBytes: 100 }),
    ).rejects.toThrow("size");
    await expect(
      fetcher.fetch("http://example.com/slow", { timeoutMs: 30 }),
    ).rejects.toThrow("timeout");
  });
});
