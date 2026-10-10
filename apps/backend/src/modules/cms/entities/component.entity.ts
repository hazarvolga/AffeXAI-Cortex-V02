import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Page } from './page.entity';
import { ReusableComponent } from './reusable-component.entity';
import { ComponentType } from '@affexai/shared-types';

@Entity('cms_components')
export class Component {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'page_id' })
  pageId!: string;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId!: string | null;

  @Column({ type: 'enum', enum: ComponentType })
  type!: ComponentType;

  // ✅ NEW: Prebuild block metadata
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'block_type' })
  blockType?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'block_category' })
  blockCategory?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'block_id' })
  blockId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'reusable_component_id' })
  reusableComponentId?: string;

  @Column({ type: 'jsonb' })
  props!: any;

  @Column({ type: 'integer', name: 'order_index', default: 0 })
  orderIndex!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Page, (page: Page) => page.components, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page!: Page;

  @OneToMany(() => Component, (component: Component) => component.parent)
  children!: Component[];

  @ManyToOne(() => Component, (component: Component) => component.children, { onDelete: 'CASCADE' })
  parent!: Component;

  @ManyToOne(() => ReusableComponent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reusable_component_id' })
  reusableComponent?: ReusableComponent;
}
