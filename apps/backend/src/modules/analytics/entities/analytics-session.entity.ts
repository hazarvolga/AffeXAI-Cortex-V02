import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AnalyticsEvent } from './analytics-event.entity';
import { DeviceType } from './analytics-event.entity';

@Entity('analytics_sessions')
@Index(['userId'])
@Index(['startTime'])
@Index(['converted', 'conversionGoal'])
export class AnalyticsSession extends BaseEntity {

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date | null;

  @Column({ type: 'int', nullable: true, comment: 'Duration in milliseconds' })
  duration: number | null;

  @Column({ name: 'pages_visited', type: 'jsonb', default: '[]' })
  pagesVisited: string[];

  @Column({ name: 'total_interactions', type: 'int', default: 0 })
  totalInteractions: number;

  @Column({
    name: 'device_type',
    type: 'varchar',
    length: 20,
  })
  deviceType: DeviceType;

  @Column({ type: 'varchar', nullable: true })
  browser: string | null;

  @Column({ type: 'varchar', nullable: true })
  os: string | null;

  @Column({ type: 'boolean', default: false })
  converted: boolean;

  @Column({ type: 'varchar', nullable: true })
  conversionGoal: string | null;

  // Relations
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @OneToMany(() => AnalyticsEvent, (event) => event.session)
  events?: Relation<AnalyticsEvent>[];
}
