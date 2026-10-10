import { Injectable, Logger } from '@nestjs/common';
import { promises as dns } from 'dns';

export interface DNSVerificationResult {
  recordType: 'SPF' | 'DKIM' | 'DMARC' | 'MX' | 'CNAME';
  verified: boolean;
  expected?: string;
  actual?: string;
  error?: string;
}

export interface DomainVerificationResult {
  domain: string;
  provider: string;
  spf?: DNSVerificationResult;
  dkim?: DNSVerificationResult;
  dmarc?: DNSVerificationResult;
  mx?: DNSVerificationResult[];
  overall: boolean;
  checkedAt: Date;
}

@Injectable()
export class DNSVerificationService {
  private readonly logger = new Logger(DNSVerificationService.name);

  /**
   * Verify DNS records for an email provider
   */
  async verifyDomain(
    domain: string,
    provider: string,
  ): Promise<DomainVerificationResult> {
    this.logger.log(`Verifying DNS records for ${domain} (provider: ${provider})`);

    const result: DomainVerificationResult = {
      domain,
      provider,
      overall: false,
      checkedAt: new Date(),
    };

    try {
      // Verify SPF
      result.spf = await this.verifySPF(domain, provider);

      // Verify DKIM (provider-specific)
      result.dkim = await this.verifyDKIM(domain, provider);

      // Verify DMARC
      result.dmarc = await this.verifyDMARC(domain);

      // Verify MX records if needed (Mailgun)
      if (provider === 'mailgun') {
        result.mx = await this.verifyMXRecords(domain);
      }

      // Overall verification: SPF and DKIM must pass
      result.overall =
        (result.spf?.verified ?? false) &&
        (result.dkim?.verified ?? false) &&
        (result.dmarc?.verified ?? false);

    } catch (error) {
      this.logger.error(`DNS verification failed for ${domain}:`, error);
    }

    return result;
  }

  /**
   * Verify SPF record
   */
  private async verifySPF(
    domain: string,
    provider: string,
  ): Promise<DNSVerificationResult> {
    const result: DNSVerificationResult = {
      recordType: 'SPF',
      verified: false,
    };

    try {
      const txtRecords = await this.resolveTXT(domain);

      // Find SPF record (starts with v=spf1)
      const spfRecord = txtRecords.find(record =>
        record.startsWith('v=spf1')
      );

      if (!spfRecord) {
        result.error = 'SPF record not found';
        return result;
      }

      result.actual = spfRecord;

      // Check if it includes the provider's SPF domain
      const providerSPF = this.getProviderSPF(provider);
      if (providerSPF) {
        result.expected = providerSPF;
        result.verified = spfRecord.includes(providerSPF);

        if (!result.verified) {
          result.error = `SPF record does not include ${providerSPF}`;
        }
      } else {
        // For providers without specific SPF, just check record exists
        result.verified = true;
      }

    } catch (error) {
      result.error = `DNS lookup failed: ${error.message}`;
    }

    return result;
  }

  /**
   * Verify DKIM record
   */
  private async verifyDKIM(
    domain: string,
    provider: string,
  ): Promise<DNSVerificationResult> {
    const result: DNSVerificationResult = {
      recordType: 'DKIM',
      verified: false,
    };

    try {
      const dkimSelector = this.getDKIMSelector(provider);

      if (!dkimSelector) {
        result.error = 'DKIM selector unknown for this provider';
        return result;
      }

      const dkimDomain = `${dkimSelector}._domainkey.${domain}`;
      const txtRecords = await this.resolveTXT(dkimDomain);

      if (txtRecords.length === 0) {
        result.error = `DKIM record not found at ${dkimDomain}`;
        return result;
      }

      // DKIM record should contain v=DKIM1
      const dkimRecord = txtRecords.find(record =>
        record.includes('v=DKIM1') || record.includes('p=')
      );

      if (!dkimRecord) {
        result.error = 'Invalid DKIM record format';
        return result;
      }

      result.actual = dkimRecord;
      result.verified = true;

    } catch (error) {
      result.error = `DKIM lookup failed: ${error.message}`;
    }

    return result;
  }

  /**
   * Verify DMARC record
   */
  private async verifyDMARC(domain: string): Promise<DNSVerificationResult> {
    const result: DNSVerificationResult = {
      recordType: 'DMARC',
      verified: false,
    };

    try {
      const dmarcDomain = `_dmarc.${domain}`;
      const txtRecords = await this.resolveTXT(dmarcDomain);

      if (txtRecords.length === 0) {
        result.error = `DMARC record not found at ${dmarcDomain}`;
        return result;
      }

      // DMARC record should start with v=DMARC1
      const dmarcRecord = txtRecords.find(record =>
        record.startsWith('v=DMARC1')
      );

      if (!dmarcRecord) {
        result.error = 'Invalid DMARC record format';
        return result;
      }

      result.actual = dmarcRecord;
      result.verified = true;

    } catch (error) {
      result.error = `DMARC lookup failed: ${error.message}`;
    }

    return result;
  }

  /**
   * Verify MX records (for Mailgun)
   */
  private async verifyMXRecords(domain: string): Promise<DNSVerificationResult[]> {
    const results: DNSVerificationResult[] = [];

    try {
      const mxRecords = await dns.resolveMx(domain);

      // Check for Mailgun MX servers
      const mailgunMX = ['mxa.mailgun.org', 'mxb.mailgun.org'];

      for (const expectedMX of mailgunMX) {
        const found = mxRecords.some(record =>
          record.exchange.toLowerCase() === expectedMX
        );

        results.push({
          recordType: 'MX',
          verified: found,
          expected: expectedMX,
          actual: found
            ? mxRecords.find(r => r.exchange.toLowerCase() === expectedMX)?.exchange
            : undefined,
          error: found ? undefined : `MX record ${expectedMX} not found`,
        });
      }

    } catch (error) {
      results.push({
        recordType: 'MX',
        verified: false,
        error: `MX lookup failed: ${error.message}`,
      });
    }

    return results;
  }

  /**
   * Resolve TXT records with joined values
   */
  private async resolveTXT(domain: string): Promise<string[]> {
    try {
      const records = await dns.resolveTxt(domain);
      // TXT records come as arrays of strings that need to be joined
      return records.map(record =>
        Array.isArray(record) ? record.join('') : record
      );
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get provider-specific SPF include domain
   */
  private getProviderSPF(provider: string): string | null {
    const spfMap: Record<string, string> = {
      resend: 'include:_spf.resend.com',
      sendgrid: 'include:sendgrid.net',
      postmark: 'include:spf.mtasv.net',
      mailgun: 'include:mailgun.org',
      ses: 'include:amazonses.com',
      gmail: 'include:_spf.google.com',
    };

    return spfMap[provider] || null;
  }

  /**
   * Get provider-specific DKIM selector
   */
  private getDKIMSelector(provider: string): string | null {
    const selectorMap: Record<string, string> = {
      resend: 'resend',
      sendgrid: 's1', // SendGrid uses s1 and s2
      postmark: null, // Postmark uses custom selector from dashboard
      mailgun: 'mx',
      ses: null, // SES uses custom selectors
      gmail: null, // Gmail doesn't use DKIM for SMTP
    };

    return selectorMap[provider] || null;
  }

  /**
   * Quick DNS health check (just SPF)
   */
  async quickCheck(domain: string): Promise<{ hasRecords: boolean; spfFound: boolean }> {
    try {
      const txtRecords = await this.resolveTXT(domain);
      const spfFound = txtRecords.some(record => record.startsWith('v=spf1'));

      return {
        hasRecords: txtRecords.length > 0,
        spfFound,
      };
    } catch (error) {
      return {
        hasRecords: false,
        spfFound: false,
      };
    }
  }
}
