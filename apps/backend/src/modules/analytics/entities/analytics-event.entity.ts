import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AnalyticsSession } from './analytics-session.entity';

export enum InteractionType {
  CLICK = 'click',
  HOVER = 'hover',
  SCROLL = 'scroll',
  FOCUS = 'focus',
  INPUT = 'input',
  SUBMIT = 'submit',
  VIEW = 'view',
  EXIT = 'exit',
}

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

@Entity('analytics_events')
@Index(['componentId', 'componentType'])
@Index(['sessionId'])
@Index(['interactionType', 'createdAt'])
@Index(['pageUrl', 'createdAt'])
export class AnalyticsEvent extends BaseEntity {

  @Column({ name: 'component_id', type: 'varchar' })
  componentId: string;

  @Column({ name: 'component_type', type: 'varchar' })
  componentType: string;

  @Column({
    name: 'interaction_type',
    type: 'varchar',
    length: 20,
  })
  interactionType: InteractionType;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'page_url', type: 'varchar', length: 500 })
  pageUrl: string;

  @Column({
    name: 'device_type',
    type: 'varchar',
    length: 20,
  })
  deviceType: DeviceType;

  @Column({ name: 'browser', type: 'varchar', nullable: true })
  browser: string | null;

  @Column({ name: 'viewport_width', type: 'int', nullable: true })
  viewportWidth: number | null;

  @Column({ name: 'viewport_height', type: 'int', nullable: true })
  viewportHeight: number | null;

  @Column({ name: 'coordinate_x', type: 'int', nullable: true })
  coordinateX: number | null;

  @Column({ name: 'coordinate_y', type: 'int', nullable: true })
  coordinateY: number | null;

  @Column({ name: 'relative_x', type: 'int', nullable: true })
  relativeX: number | null;

  @Column({ name: 'relative_y', type: 'int', nullable: true })
  relativeY: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // Relations
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User>;

  @ManyToOne(() => AnalyticsSession, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session?: Relation<AnalyticsSession>;
}
