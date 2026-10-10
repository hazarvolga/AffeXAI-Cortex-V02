export interface NeuralSignal {
    tenantId: string;
    source: 'tickets' | 'social' | 'email' | 'forms' | 'system';
    type: string;
    successScore?: number; // Positive for rewards, negative for penalties
    context?: string;      // Natural language explanation/context
    data?: any;           // Raw metadata
    timestamp?: Date;
}
