import httpClient from './httpClient';

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

class IpReputationService {
  /**
   * Check the reputation of an IP address
   * @param ip The IP address to check
   * @returns IP reputation result
   */
  async checkIpReputation(ip: string): Promise<IpReputationResult> {
    try {
      const response = await httpClient.get<IpReputationResult>(`/email-marketing/ip-reputation/${ip}`);
      return response;
    } catch (error: any) {
      console.error('Error checking IP reputation:', error);
      throw error;
    }
  }
}

export default new IpReputationService();