import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PipelineStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
}

@Entity('faq_pipeline_state')
export class PipelineState {

  @Column({ type: 'uuid', nullable: true })
  @Index()
  tenantId: string;
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PipelineStatus,
    default: PipelineStatus.STOPPED,
  })
  status: PipelineStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastRun: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextScheduledRun: Date;

  @Column({ type: 'int', default: 0 })
  dailyProcessingCount: number;

  @Column({ type: 'int', default: 0 })
  totalFaqsGenerated: number;

  @Column({ type: 'jsonb', nullable: true })
  lastError: {
    message: string;
    timestamp: Date;
    stack?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  processingConfig: {
    mode: 'manual' | 'real-time' | 'batch' | 'scheduled';
    batchSize: number;
    scheduleInterval: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
