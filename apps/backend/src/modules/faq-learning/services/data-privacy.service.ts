import { Injectable, Logger } from '@nestjs/common';

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  locations: Array<{
    type: string;
    start: number;
    end: number;
    value: string;
  }>;
  confidence: number;
}

export interface AnonymizationResult {
  originalText: string;
  anonymizedText: string;
  replacements: Array<{
    type: string;
    original: string;
    replacement: string;
  }>;
}

export interface GDPRComplianceCheck {
  isCompliant: boolean;
  issues: string[];
  recommendations: string[];
}

@Injectable()
export class DataPrivacyService {
  private readonly logger = new Logger(DataPrivacyService.name);

  private readonly PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  };

  async detectPII(text: string): Promise<PIIDetectionResult> {
    const detectedTypes: string[] = [];
    const locations: Array<{ type: string; start: number; end: number; value: string }> = [];

    for (const [type, pattern] of Object.entries(this.PII_PATTERNS)) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          detectedTypes.push(type);
          locations.push({
            type,
            start: match.index,
            end: match.index + match[0].length,
            value: match[0],
          });
        }
      }
    }

    const uniqueTypes = [...new Set(detectedTypes)];
    const hasPII = uniqueTypes.length > 0;
    const confidence = hasPII ? Math.min(95, 70 + uniqueTypes.length * 10) : 100;

    return {
      hasPII,
      detectedTypes: uniqueTypes,
      locations,
      confidence,
    };
  }

  async anonymizeText(text: string, options?: {
    preserveFormat?: boolean;
    replacementChar?: string;
  }): Promise<AnonymizationResult> {
    
    const replacementChar = options?.replacementChar || '*';
    const preserveFormat = options?.preserveFormat !== false;

    let anonymizedText = text;
    const replacements: Array<{ type: string; original: string; replacement: string }> = [];

    for (const [type, pattern] of Object.entries(this.PII_PATTERNS)) {
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        const original = match[0];
        let replacement: string;

        if (preserveFormat) {
          replacement = this.generateFormattedReplacement(original, type, replacementChar);
        } else {
          replacement = `[${type.toUpperCase()}_REDACTED]`;
        }

        anonymizedText = anonymizedText.replace(original, replacement);
        replacements.push({ type, original, replacement });
      }
    }

    return {
      originalText: text,
      anonymizedText,
      replacements,
    };
  }

  async filterSensitiveData(data: any): Promise<any> {
    if (typeof data === 'string') {
      const result = await this.anonymizeText(data);
      return result.anonymizedText;
    }

    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.filterSensitiveData(item)));
    }

    if (typeof data === 'object' && data !== null) {
      const filtered: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          filtered[key] = '[REDACTED]';
        } else {
          filtered[key] = await this.filterSensitiveData(value);
        }
      }
      return filtered;
    }

    return data;
  }

  async checkGDPRCompliance(data: {
    hasUserConsent: boolean;
    dataRetentionPeriod?: number;
    allowsDataDeletion: boolean;
    hasPrivacyPolicy: boolean;
    encryptsData: boolean;
  }): Promise<GDPRComplianceCheck> {
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!data.hasUserConsent) {
      issues.push('User consent not obtained for data processing');
      recommendations.push('Implement explicit user consent mechanism');
    }

    if (!data.dataRetentionPeriod || data.dataRetentionPeriod > 365) {
      issues.push('Data retention period exceeds recommended limit');
      recommendations.push('Set data retention period to maximum 365 days');
    }

    if (!data.allowsDataDeletion) {
      issues.push('No mechanism for user data deletion');
      recommendations.push('Implement right to be forgotten functionality');
    }

    if (!data.hasPrivacyPolicy) {
      issues.push('Privacy policy not available');
      recommendations.push('Create and publish privacy policy');
    }

    if (!data.encryptsData) {
      issues.push('Data not encrypted at rest');
      recommendations.push('Implement data encryption');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      recommendations,
    };
  }

  async sanitizeForStorage(text: string): Promise<string> {
    const piiResult = await this.detectPII(text);
    
    if (piiResult.hasPII) {
      this.logger.warn(`PII detected in text, anonymizing before storage`);
      const anonymized = await this.anonymizeText(text);
      return anonymized.anonymizedText;
    }

    return text;
  }

  async validateDataSecurity(data: any): Promise<{
    isSecure: boolean;
    vulnerabilities: string[];
    recommendations: string[];
  }> {
    
    const vulnerabilities: string[] = [];
    const recommendations: string[] = [];

    const piiCheck = await this.detectPII(JSON.stringify(data));
    if (piiCheck.hasPII) {
      vulnerabilities.push(`Contains PII: ${piiCheck.detectedTypes.join(', ')}`);
      recommendations.push('Anonymize or encrypt PII before storage');
    }

    if (typeof data === 'object' && data !== null) {
      if (data.password || data.apiKey || data.secret) {
        vulnerabilities.push('Contains sensitive credentials');
        recommendations.push('Use secure credential storage (e.g., environment variables, secrets manager)');
      }
    }

    return {
      isSecure: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations,
    };
  }

  private generateFormattedReplacement(original: string, type: string, char: string): string {
    switch (type) {
      case 'email':
        const [localPart, domain] = original.split('@');
        return `${char.repeat(localPart.length)}@${domain}`;
      
      case 'phone':
        return original.replace(/\d/g, char);
      
      case 'ssn':
        return `${char}${char}${char}-${char}${char}-${char}${char}${char}${char}`;
      
      case 'creditCard':
        const lastFour = original.slice(-4);
        return `${char.repeat(original.length - 4)}${lastFour}`;
      
      case 'ipAddress':
        const parts = original.split('.');
        return `${char.repeat(parts[0].length)}.${char.repeat(parts[1].length)}.${char.repeat(parts[2].length)}.${parts[3]}`;
      
      default:
        return char.repeat(original.length);
    }
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password',
      'apiKey',
      'secret',
      'token',
      'creditCard',
      'ssn',
      'privateKey',
      'accessToken',
      'refreshToken',
    ];

    return sensitiveFields.some(field => 
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }
}
