import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import * as net from 'net';
import { CacheService } from '../../../core/shared/services/cache.service';
import { IpReputationService, IpReputationResult } from './ip-reputation.service';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class AdvancedEmailValidationService {
  private readonly logger = new Logger(AdvancedEmailValidationService.name);
  private readonly disposableDomains = new Set([
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwawaymail.com',
    '10minutemail.com', 'yopmail.com', 'temp-mail.org', 'maildrop.cc'
  ]);

  private readonly roleAccounts = new Set([
    'admin', 'info', 'support', 'sales', 'contact', 'help', 'service',
    'webmaster', 'postmaster', 'hostmaster', 'abuse'
  ]);

  private readonly commonTypos = new Map([
    ['gmial.com', 'gmail.com'],
    ['gamil.com', 'gmail.com'],
    ['gmal.com', 'gmail.com'],
    ['hotmial.com', 'hotmail.com'],
    ['hotmal.com', 'hotmail.com'],
    ['yaho.com', 'yahoo.com'],
    ['outloo.com', 'outlook.com'],
    ['iclou.com', 'icloud.com']
  ]);

  constructor(
    private readonly cacheService: CacheService,
    private readonly ipReputationService: IpReputationService,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    return this.tenantService.getTenantId() || 'default';
  }

  /**
   * Main validation method that runs all checks
   * @param email The email address to validate
   * @param senderIp Optional IP address of the sender for reputation checking
   * @returns Detailed validation result with confidence score
   */
  async validateEmail(email: string, senderIp?: string): Promise<EmailValidationResult> {
    try {
      const tenantId = this.getTenantId();
      // Check cache first
      const cacheKey = senderIp
        ? `${tenantId}_email_validation_${email}_${senderIp}`
        : `${tenantId}_email_validation_${email}`;

      const cachedResult = await this.cacheService.get<EmailValidationResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // 1. Syntactic validation
      const syntaxCheck = this.validateSyntax(email);
      if (!syntaxCheck.isValid) {
        const result: EmailValidationResult = {
          email,
          isValid: false,
          status: 'invalid',
          confidence: 0,
          checks: {
            syntax: syntaxCheck,
            domain: { isValid: false, details: 'Syntax validation failed' },
            mx: { isValid: false, details: 'Syntax validation failed' }
          }
        };
        await this.cacheService.set(cacheKey, result, 3600); // Cache for 1 hour
        return result;
      }

      // 2. Extract domain and local part
      const [localPart, domain] = email.split('@');

      // 3. Domain validation
      const domainCheck = await this.validateDomain(domain);
      if (!domainCheck.isValid) {
        const result: EmailValidationResult = {
          email,
          isValid: false,
          status: 'invalid',
          confidence: 20,
          checks: {
            syntax: syntaxCheck,
            domain: domainCheck,
            mx: { isValid: false, details: 'Domain validation failed' }
          }
        };
        await this.cacheService.set(cacheKey, result, 3600);
        return result;
      }

      // 4. MX record check
      const mxCheck = await this.checkMXRecords(domain);
      if (!mxCheck.isValid) {
        const result: EmailValidationResult = {
          email,
          isValid: false,
          status: 'invalid',
          confidence: 30,
          checks: {
            syntax: syntaxCheck,
            domain: domainCheck,
            mx: mxCheck
          }
        };
        await this.cacheService.set(cacheKey, result, 3600);
        return result;
      }

      // 5. Advanced checks
      const disposableCheck = this.checkDisposable(domain);
      const roleAccountCheck = this.checkRoleAccount(localPart);
      const typoCheck = this.checkTypos(domain);

      // 6. IP reputation check (if provided)
      let ipReputationCheck: IpReputationCheck | undefined;
      if (senderIp) {
        const ipResult: IpReputationResult = await this.ipReputationService.checkIpReputation(senderIp);
        // Convert IP reputation result to match our interface
        let reputation: 'good' | 'neutral' | 'poor' | 'unknown' = 'unknown';
        if (ipResult.reputation === 'clean') {
          reputation = 'good';
        } else if (ipResult.reputation === 'listed') {
          reputation = 'poor';
        } else {
          reputation = 'unknown';
        }

        ipReputationCheck = {
          isValid: ipResult.reputation !== 'listed',
          details: ipResult.details,
          reputation: reputation,
          confidence: ipResult.confidence
        };
      }

      // 7. Domain reputation check
      const domainReputationResult = await this.ipReputationService.checkDomainReputation(domain);
      const domainReputationCheck: DomainReputationCheck = {
        isValid: domainReputationResult.reputation !== 'poor',
        details: domainReputationResult.details,
        reputation: domainReputationResult.reputation,
        confidence: domainReputationResult.confidence
      };

      // 8. Calculate confidence score
      const confidence = this.calculateConfidence({
        syntax: syntaxCheck,
        domain: domainCheck,
        mx: mxCheck,
        disposable: disposableCheck,
        roleAccount: roleAccountCheck,
        typo: typoCheck,
        ipReputation: ipReputationCheck,
        domainReputation: domainReputationCheck
      });

      // 9. Determine status
      let status: 'valid' | 'invalid' | 'risky' = 'valid';
      if (confidence < 30) {
        status = 'invalid';
      } else if (confidence < 70) {
        status = 'risky';
      }

      const result: EmailValidationResult = {
        email,
        isValid: status !== 'invalid',
        status,
        confidence,
        checks: {
          syntax: syntaxCheck,
          domain: domainCheck,
          mx: mxCheck,
          disposable: disposableCheck,
          roleAccount: roleAccountCheck,
          typo: typoCheck,
          ipReputation: ipReputationCheck,
          domainReputation: domainReputationCheck
        }
      };

      // Cache result
      await this.cacheService.set(cacheKey, result, 3600);

      return result;
    } catch (error) {
      this.logger.error(`Email validation failed for ${email}:`, error);
      return {
        email,
        isValid: false,
        status: 'unknown',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Validates email syntax using RFC 5322 compliant regex
   */
  private validateSyntax(email: string): ValidationCheck {
    // More comprehensive regex for email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const isValid = emailRegex.test(email) && email.length <= 254;

    return {
      isValid,
      details: isValid ? 'Valid email format' : 'Invalid email format'
    };
  }

  /**
   * Validates domain existence
   */
  private async validateDomain(domain: string): Promise<ValidationCheck> {
    try {
      const tenantId = this.getTenantId();
      // Check cache first
      const cached = await this.cacheService.get<boolean>(`${tenantId}_domain_check_${domain}`);
      if (cached !== undefined) {
        return {
          isValid: cached,
          details: cached ? 'Domain exists' : 'Domain does not exist'
        };
      }

      // Perform DNS lookup
      await new Promise<void>((resolve, reject) => {
        dns.lookup(domain, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Cache positive result for 24 hours
      await this.cacheService.set(`${tenantId}_domain_check_${domain}`, true, 86400);

      return {
        isValid: true,
        details: 'Domain exists'
      };
    } catch (error) {
      const tenantId = this.getTenantId();
      // Cache negative result for 1 hour
      await this.cacheService.set(`${tenantId}_domain_check_${domain}`, false, 3600);

      return {
        isValid: false,
        details: `Domain lookup failed: ${error.message}`
      };
    }
  }

  /**
   * Checks MX records for the domain
   */
  private async checkMXRecords(domain: string): Promise<ValidationCheck> {
    try {
      const tenantId = this.getTenantId();
      // Check cache first
      const cached = await this.cacheService.get<any[]>(`${tenantId}_mx_check_${domain}`);
      if (cached !== undefined) {
        return {
          isValid: cached.length > 0,
          details: cached.length > 0 ? `Found ${cached.length} MX records` : 'No MX records found'
        };
      }

      // Perform MX lookup
      const mxRecords = await new Promise<any[]>((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
          if (err) {
            reject(err);
          } else {
            resolve(addresses || []);
          }
        });
      });

      // Sort by priority
      mxRecords.sort((a, b) => a.priority - b.priority);

      // Cache result for 24 hours
      await this.cacheService.set(`${tenantId}_mx_check_${domain}`, mxRecords, 86400);

      return {
        isValid: mxRecords.length > 0,
        details: mxRecords.length > 0 ? `Found ${mxRecords.length} MX records` : 'No MX records found'
      };
    } catch (error) {
      return {
        isValid: false,
        details: `MX record lookup failed: ${error.message}`
      };
    }
  }

  /**
   * Checks if domain is disposable/temporary
   */
  private checkDisposable(domain: string): ValidationCheck {
    const isDisposable = this.disposableDomains.has(domain.toLowerCase());

    return {
      isValid: !isDisposable,
      details: isDisposable ? 'Disposable email domain detected' : 'Not a disposable domain'
    };
  }

  /**
   * Checks if email is a role account
   */
  private checkRoleAccount(localPart: string): ValidationCheck {
    const isRoleAccount = this.roleAccounts.has(localPart.toLowerCase());

    return {
      isValid: !isRoleAccount,
      details: isRoleAccount ? 'Role-based email address detected' : 'Not a role-based address'
    };
  }

  /**
   * Checks for common typos in domain names
   */
  private checkTypos(domain: string): ValidationCheck & { suggestion?: string } {
    const lowerDomain = domain.toLowerCase();
    if (this.commonTypos.has(lowerDomain)) {
      const suggestion = this.commonTypos.get(lowerDomain);
      return {
        isValid: false,
        details: 'Common typo detected',
        suggestion
      };
    }

    return {
      isValid: true,
      details: 'No common typos detected'
    };
  }

  /**
   * Calculates confidence score based on all checks
   */
  private calculateConfidence(checks: {
    syntax: ValidationCheck;
    domain: ValidationCheck;
    mx: ValidationCheck;
    disposable: ValidationCheck;
    roleAccount: ValidationCheck;
    typo: ValidationCheck & { suggestion?: string };
    ipReputation?: IpReputationCheck;
    domainReputation?: DomainReputationCheck;
  }): number {
    let score = 100;

    // Deduct points for failed checks
    if (!checks.syntax.isValid) score -= 100;
    if (!checks.domain.isValid) score -= 50;
    if (!checks.mx.isValid) score -= 40;
    if (!checks.disposable.isValid) score -= 30;
    if (!checks.roleAccount.isValid) score -= 20;
    if (!checks.typo.isValid) score -= 25;

    // IP reputation impact (more severe for poor reputation)
    if (checks.ipReputation) {
      if (checks.ipReputation.reputation === 'poor') score -= 40;
      else if (checks.ipReputation.reputation === 'neutral') score -= 20;
    }

    // Domain reputation impact
    if (checks.domainReputation) {
      if (checks.domainReputation.reputation === 'poor') score -= 35;
      else if (checks.domainReputation.isSuspicious) score -= 20;
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Optional SMTP verification (use with caution)
   * WARNING: This can be slow and may be blocked by mail servers
   */
  private async verifySMTP(domain: string, email: string): Promise<ValidationCheck> {
    try {
      // Get MX records
      const mxRecords = await new Promise<any[]>((resolve, reject) => {
        dns.resolveMx(domain, (err, addresses) => {
          if (err) {
            reject(err);
          } else {
            resolve(addresses || []);
          }
        });
      });

      if (mxRecords.length === 0) {
        return {
          isValid: false,
          details: 'No MX records found for SMTP verification'
        };
      }

      // Sort by priority and try the highest priority server
      mxRecords.sort((a, b) => a.priority - b.priority);
      const mxRecord = mxRecords[0];

      // Connect to SMTP server
      const socket = new net.Socket();
      const timeout = 10000; // 10 seconds

      const result = await new Promise<ValidationCheck>((resolve) => {
        let stage = 0;
        let response = '';

        const cleanup = () => {
          socket.removeAllListeners();
          socket.destroy();
        };

        socket.setTimeout(timeout, () => {
          cleanup();
          resolve({
            isValid: false,
            details: 'SMTP connection timeout'
          });
        });

        socket.on('error', (err) => {
          cleanup();
          resolve({
            isValid: false,
            details: `SMTP connection error: ${err.message}`
          });
        });

        socket.on('data', (data) => {
          response += data.toString();

          if (response.includes('\n')) {
            const lines = response.trim().split('\n');
            const lastLine = lines[lines.length - 1];

            if (stage === 0 && lastLine.startsWith('220')) {
              // Send HELO
              socket.write('HELO example.com\r\n');
              stage = 1;
              response = '';
            } else if (stage === 1 && lastLine.startsWith('250')) {
              // Send MAIL FROM
              socket.write('MAIL FROM: <test@example.com>\r\n');
              stage = 2;
              response = '';
            } else if (stage === 2 && lastLine.startsWith('250')) {
              // Send RCPT TO
              socket.write(`RCPT TO: <${email}>\r\n`);
              stage = 3;
              response = '';
            } else if (stage === 3) {
              // Final response
              cleanup();
              const isValid = lastLine.startsWith('250');
              resolve({
                isValid,
                details: isValid ? 'Email address accepted by server' : 'Email address rejected by server'
              });
            } else if (lastLine.startsWith('4') || lastLine.startsWith('5')) {
              // Error response
              cleanup();
              resolve({
                isValid: false,
                details: `SMTP server error: ${lastLine}`
              });
            }
          }
        });

        socket.connect(25, mxRecord.exchange);
      });

      return result;
    } catch (error) {
      return {
        isValid: false,
        details: `SMTP verification failed: ${error.message}`
      };
    }
  }
}

// Interfaces for type safety
interface ValidationCheck {
  isValid: boolean;
  details: string;
}

interface IpReputationCheck extends ValidationCheck {
  reputation: 'good' | 'neutral' | 'poor' | 'unknown';
  confidence: number;
}

interface DomainReputationCheck extends ValidationCheck {
  reputation: 'good' | 'poor' | 'unknown';
  confidence: number;
  isSuspicious?: boolean;
}

interface EmailValidationResult {
  email: string;
  isValid: boolean;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
  confidence: number;
  checks?: {
    syntax?: ValidationCheck;
    domain?: ValidationCheck;
    mx?: ValidationCheck;
    disposable?: ValidationCheck;
    roleAccount?: ValidationCheck;
    typo?: ValidationCheck & { suggestion?: string };
    smtp?: ValidationCheck;
    ipReputation?: IpReputationCheck;
    domainReputation?: DomainReputationCheck;
  };
  error?: string;
}