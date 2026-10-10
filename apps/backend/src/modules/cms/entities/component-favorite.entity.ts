import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Component Favorite Entity
 * Allows users to bookmark reusable components, sections, and templates
 * Polymorphic association: favoritable_type + favoritable_id
 */
@Entity('component_favorites')
@Unique(['userId', 'favoritableType', 'favoritableId', 'tenantId'])
@Index('IDX_component_favorites_type_id', ['favoritableType', 'favoritableId'])
export class ComponentFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128, name: 'tenant_id', nullable: false })
  @Index()
  tenantId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  // Polymorphic association
  @Column({ type: 'varchar', length: 50 })
  @Index()
  favoritableType: string; // 'reusable_component', 'reusable_section', 'page_template'

  @Column({ type: 'uuid' })
  favoritableId: string; // ID of the favorited item

  @CreateDateColumn()
  createdAt: Date;
}
