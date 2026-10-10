import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Component Usage History Entity
 * Tracks where and when reusable content is used
 * Polymorphic associations for both source and destination
 */
@Entity('component_usage_history')
@Index('IDX_usage_history_usable', ['usableType', 'usableId'])
@Index('IDX_usage_history_used_in', ['usedInType', 'usedInId'])
export class ComponentUsageHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128, name: 'tenant_id', nullable: false })
  @Index()
  tenantId: string;

  // What was used (polymorphic)
  @Column({ type: 'varchar', length: 50 })
  usableType: string; // 'reusable_component', 'reusable_section', 'page_template'

  @Column({ type: 'uuid' })
  usableId: string; // ID of the used item

  // Where it was used (polymorphic)
  @Column({ type: 'varchar', length: 50 })
  usedInType: string; // 'page', 'section', 'template'

  @Column({ type: 'uuid' })
  usedInId: string; // ID of the destination

  // Who used it
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
