import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailValidationService {
  /**
   * Validates an email address using regex pattern
   * @param email The email address to validate
   * @returns 'valid' if the email is valid, 'invalid' otherwise
   */
  validateEmailFormat(email: string): 'valid' | 'invalid' {
    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? 'valid' : 'invalid';
  }

  /**
   * Performs a more comprehensive email validation
   * This is a simplified version - in a real application, you would integrate with a service like MailerCheck
   * @param email The email address to validate
   * @returns Validation result string
   */
  async validateEmail(email: string): Promise<string> {
    // First check basic format
    if (this.validateEmailFormat(email) === 'invalid') {
      return 'invalid';
    }

    // In a real implementation, you would call an external service like MailerCheck here
    // For now, we'll return 'valid' for properly formatted emails
    // Example of how you might integrate with an external service:
    /*
    try {
      const response = await this.mailerCheckClient.verifyEmail(email);
      return response.result; // 'valid', 'invalid', 'risky', etc.
    } catch (error) {
      console.error('Email validation error:', error);
      return 'unknown';
    }
    */

    // For demonstration purposes, we'll simulate some common validation results
    const domain = email.split('@')[1];
    if (domain && domain.includes('tempmail') || domain.includes('throwaway')) {
      return 'risky';
    }

    if (domain && domain.includes('invalid')) {
      return 'invalid';
    }

    return 'valid';
  }
}