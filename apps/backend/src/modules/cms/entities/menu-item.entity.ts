import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Page } from './page.entity';
import { Category } from './category.entity';
import { MenuItemType } from '@affexai/shared-types';

@Entity('cms_menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'menu_id' })
  menuId!: string;

  @ManyToOne(() => Menu, (menu) => menu.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menu_id' })
  menu!: Menu;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId!: string | null;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent!: MenuItem | null;

  @OneToMany(() => MenuItem, (menuItem) => menuItem.parent)
  children!: MenuItem[];

  @Column({ type: 'enum', enum: MenuItemType })
  type!: MenuItemType;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url!: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'page_id' })
  pageId!: string | null;

  @ManyToOne(() => Page, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'page_id' })
  page!: Page | null;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  categoryId!: string | null;

  @ManyToOne(() => Category, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  target!: '_blank' | '_self' | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'css_class' })
  cssClass!: string | null;

  @Column({ type: 'int', default: 0, name: 'order_index' })
  orderIndex!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
