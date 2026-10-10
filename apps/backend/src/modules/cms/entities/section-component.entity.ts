import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ReusableSection } from './reusable-section.entity';
import { ReusableComponent } from './reusable-component.entity';

/**
 * Section Component Entity
 * Links components to sections with hierarchy and ordering
 */
@Entity('section_components')
export class SectionComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128, name: 'tenant_id', nullable: false })
  @Index()
  tenantId: string;

  @ManyToOne(() => ReusableSection, (section) => section.components, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  @Index()
  section: ReusableSection;

  @Column({ type: 'uuid' })
  sectionId: string;

  // Reference to reusable component (if using existing component)
  @ManyToOne(() => ReusableComponent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reusable_component_id' })
  @Index()
  reusableComponent: ReusableComponent;

  @Column({ type: 'uuid', nullable: true })
  reusableComponentId: string;

  // Or inline component definition (if not using reusable)
  @Column({ type: 'varchar', length: 100, nullable: true })
  componentType: string; // 'text', 'button', 'image', 'card', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  blockType: string; // Prebuilt block type if applicable

  @Column({ type: 'jsonb', default: {}, nullable: true })
  props: Record<string, any>; // Component properties (only if inline)

  // Hierarchy support (nested components)
  @ManyToOne(() => SectionComponent, (component) => component.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  @Index()
  parent: SectionComponent;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @OneToMany(() => SectionComponent, (component) => component.parent)
  children: SectionComponent[];

  // Ordering within parent
  @Column({ type: 'integer', default: 0 })
  @Index('IDX_section_components_order')
  orderIndex: number;

  // Layout-specific properties (positioning, sizing)
  @Column({ type: 'jsonb', nullable: true })
  layoutProps: Record<string, any>; // { width: '50%', padding: '1rem', etc. }

  @CreateDateColumn()
  createdAt: Date;
}
