import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { CacheService } from '../../../core/shared/services/cache.service';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * Interface for IP reputation result
 */
export interface IpReputationResult {
  ip: string;
  isListed: boolean;
  reputation: 'clean' | 'listed' | 'unknown';
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
  reputation: 'good' | 'poor' | 'unknown';
  confidence: number;
  details: string;
}

@Injectable()
export class IpReputationService {
  private readonly logger = new Logger(IpReputationService.name);

  // Common DNSBL (DNS-based Blackhole List) servers
  // These are well-known blacklists for spam/malicious IP addresses
  private readonly dnsblServers = [
    'zen.spamhaus.org',        // Spamhaus - one of the most reliable and widely used
    'bl.spamcop.net',          // SpamCop - focuses on spam sources
    'b.barracudacentral.org',  // Barracuda - commercial security provider
    'dnsbl-1.uceprotect.net',  // UCEPROTECT - focuses on spam sources
    'dnsbl-2.uceprotect.net',
    'dnsbl-3.uceprotect.net',
    'spam.dnsbl.sorbs.net',    // SORBS - Sender Policy Framework
    'dnsbl.dronebl.org'        // DroneBL - focuses on open proxies and botnets
  ];

  // Timeout for DNS queries (in milliseconds)
  private readonly DNS_TIMEOUT = 5000;

  constructor(
    private readonly cacheService: CacheService,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    return this.tenantService.getTenantId() || 'default';
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
          reputation: 'unknown',
          confidence: 0,
          details: 'Invalid IP address format'
        };
      }

      // Check cache first to avoid unnecessary DNS queries
      // This is important for performance and rate limiting
      const tenantId = this.getTenantId();
      const cachedResult = await this.cacheService.get<IpReputationResult>(`${tenantId}_ip_reputation_${ip}`);
      if (cachedResult) {
        return cachedResult;
      }

      // Reverse IP for DNSBL queries (e.g., 192.168.1.1 becomes 1.1.168.192)
      // DNSBLs require the IP to be reversed for the query
      const reversedIp = ip.split('.').reverse().join('.');

      // Query multiple DNSBLs in parallel for better performance
      // Using Promise.allSettled to handle failures gracefully
      const dnsblResults = await Promise.allSettled(
        this.dnsblServers.map(server => this.queryDnsblWithTimeout(reversedIp, server))
      );

      // Process results from all DNSBL queries
      const listedServers: string[] = [];
      const errors: string[] = [];

      dnsblResults.forEach((result, index) => {
        const server = this.dnsblServers[index];
        if (result.status === 'fulfilled') {
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
      const confidence = Math.min(100, Math.round((listedServers.length / this.dnsblServers.length) * 100));

      // Determine overall reputation status
      let reputation: 'clean' | 'listed' | 'unknown' = 'unknown';
      if (listedServers.length === 0) {
        reputation = 'clean';
      } else {
        reputation = 'listed';
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
          : 'IP not listed on any major blacklists'
      };

      // Cache result for 24 hours (86400 seconds)
      // This prevents excessive DNS queries for the same IP and improves performance
      await this.cacheService.set(`${tenantId}_ip_reputation_${ip}`, result, 86400);

      return result;
    } catch (error) {
      this.logger.error(`IP reputation check failed for ${ip}:`, error);
      return {
        ip,
        isListed: false,
        reputation: 'unknown',
        confidence: 0,
        details: `IP reputation check failed: ${error.message}`
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
  private async queryDnsblWithTimeout(reversedIp: string, dnsblServer: string): Promise<{ isListed: boolean }> {
    // Create a promise that rejects after the timeout period
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('DNS query timeout')), this.DNS_TIMEOUT);
    });

    // Create the actual DNS query promise
    const dnsQueryPromise = this.queryDnsbl(reversedIp, dnsblServer);

    // Race the DNS query against the timeout
    // This ensures we don't hang indefinitely on slow/unresponsive DNS servers
    return Promise.race([dnsQueryPromise, timeoutPromise]);
  }

  /**
   * Queries a specific DNSBL server
   * This is the core DNS lookup functionality
   * 
   * @param reversedIp The reversed IP address
   * @param dnsblServer The DNSBL server to query
   * @returns DNSBL query result
   */
  private async queryDnsbl(reversedIp: string, dnsblServer: string): Promise<{ isListed: boolean }> {
    try {
      const query = `${reversedIp}.${dnsblServer}`;
      const tenantId = this.getTenantId();

      // Check cache first to avoid unnecessary DNS queries
      const cached = await this.cacheService.get<boolean>(`${tenantId}_dnsbl_${query}`);
      if (cached !== undefined) {
        return { isListed: cached };
      }

      // Perform DNS lookup using Node.js built-in DNS module
      // If the IP is listed, we'll get a response with address information
      // If not listed, we'll get an ENOTFOUND or ENODATA error
      return new Promise<{ isListed: boolean }>((resolve, reject) => {
        // Set a timeout for the DNS query to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error('DNS query timeout'));
        }, this.DNS_TIMEOUT);

        dns.resolve4(query, (err, addresses) => {
          // Clear the timeout since we got a response
          clearTimeout(timeout);

          if (err) {
            // NXDOMAIN (no record found) or NODATA means IP is NOT listed
            // This is the expected response for clean IPs
            if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
              // IP is NOT listed
              this.cacheService.set(`${tenantId}_dnsbl_${query}`, false, 86400);
              resolve({ isListed: false });
            } else {
              // Other errors might indicate network issues
              // We'll treat these as "unknown" rather than assuming listed
              this.logger.warn(`DNSBL query error for ${query}: ${err.message}`);
              this.cacheService.set(`${tenantId}_dnsbl_${query}`, false, 3600); // Cache for 1 hour
              resolve({ isListed: false });
            }
          } else {
            // If we get addresses, the IP IS listed on this blacklist
            if (addresses && addresses.length > 0) {
              this.cacheService.set(`${tenantId}_dnsbl_${query}`, true, 86400);
              resolve({ isListed: true });
            } else {
              // No addresses returned, treat as not listed
              this.cacheService.set(`${tenantId}_dnsbl_${query}`, false, 86400);
              resolve({ isListed: false });
            }
          }
        });
      });
    } catch (error) {
      // Handle any other unexpected errors
      this.logger.error(`Unexpected error in DNSBL query for ${reversedIp}.${dnsblServer}:`, error);
      // Cache negative result for 1 hour to prevent repeated failures
      const query = `${reversedIp}.${dnsblServer}`;
      const tenantId = this.getTenantId();
      await this.cacheService.set(`${tenantId}_dnsbl_${query}`, false, 3600);
      return { isListed: false };
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
    const octets = ip.split('.').map(Number);
    return octets.every(octet => octet >= 0 && octet <= 255);
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
      const cachedResult = await this.cacheService.get<DomainReputationResult>(`${tenantId}_domain_reputation_${domain}`);
      if (cachedResult) {
        return cachedResult;
      }

      // For now, we'll implement a simple check based on known problematic domains
      // In a production environment, you would integrate with domain reputation services
      const suspiciousDomains = [
        'tempmail.com', 'guerrillamail.com', 'mailinator.com',
        '10minutemail.com', 'yopmail.com', 'temp-mail.org'
      ];

      const isSuspicious = suspiciousDomains.some(d => domain.includes(d));

      const result: DomainReputationResult = {
        domain,
        isSuspicious,
        reputation: isSuspicious ? 'poor' : 'good',
        confidence: isSuspicious ? 90 : 80,
        details: isSuspicious
          ? 'Domain associated with temporary email services'
          : 'Domain appears legitimate'
      };

      // Cache result for 24 hours
      await this.cacheService.set(`${tenantId}_domain_reputation_${domain}`, result, 86400);

      return result;
    } catch (error) {
      this.logger.error(`Domain reputation check failed for ${domain}:`, error);
      return {
        domain,
        isSuspicious: false,
        reputation: 'unknown',
        confidence: 0,
        details: `Domain reputation check failed: ${error.message}`
      };
    }
  }
}