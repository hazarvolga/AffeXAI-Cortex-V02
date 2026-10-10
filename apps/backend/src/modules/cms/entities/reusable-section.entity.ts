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
import { SectionComponent } from './section-component.entity';

/**
 * Reusable Section Entity
 * Stores reusable sections (headers, footers, hero sections, feature blocks)
 * composed of multiple components
 */
@Entity('reusable_sections')
export class ReusableSection {
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

  @Column({ type: 'varchar', length: 50 })
  @Index()
  sectionType: string; // 'header', 'footer', 'hero', 'features', 'testimonials', 'pricing', 'cta', 'content', 'custom'

  @Column({ type: 'text', array: true, default: '{}' })
  @Index('IDX_reusable_sections_tags', { synchronize: false })
  tags: string[]; // Search tags

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  @Index()
  category: Category;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @Column({ type: 'jsonb', nullable: true })
  designSystem: Record<string, any>; // Design system tokens (colors, spacing, typography)

  @Column({ type: 'jsonb', nullable: true })
  layoutOptions: Record<string, any>; // Layout configuration (grid, flex, responsive breakpoints)

  @Column({ type: 'jsonb', nullable: true })
  constraints: Record<string, any>; // Usage constraints (min/max components, allowed types)

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string; // Preview image URL

  @Column({ type: 'jsonb', nullable: true })
  previewConfig: Record<string, any>; // Preview configuration (device, theme)

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
  usageCount: number; // How many times used

  @Column({ type: 'integer', default: 1 })
  version: number; // Version number

  @ManyToOne(() => ReusableSection, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_version_id' })
  parentVersion: ReusableSection;

  @Column({ type: 'uuid', nullable: true })
  parentVersionId: string;

  @OneToMany(() => ReusableSection, (section) => section.parentVersion)
  childVersions: ReusableSection[];

  @OneToMany(() => SectionComponent, (sectionComponent) => sectionComponent.section, {
    cascade: true,
  })
  components: SectionComponent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
