export interface NeuralSignal {
    tenantId: string;
    source: 'tickets' | 'social' | 'email' | 'forms' | 'system' | 'crawler';
    type: string;
    successScore?: number; // Positive for rewards, negative for penalties
    context?: string;      // Natural language explanation/context
    content?: string;      // Raw content body
    data?: any;           // Raw metadata
    metadata?: any;       // Structured metadata
    timestamp?: Date;
}
