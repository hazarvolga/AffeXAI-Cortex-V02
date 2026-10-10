import { apiClient } from '@/lib/api-client';

export interface TrustMetrics {
    trustIndex: number;
    components: {
        resonance: number;
        convergence: number;
        friction: number;
    };
    forecast: {
        current: number[];
        projected: number[];
    };
    status: 'Elite' | 'Strong' | 'Moderate' | 'Vulnerable';
}

export const trustService = {
    async getMetrics(): Promise<TrustMetrics> {
        return apiClient.get<TrustMetrics>('/trust/metrics');
    }
};
