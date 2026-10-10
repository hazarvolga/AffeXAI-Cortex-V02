import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  type: string;
}

@Entity('analytics_heatmaps')
@Index(['componentId', 'pageUrl'])
@Index(['periodStart', 'periodEnd'])
export class AnalyticsHeatmap extends BaseEntity {

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

  @Column({
    type: 'jsonb',
    comment: 'Array of {x, y, intensity, type}',
  })
  points: HeatmapPoint[];

  @Column({ name: 'dimension_width', type: 'int' })
  dimensionWidth: number;

  @Column({ name: 'dimension_height', type: 'int' })
  dimensionHeight: number;

  @Column({ name: 'total_interactions', type: 'int', default: 0 })
  totalInteractions: number;

  @Column({ name: 'unique_users', type: 'int', default: 0 })
  uniqueUsers: number;
}
