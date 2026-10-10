import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { AiProvider, AiModel } from '../../settings/dto/ai-settings.dto';

@Entity('token_usage')
export class TokenUsage extends BaseEntity {
    @Column({ name: 'tenant_id' })
    tenantId: string;

    @Column({ type: 'enum', enum: AiProvider })
    provider: AiProvider;

    @Column({ type: 'enum', enum: AiModel })
    model: AiModel;

    @Column({ name: 'tokens_used', type: 'int' })
    tokensUsed: number;

    @Column({ name: 'cost_estimated', type: 'decimal', precision: 10, scale: 4, default: 0 })
    costEstimated: number;

    @Column({ type: 'varchar', length: 50 })
    taskType: string; // 'email', 'chat', 'analysis', etc.

    @Column({ name: 'is_local', type: 'boolean', default: false })
    isLocal: boolean; // True if processed by local Oracle server (Cost Savings!)
}
