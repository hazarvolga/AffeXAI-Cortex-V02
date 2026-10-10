import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { TicketCategory } from './ticket-category.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Knowledge Base Category Entity
 * Organizes KB articles into hierarchical categories
 */
@Entity('knowledge_base_categories')
export class KnowledgeBaseCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'varchar', length: 50, default: 'blue' })
  color: string;

  @Column({ type: 'varchar', length: 50, default: 'folder' })
  icon: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Self-referencing parent-child relationship
  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ManyToOne(() => KnowledgeBaseCategory, category => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: KnowledgeBaseCategory;

  @OneToMany(() => KnowledgeBaseCategory, category => category.parent)
  children: KnowledgeBaseCategory[];

  // Article count (denormalized for performance)
  @Column({ type: 'int', default: 0 })
  articleCount: number;

  // Audit fields
  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid' })
  updatedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser: User;

  @Column({type:'uuid',name:'ticket_category_id',nullable:true})
  ticketCategoryId: string | null;

  @ManyToOne(() => TicketCategory, {nullable:true})
  @JoinColumn([{name:'ticket_category_id',referencedColumnName:'id'},{name:'tenant_id',referencedColumnName:'tenantId'}])
  ticketCategory?: TicketCategory;
}
