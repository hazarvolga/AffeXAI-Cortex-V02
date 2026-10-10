import httpClient from './httpClient';

interface EmailValidationResult {
  email: string;
  isValid: boolean;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
  confidence: number;
  checks?: {
    syntax?: { isValid: boolean; details: string };
    domain?: { isValid: boolean; details: string };
    mx?: { isValid: boolean; details: string };
    disposable?: { isValid: boolean; details: string };
    roleAccount?: { isValid: boolean; details: string };
    typo?: { isValid: boolean; details: string; suggestion?: string };
    ipReputation?: { isValid: boolean; details: string; reputation: string; confidence: number };
    domainReputation?: { isValid: boolean; details: string; reputation: string; confidence: number };
  };
  error?: string;
}

class EmailValidationService {
  async validateEmail(email: string, ip?: string): Promise<EmailValidationResult> {
    try {
      const params = new URLSearchParams({ email });
      if (ip) {
        params.append('ip', ip);
      }
      
      const response = await httpClient.get<EmailValidationResult>(
        `/email-marketing/subscribers/validate-email?${params.toString()}`
      );
      return response;
    } catch (error: any) {
      console.error('Error validating email:', error);
      return {
        email,
        isValid: false,
        status: 'unknown',
        confidence: 0,
        error: error.message || 'Validation failed'
      };
    }
  }
}

export default new EmailValidationService();