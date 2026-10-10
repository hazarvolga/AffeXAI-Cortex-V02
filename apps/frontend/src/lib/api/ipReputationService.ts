import { httpClient } from './http-client';

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
 * IP Reputation Service
 * Handles IP reputation checking operations
 */
class IpReputationService {
  /**
   * Check the reputation of an IP address
   * @param ip The IP address to check
   * @returns IP reputation result
   */
  async checkIpReputation(ip: string): Promise<IpReputationResult> {
    try {
      const response = await httpClient.getWrapped<IpReputationResult>(`/email-marketing/ip-reputation/${ip}`);
      return response;
    } catch (error: any) {
      console.error('Error checking IP reputation:', error);
      throw error;
    }
  }
}

export const ipReputationService = new IpReputationService();
export default ipReputationService;