'use client';

import { useState } from 'react';
import axios from 'axios';

// Get backend API URL - use env variable for production support
function getBackendUrl(): string {
  // NEXT_PUBLIC_API_URL includes /api suffix
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';
  // Remove /api suffix for settings endpoint which uses /settings not /api/settings
  return apiUrl.replace(/\/api\/?$/, '');
}

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

export function useDNSVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<DomainVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyDNS = async (domain: string, provider: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await axios.get<DomainVerificationResult>(
        `${getBackendUrl()}/settings/email/verify-dns`,
        {
          params: { domain, provider }
        }
      );

      setVerificationResult(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'DNS verification failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const quickCheck = async (domain: string) => {
    try {
      const response = await axios.get(
        `${getBackendUrl()}/settings/email/quick-check-dns`,
        {
          params: { domain }
        }
      );
      return response.data;
    } catch (err) {
      console.error('Quick DNS check failed:', err);
      return { hasRecords: false, spfFound: false };
    }
  };

  return {
    verifyDNS,
    quickCheck,
    isVerifying,
    verificationResult,
    error,
  };
}
