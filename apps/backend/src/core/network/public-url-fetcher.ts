import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import {
  request as httpRequest,
  RequestOptions,
  IncomingMessage,
  ClientRequest,
} from "node:http";
import { request as httpsRequest } from "node:https";
import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";

const blocked4 = new BlockList();
// Conservative special-purpose policy (IANA registries); not just RFC1918.
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.31.196.0", 24],
  ["192.52.193.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["192.175.48.0", 24],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked4.addSubnet(network, prefix, "ipv4");
blocked4.addAddress("168.63.129.16", "ipv4"); // Azure platform virtual IP.
const global6 = new BlockList();
global6.addSubnet("2000::", 3, "ipv6");
const blocked6 = new BlockList();
for (const [network, prefix] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
] as const) {
  blocked6.addSubnet(network, prefix, "ipv6");
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked4.check(address, "ipv4");
  // Mapped/translated IPv4 and other transition ranges are deliberately rejected.
  return (
    family === 6 &&
    global6.check(address, "ipv6") &&
    !blocked6.check(address, "ipv6")
  );
}

export function assertPublicUrl(input: string): URL {
  if (typeof input !== "string" || input.length > 2048)
    throw new Error("Invalid public URL");
  const url = new URL(input);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && url.port !== (url.protocol === "https:" ? "443" : "80"))
  ) {
    throw new Error(
      "Only credential-free HTTP/HTTPS on standard ports is allowed",
    );
  }
  const host = url.hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    /\.(?:localhost|local|internal|home|lan)$/.test(host) ||
    (!isIP(host) && !host.includes(".")) ||
    (isIP(host) && !isPublicAddress(host))
  ) {
    throw new Error("Private or reserved URL destination");
  }
  url.hash = "";
  return url;
}

export class PublicUrlHttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status} is not ingestible content`);
  }
}
interface ResolvedAddress {
  address: string;
  family: number;
}
type Resolver = (hostname: string) => Promise<ResolvedAddress[]>;
export type RequestTransport = (
  url: URL,
  options: RequestOptions,
  callback: (response: IncomingMessage) => void,
) => ClientRequest;
const defaultTransport: RequestTransport = (url, options, callback) =>
  (url.protocol === "https:" ? httpsRequest : httpRequest)(
    url,
    options,
    callback,
  );
interface FetchOptions {
  method?: "GET" | "HEAD";
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}
export interface PublicUrlResponse {
  text: string;
  status: number;
  headers: IncomingMessage["headers"];
  url: string;
}

/** Socket lookup is pinned to the checked address; no proxy/env or browser bypass. */
export class PublicUrlFetcher {
  constructor(
    private readonly resolve: Resolver = (hostname) =>
      lookup(hostname, { all: true, verbatim: true }),
    private readonly transport: RequestTransport = defaultTransport,
  ) {}

  async fetch(
    input: string,
    options: FetchOptions = {},
  ): Promise<PublicUrlResponse> {
    const deadline = Date.now() + (options.timeoutMs ?? 30_000);
    const maxBytes = options.maxBytes ?? 5 * 1024 * 1024;
    let url = assertPublicUrl(input);
    for (let hop = 0; hop <= (options.maxRedirects ?? 5); hop++) {
      const host = url.hostname.replace(/^\[|\]$/g, "");
      const addresses = isIP(host)
        ? [{ address: host, family: isIP(host) }]
        : await this.withDeadline(this.resolve(host), deadline);
      if (
        !addresses.length ||
        addresses.some(
          (value) =>
            !isPublicAddress(value.address) ||
            isIP(value.address) !== value.family,
        )
      ) {
        throw new Error("DNS contains a private or reserved destination");
      }
      const selected = addresses[0];
      const result = await this.request(
        url,
        selected,
        deadline,
        maxBytes,
        options.method ?? "GET",
      );
      if ([301, 302, 303, 307, 308].includes(result.status)) {
        if (!result.headers.location) throw new Error("Invalid redirect");
        url = assertPublicUrl(new URL(result.headers.location, url).href);
        continue;
      }
      if (result.status < 200 || result.status >= 300)
        throw new PublicUrlHttpError(result.status);
      return result;
    }
    throw new Error("Too many redirects");
  }

  private async withDeadline<T>(
    promise: Promise<T>,
    deadline: number,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () => reject(new Error("Public URL timeout")),
            Math.max(0, deadline - Date.now()),
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  private request(
    url: URL,
    selected: ResolvedAddress,
    deadline: number,
    maxBytes: number,
    method: "GET" | "HEAD",
  ): Promise<PublicUrlResponse> {
    if (Date.now() >= deadline)
      return Promise.reject(new Error("Public URL timeout"));
    return new Promise((resolve, reject) => {
      const req = this.transport(
        url,
        {
          method,
          agent: false,
          family: selected.family,
          lookup: (_hostname, options, callback) =>
            callback(
              null,
              options.all ? [selected] : selected.address,
              selected.family,
            ),
          headers: {
            "User-Agent": "AffeXAI-Crawler/1.0",
            Accept: "text/html,application/xhtml+xml,text/plain",
            "Accept-Encoding": "identity",
          },
        },
        (response) => {
          const status = response.statusCode ?? 0;
          // Never read or decode an error/redirect body as knowledge.
          if (status < 200 || status >= 300 || method === "HEAD") {
            response.resume();
            resolve({
              text: "",
              status,
              headers: response.headers,
              url: url.href,
            });
            req.destroy();
            return;
          }
          const chunks: Buffer[] = [];
          let bytes = 0;
          response.on("data", (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > maxBytes) {
              const error = new Error("Response exceeds size limit");
              reject(error);
              response.destroy(error);
              req.destroy(error);
              return;
            }
            chunks.push(chunk);
          });
          response.on("error", reject);
          response.on("aborted", () =>
            reject(new Error("Incomplete URL response")),
          );
          response.on("end", () => {
            try {
              if (bytes > maxBytes || !response.complete)
                throw new Error("Incomplete or oversized URL response");
              const buffer = Buffer.concat(chunks);
              const encoding = response.headers["content-encoding"];
              const decodeOptions = { maxOutputLength: maxBytes };
              const decoded =
                !encoding || encoding === "identity"
                  ? buffer
                  : encoding === "gzip"
                    ? gunzipSync(buffer, decodeOptions)
                    : encoding === "deflate"
                      ? inflateSync(buffer, decodeOptions)
                      : encoding === "br"
                        ? brotliDecompressSync(buffer, decodeOptions)
                        : (() => {
                            throw new Error("Unsupported content encoding");
                          })();
              resolve({
                text: decoded.toString("utf8"),
                status,
                headers: response.headers,
                url: url.href,
              });
            } catch (error) {
              reject(error instanceof Error ? error : new Error(String(error)));
            }
          });
        },
      );
      const timer = setTimeout(
        () => req.destroy(new Error("Public URL timeout")),
        Math.max(0, deadline - Date.now()),
      );
      req.on("error", reject);
      req.on("close", () => clearTimeout(timer));
      req.end();
    });
  }
}

export const publicUrlFetcher = new PublicUrlFetcher();
