import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Reusable Component Entity
 * Stores atomic reusable UI components (buttons, cards, forms, etc.)
 */
@Entity('reusable_components')
export class ReusableComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128, name: 'tenant_id', nullable: false })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  componentType: string; // 'text', 'button', 'image', 'card', 'form', 'block', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  blockType: string; // If using prebuilt block: 'hero-1', 'feature-grid', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  blockCategory: string; // 'hero', 'features', 'testimonials', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  blockId: string; // Reference to prebuild block config ID (e.g., 'hero-gradient-1', 'feature-grid-3-col')

  @Column({ type: 'jsonb', default: {} })
  props: Record<string, any>; // Component properties (styles, content, config)

  @Column({ type: 'text', array: true, default: '{}' })
  @Index('IDX_reusable_components_tags', { synchronize: false })
  tags: string[]; // Search tags

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  @Index()
  category: Category;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @Column({ type: 'jsonb', nullable: true })
  designTokens: Record<string, any>; // Design system tokens used

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string; // Preview image URL

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_id' })
  @Index()
  author: User;

  @Column({ type: 'uuid', nullable: true })
  authorId: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  isPublic: boolean; // Visible to all users

  @Column({ type: 'boolean', default: false })
  @Index()
  isFeatured: boolean; // Featured in library

  @Column({ type: 'integer', default: 0 })
  @Index()
  usageCount: number; // How many times used

  @Column({ type: 'integer', default: 1 })
  version: number; // Version number

  @ManyToOne(() => ReusableComponent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_version_id' })
  parentVersion: ReusableComponent;

  @Column({ type: 'uuid', nullable: true })
  parentVersionId: string;

  @OneToMany(() => ReusableComponent, (component) => component.parentVersion)
  childVersions: ReusableComponent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
