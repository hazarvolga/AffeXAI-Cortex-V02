import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { ABTest } from './ab-test.entity';

@Entity('ab_test_variants')
@Index(['testId'])
export class ABTestVariant extends BaseEntity {

  @Column({ name: 'test_id', type: 'uuid' })
  testId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'component_config',
    type: 'jsonb',
    comment: 'Component configuration for this variant',
  })
  componentConfig: Record<string, any>;

  @Column({
    name: 'traffic_allocation',
    type: 'decimal',
    precision: 5,
    scale: 2,
    comment: 'Percentage of traffic (0-100)',
  })
  trafficAllocation: number;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  interactions: number;

  @Column({ type: 'int', default: 0 })
  conversions: number;

  @Column({
    name: 'conversion_rate',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0,
    comment: 'Conversion rate (0-1)',
  })
  conversionRate: number;

  @Column({
    name: 'average_engagement_time',
    type: 'int',
    default: 0,
    comment: 'Average engagement time in milliseconds',
  })
  averageEngagementTime: number;

  // Relations
  @ManyToOne(() => ABTest, (test) => test.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test?: Relation<ABTest>;
}
