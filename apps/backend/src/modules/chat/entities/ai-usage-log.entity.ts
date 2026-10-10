import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum AiProvider {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GEMINI = 'gemini',
    LOCAL = 'local',
}

@Entity('ai_usage_logs')
export class AiUsageLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({
        type: 'enum',
        enum: AiProvider,
        default: AiProvider.OPENAI
    })
    provider: string;

    @Index()
    @Column({ type: 'varchar' })
    model: string;

    @Column({ name: 'tokens_input', type: 'int', default: 0 })
    tokensInput: number;

    @Column({ name: 'tokens_output', type: 'int', default: 0 })
    tokensOutput: number;

    @Column({ name: 'total_tokens', type: 'int', default: 0 })
    totalTokens: number;

    @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
    cost: number;

    @Index()
    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId: string;

    @Index()
    @Column({ name: 'session_id', type: 'uuid', nullable: true })
    sessionId: string;

    @Column({ name: 'context_type', type: 'varchar', default: 'chat' })
    contextType: string;

    @Column({ name: 'response_time_ms', type: 'int', default: 0 })
    responseTimeMs: number;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @Index()
    @Column({ name: 'tenant_id', type: 'varchar', length: 128 })
    tenantId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
