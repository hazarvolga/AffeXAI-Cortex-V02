import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('usage_records')
export class UsageRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    tenantId: string;

    @Column()
    serviceName: string; // 'strategy_service', 'social_media', etc.

    @Column()
    action: string; // 'generate_insight', 'create_post'

    @Column({ type: 'int' })
    tokensUsed: number; // Approximate token count or cost unit

    @Column('jsonb', { nullable: true })
    metadata: Record<string, any>; // { postId: '...' }

    @CreateDateColumn()
    timestamp: Date;
}
