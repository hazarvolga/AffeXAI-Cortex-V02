import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MetricType {
  VIEW = 'view',
  CLICK = 'click',
  EDIT = 'edit',
  PUBLISH = 'publish',
}

@Entity('cms_metrics')
@Index(['pageId', 'metricType', 'createdAt'])
@Index(['metricType', 'createdAt'])
export class CmsMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128, name: 'tenant_id', nullable: false })
  @Index()
  tenantId: string;

  @Column({ type: 'enum', enum: MetricType })
  @Index()
  metricType: MetricType;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  pageId: string;

  @Column({ type: 'varchar', nullable: true })
  pageTitle: string;

  @Column({ type: 'varchar', nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  linkUrl: string;

  @Column({ type: 'varchar', nullable: true })
  linkText: string;

  @Column({ type: 'varchar', nullable: true })
  visitorId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
