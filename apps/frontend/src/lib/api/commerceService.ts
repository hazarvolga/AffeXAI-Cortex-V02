import { apiClient } from '../api-client';

export interface Product {
    id: string;
    name: string;
    description: string;
    active: boolean;
    metadata: Record<string, any>;
    features: string[];
    isPublic: boolean;
    stripeProductId?: string;
    prices: Price[];
}

export interface Price {
    id: string;
    amount: number;
    currency: string;
    interval: string;
    stripePriceId?: string;
    active: boolean;
}

export interface Subscription {
    id: string;
    status: 'active' | 'canceled' | 'past_due';
    price: Price & { product: Product };
    currentPeriodStart: string;
    currentPeriodEnd: string;
    stripeCustomerId?: string;
    cancelAtPeriodEnd: boolean;
}

export interface UsageLimit {
    allowed: boolean;
    remaining: number;
    limit: number;
}

export interface UsageStats {
    used: number;
    limit: number;
    remaining: number;
    periodEnd: string;
}

export interface UserLimit {
    allowed: boolean;
    remaining: number;
    limit: number;
}

export const commerceService = {
    // ── Public Catalog ──
    getProducts: async (): Promise<Product[]> => {
        const response = await apiClient.get('/commerce/products');
        return response.data;
    },

    // ── Subscription ──
    getSubscription: async (): Promise<Subscription | null> => {
        const response = await apiClient.get('/commerce/subscription');
        return response.data;
    },

    // ── Checkout (Stripe redirect) ──
    createCheckoutSession: async (priceId: string): Promise<{ url: string }> => {
        const response = await apiClient.post('/commerce/checkout', { priceId });
        return response.data;
    },

    // ── Billing Portal (Stripe redirect) ──
    getBillingPortalUrl: async (returnUrl: string): Promise<{ url: string }> => {
        const response = await apiClient.post('/commerce/portal', { returnUrl });
        return response.data;
    },

    // ── Usage Stats (tokens) ──
    getUsageStats: async (): Promise<UsageStats> => {
        const response = await apiClient.get('/commerce/usage');
        return response.data;
    },

    // ── AI Token Limits ──
    getLimits: async (): Promise<UsageLimit> => {
        const response = await apiClient.get('/commerce/limits');
        return response.data;
    },

    // ── User/Seat Limits ──
    getUserLimits: async (): Promise<UserLimit> => {
        const response = await apiClient.get('/commerce/user-limits');
        return response.data;
    },

    // ── Super Admin: Product Management ──
    getAdminProducts: async (): Promise<Product[]> => {
        const response = await apiClient.get('/commerce/admin/products');
        return response.data;
    },

    createProduct: async (data: Partial<Product> & { priceAmount: number; priceInterval?: string }): Promise<{ product: Product; price: Price }> => {
        const response = await apiClient.post('/commerce/admin/products', data);
        return response.data;
    },

    updateProduct: async (id: string, data: Partial<Product> & { priceAmount?: number }): Promise<Product> => {
        const response = await apiClient.put(`/commerce/admin/products/${id}`, data);
        return response.data;
    },

    getProductById: async (id: string): Promise<Product> => {
        const response = await apiClient.get(`/commerce/admin/products/${id}`);
        return response.data;
    },

    deleteProduct: async (id: string): Promise<{ archived: boolean; id: string }> => {
        const response = await apiClient.delete(`/commerce/admin/products/${id}`);
        return response.data;
    },

    // ── Admin / Auditor ──
    getRevenueSummary: async (): Promise<any> => {
        const response = await apiClient.get('/commerce/admin/revenue-summary');
        return response.data;
    },
    getAdminInvoices: async (): Promise<any[]> => {
        const response = await apiClient.get('/commerce/admin/invoices');
        return response.data;
    },
    getTokenEconomics: async (): Promise<any> => {
        const response = await apiClient.get('/commerce/admin/token-economics');
        return response.data;
    },

    // ── Legacy/Debug ──
    assignPlan: async (priceId: string): Promise<Subscription> => {
        const response = await apiClient.post('/commerce/assign-plan', { priceId });
        return response.data;
    },
};

