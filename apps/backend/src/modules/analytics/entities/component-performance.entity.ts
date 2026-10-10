import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('component_performance')
@Index(['componentId', 'pageUrl'])
@Index(['periodStart', 'periodEnd'])
export class ComponentPerformance {

  @Column({ name: 'tenant_id', type: 'varchar', length: 128, nullable: true })
  @Index()
  tenantId: string;
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'component_id', type: 'varchar' })
  componentId: string;

  @Column({ name: 'component_type', type: 'varchar' })
  componentType: string;

  @Column({ name: 'page_url', type: 'varchar', length: 500 })
  pageUrl: string;

  @Column({ name: 'period_start', type: 'timestamp' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'timestamp' })
  periodEnd: Date;

  @Column({ name: 'render_time_avg', type: 'decimal', precision: 10, scale: 2, nullable: true })
  renderTimeAvg: number | null;

  @Column({ name: 'render_time_min', type: 'decimal', precision: 10, scale: 2, nullable: true })
  renderTimeMin: number | null;

  @Column({ name: 'render_time_max', type: 'decimal', precision: 10, scale: 2, nullable: true })
  renderTimeMax: number | null;

  @Column({ name: 'render_time_p50', type: 'decimal', precision: 10, scale: 2, nullable: true })
  renderTimeP50: number | null;

  @Column({ name: 'render_time_p95', type: 'decimal', precision: 10, scale: 2, nullable: true })
  renderTimeP95: number | null;

  @Column({ name: 'render_time_p99', type: 'decimal', precision: 10, scale: 2, nullable: true })
  renderTimeP99: number | null;

  @Column({ name: 'error_rate', type: 'decimal', precision: 5, scale: 4, default: 0 })
  errorRate: number;

  @Column({ name: 'total_renders', type: 'int', default: 0 })
  totalRenders: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
