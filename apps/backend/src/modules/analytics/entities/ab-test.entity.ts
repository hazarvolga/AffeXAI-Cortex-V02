import {
  Entity,
  Column,
  Index,
  OneToMany,
  Relation,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { ABTestVariant } from './ab-test-variant.entity';

export enum ABTestStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export interface TargetAudience {
  countries?: string[];
  devices?: ('mobile' | 'tablet' | 'desktop')[];
  userSegments?: string[];
}

@Entity('ab_tests')
@Index(['componentId'])
@Index(['status'])
export class ABTest extends BaseEntity {

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'component_id', type: 'varchar' })
  componentId: string;

  @Column({ name: 'component_type', type: 'varchar' })
  componentType: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status: ABTestStatus;

  @Column({ name: 'period_start', type: 'timestamp' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'timestamp', nullable: true })
  periodEnd: Date | null;

  @Column({ name: 'conversion_goal', type: 'varchar' })
  conversionGoal: string;

  @Column({
    name: 'target_audience',
    type: 'jsonb',
    nullable: true,
    comment: 'Countries, devices, user segments',
  })
  targetAudience: TargetAudience | null;

  @Column('uuid', { name: 'winner_variant_id', nullable: true })
  winnerVariantId: string | null;

  @Column({
    name: 'confidence_level',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Statistical confidence (0-100)',
  })
  confidenceLevel: number | null;

  @Column({ name: 'sample_size', type: 'int', nullable: true })
  sampleSize: number | null;

  // Relations
  @OneToMany(() => ABTestVariant, (variant) => variant.test, {
    cascade: true,
  })
  variants?: Relation<ABTestVariant>[];
}
