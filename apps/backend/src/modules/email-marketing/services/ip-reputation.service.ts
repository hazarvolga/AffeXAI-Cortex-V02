import { Injectable, Logger } from "@nestjs/common";
import * as dns from "dns";
import { CacheService } from "../../../core/shared/services/cache.service";
import { TenantService } from "../../../core/tenant/tenant.service";

/**
 * Interface for IP reputation result
 */
export interface IpReputationResult {
  ip: string;
  isListed: boolean;
  reputation: "clean" | "listed" | "unknown";
  confidence: number;
  listedOn?: string[];
  errors?: string[];
  details: string;
}

/**
 * Interface for domain reputation result
 */
export interface DomainReputationResult {
  domain: string;
  isSuspicious: boolean;
  reputation: "good" | "poor" | "unknown";
  confidence: number;
  details: string;
}

@Injectable()
export class IpReputationService {
  private readonly logger = new Logger(IpReputationService.name);

  // Common DNSBL (DNS-based Blackhole List) servers
  // These are well-known blacklists for spam/malicious IP addresses
  private readonly dnsblServers = [
    "zen.spamhaus.org", // Spamhaus - one of the most reliable and widely used
    "bl.spamcop.net", // SpamCop - focuses on spam sources
    "b.barracudacentral.org", // Barracuda - commercial security provider
    "dnsbl-1.uceprotect.net", // UCEPROTECT - focuses on spam sources
    "dnsbl-2.uceprotect.net",
    "dnsbl-3.uceprotect.net",
    "spam.dnsbl.sorbs.net", // SORBS - Sender Policy Framework
    "dnsbl.dronebl.org", // DroneBL - focuses on open proxies and botnets
  ];

  // Timeout for DNS queries (in milliseconds)
  private readonly DNS_TIMEOUT = 5000;

  constructor(
    private readonly cacheService: CacheService,
    private readonly tenantService: TenantService,
  ) {}

  private getTenantId(): string {
    return this.tenantService.getTenantId() || "default";
  }

  /**
   * Checks if an IP address has a poor reputation by querying multiple DNSBLs
   * This is the main entry point for IP reputation checking
   *
   * @param ip The IP address to check
   * @returns IP reputation result with details
   */
  async checkIpReputation(ip: string): Promise<IpReputationResult> {
    try {
      // Validate IP format first
      if (!this.isValidIpAddress(ip)) {
        return {
          ip,
          isListed: false,
          reputation: "unknown",
          confidence: 0,
          details: "Invalid IP address format",
        };
      }

      // Check cache first to avoid unnecessary DNS queries
      // This is important for performance and rate limiting
      const tenantId = this.getTenantId();
      const cachedResult = await this.cacheService.get<IpReputationResult>(
        `${tenantId}_ip_reputation_${ip}`,
      );
      if (cachedResult) {
        return cachedResult;
      }

      // Reverse IP for DNSBL queries (e.g., 192.168.1.1 becomes 1.1.168.192)
      // DNSBLs require the IP to be reversed for the query
      const reversedIp = ip.split(".").reverse().join(".");

      // Query multiple DNSBLs in parallel for better performance
      // Using Promise.allSettled to handle failures gracefully
      const dnsblResults = await Promise.allSettled(
        this.dnsblServers.map((server) =>
          this.queryDnsblWithTimeout(reversedIp, server),
        ),
      );

      // Process results from all DNSBL queries
      const listedServers: string[] = [];
      const errors: string[] = [];

      dnsblResults.forEach((result, index) => {
        const server = this.dnsblServers[index];
        if (result.status === "fulfilled") {
          // If the IP is listed on this DNSBL, add it to our list
          if (result.value.isListed) {
            listedServers.push(server);
          }
        } else {
          // Collect errors for debugging purposes
          errors.push(`${server}: ${result.reason.message}`);
        }
      });

      // Calculate reputation based on listings
      // The more blacklists that list the IP, the worse its reputation
      const isListed = listedServers.length > 0;
      const confidence = Math.min(
        100,
        Math.round((listedServers.length / this.dnsblServers.length) * 100),
      );

      // Determine overall reputation status
      // Clean only when at least one list actually answered.
      const answered = this.dnsblServers.length - errors.length;
      let reputation: "clean" | "listed" | "unknown" = "unknown";
      if (listedServers.length > 0) {
        reputation = "listed";
      } else if (answered > 0) {
        reputation = "clean";
      }

      // Prepare the result object
      const result: IpReputationResult = {
        ip,
        isListed,
        reputation,
        confidence,
        listedOn: listedServers,
        errors: errors.length > 0 ? errors : undefined,
        details: isListed
          ? `IP listed on ${listedServers.length} blacklists`
          : answered > 0
            ? `IP not listed on the ${answered} blacklists that answered`
            : "No blacklist could be queried",
      };

      // Cache answered results for 24 hours; an unknown result is retried next time.
      if (reputation !== "unknown") {
        await this.cacheService.set(
          `${tenantId}_ip_reputation_${ip}`,
          result,
          86400,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`IP reputation check failed for ${ip}:`, error);
      return {
        ip,
        isListed: false,
        reputation: "unknown",
        confidence: 0,
        details: `IP reputation check failed: ${error.message}`,
      };
    }
  }

  /**
   * Queries a specific DNSBL server with timeout
   * This method adds timeout functionality to prevent hanging DNS queries
   *
   * @param reversedIp The reversed IP address
   * @param dnsblServer The DNSBL server to query
   * @returns DNSBL query result
   */
  private async queryDnsblWithTimeout(
    reversedIp: string,
    dnsblServer: string,
  ): Promise<{ isListed: boolean }> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("DNS query timeout")),
        this.DNS_TIMEOUT,
      );
    });

    // Race the DNS query against the timeout and always release the timer.
    try {
      return await Promise.race([
        this.queryDnsbl(reversedIp, dnsblServer),
        timeoutPromise,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Queries a specific DNSBL server
   * This is the core DNS lookup functionality
   *
   * @param reversedIp The reversed IP address
   * @param dnsblServer The DNSBL server to query
   * @returns DNSBL query result
   */
  private async queryDnsbl(
    reversedIp: string,
    dnsblServer: string,
  ): Promise<{ isListed: boolean }> {
    try {
      const query = `${reversedIp}.${dnsblServer}`;
      const tenantId = this.getTenantId();

      // Check cache first to avoid unnecessary DNS queries
      const cached = await this.cacheService.get<boolean>(
        `${tenantId}_dnsbl_${query}`,
      );
      if (cached !== undefined) {
        return { isListed: cached };
      }

      // Perform DNS lookup using Node.js built-in DNS module
      // If the IP is listed, we'll get a response with address information
      // If not listed, we'll get an ENOTFOUND or ENODATA error
      return new Promise<{ isListed: boolean }>((resolve, reject) => {
        // Set a timeout for the DNS query to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error("DNS query timeout"));
        }, this.DNS_TIMEOUT);

        dns.resolve4(query, (err, addresses) => {
          // Clear the timeout since we got a response
          clearTimeout(timeout);

          if (err) {
            // NXDOMAIN (no record found) or NODATA means IP is NOT listed
            // This is the expected response for clean IPs
            if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
              // IP is NOT listed
              this.cacheService.set(`${tenantId}_dnsbl_${query}`, false, 86400);
              resolve({ isListed: false });
            } else {
              // A network or resolver failure says nothing about the IP; report it, do not cache it.
              this.logger.warn(
                `DNSBL query error for ${query}: ${err.message}`,
              );
              reject(new Error(`DNS ${err.code ?? "error"}`));
            }
          } else if (
            addresses?.some((address) => address.startsWith("127.255.255."))
          ) {
            // Spamhaus-style refusal codes (e.g. queries through public resolvers), not listings.
            reject(
              new Error(`DNSBL refused the query (${addresses.join(", ")})`),
            );
          } else if (addresses?.some((address) => address.startsWith("127."))) {
            this.cacheService.set(`${tenantId}_dnsbl_${query}`, true, 86400);
            resolve({ isListed: true });
          } else if (addresses && addresses.length > 0) {
            // Answers outside 127.0.0.0/8 come from resolver hijacking, not from the list.
            reject(
              new Error(`Unexpected DNSBL answer (${addresses.join(", ")})`),
            );
          } else {
            this.cacheService.set(`${tenantId}_dnsbl_${query}`, false, 86400);
            resolve({ isListed: false });
          }
        });
      });
    } catch (error) {
      this.logger.error(
        `Unexpected error in DNSBL query for ${reversedIp}.${dnsblServer}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Validates IP address format (IPv4 only for now)
   * This ensures we're working with valid IP addresses
   *
   * @param ip The IP address to validate
   * @returns True if valid IPv4 format, false otherwise
   */
  private isValidIpAddress(ip: string): boolean {
    // Basic regex pattern for IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) {
      return false;
    }

    // Check that each octet is between 0 and 255
    const octets = ip.split(".").map(Number);
    return octets.every((octet) => octet >= 0 && octet <= 255);
  }

  /**
   * Gets domain reputation by checking domain against various reputation services
   * This provides additional context beyond IP reputation
   *
   * @param domain The domain to check
   * @returns Domain reputation result
   */
  async checkDomainReputation(domain: string): Promise<DomainReputationResult> {
    try {
      const tenantId = this.getTenantId();
      // Check cache first
      const cachedResult = await this.cacheService.get<DomainReputationResult>(
        `${tenantId}_domain_reputation_${domain}`,
      );
      if (cachedResult) {
        return cachedResult;
      }

      // For now, we'll implement a simple check based on known problematic domains
      // In a production environment, you would integrate with domain reputation services
      const suspiciousDomains = [
        "tempmail.com",
        "guerrillamail.com",
        "mailinator.com",
        "10minutemail.com",
        "yopmail.com",
        "temp-mail.org",
      ];

      const isSuspicious = suspiciousDomains.some((d) => domain.includes(d));

      const result: DomainReputationResult = {
        domain,
        isSuspicious,
        reputation: isSuspicious ? "poor" : "good",
        confidence: isSuspicious ? 90 : 80,
        details: isSuspicious
          ? "Domain associated with temporary email services"
          : "Domain appears legitimate",
      };

      // Cache result for 24 hours
      await this.cacheService.set(
        `${tenantId}_domain_reputation_${domain}`,
        result,
        86400,
      );

      return result;
    } catch (error) {
      this.logger.error(`Domain reputation check failed for ${domain}:`, error);
      return {
        domain,
        isSuspicious: false,
        reputation: "unknown",
        confidence: 0,
        details: `Domain reputation check failed: ${error.message}`,
      };
    }
  }
}
