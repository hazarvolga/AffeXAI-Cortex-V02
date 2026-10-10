export interface Product {
    id: string;
    name: string;
    tier: 'Class 01' | 'Class 02' | 'Class 03';
    price: string;
    description: string;
    features: string[];
    highlight: boolean;
    status: 'active' | 'archived';
    stats: {
        activeTenants: number;
        mrr: string;
    };
    cta: string;
}

export const MOCK_PRODUCTS: Product[] = [
    {
        id: 'p-1',
        name: 'Restricted',
        tier: 'Class 01',
        price: 'EST_AUTH_0.0', // Free
        description: 'Optimization for institutional scalability.',
        features: [
            'Core API Access',
            'Standard Latency (0.05ms)',
            'Dedicated Neural Nodes'
        ],
        highlight: false,
        status: 'active',
        stats: { activeTenants: 1240, mrr: '$0.00' },
        cta: 'Request Auth'
    },
    {
        id: 'p-2',
        name: 'Elevated',
        tier: 'Class 02',
        price: 'EST_AUTH_1.2M', // $1.2M/yr implied
        description: 'Full system capability suite with prioritized throughput.',
        features: [
            'Full Capability Suite',
            'Ultra-Low Latency (0.002ms)',
            '24/7 Priority Support'
        ],
        highlight: true,
        status: 'active',
        stats: { activeTenants: 85, mrr: '$8.5M' },
        cta: 'Initialize'
    },
    {
        id: 'p-3',
        name: 'Full System',
        tier: 'Class 03',
        price: 'EST_AUTH_NDA', // Custom
        description: 'On-premise deployment with direct kernel access.',
        features: [
            'On-Premise Deployment',
            'Unlimited Scale Parameters',
            'Direct Kernel Access'
        ],
        highlight: false,
        status: 'active',
        stats: { activeTenants: 12, mrr: '$45.0M' },
        cta: 'Contact Ops'
    }
];
