import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ValidationJobStatus {
    QUEUED = 'queued',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('email_validation_jobs')
export class ValidationJob {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50 })
    type: 'segment' | 'group' | 'manual';

    @Column({ type: 'varchar', nullable: true })
    targetId: string; // Segment ID or Group ID

    @Column({ type: 'varchar', nullable: true })
    tenantId: string; // Multi-tenancy isolation key

    @Column({
        type: 'enum',
        enum: ValidationJobStatus,
        default: ValidationJobStatus.QUEUED,
    })
    status: ValidationJobStatus;

    @Column({ type: 'int', default: 0 })
    totalRecords: number;

    @Column({ type: 'int', default: 0 })
    processedRecords: number;

    @Column({ type: 'jsonb', default: {} })
    stats: {
        valid: number;
        risky: number;
        invalid: number;
        disposable: number;
        roleBased: number;
        syntaxError: number;
        typo: number;
    };

    @Column({ type: 'jsonb', nullable: true })
    threatTopology: {
        highRiskDomains: Array<{ domain: string; count: number }>;
        riskDistribution: Record<string, number>; // e.g., { "A1": 5, "B2": 10 } for the grid
    };

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
