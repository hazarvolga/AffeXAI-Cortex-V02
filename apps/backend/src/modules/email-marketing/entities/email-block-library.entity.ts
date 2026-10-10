import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum BlockCategory {
  STRUCTURE = 'structure',
  CONTENT = 'content',
  MEDIA = 'media',
  SOCIAL = 'social',
  ECOMMERCE = 'ecommerce',
  INTERACTIVE = 'interactive',
  SPECIAL = 'special',
}

export enum BlockType {
  // Structure blocks
  ONE_COLUMN = 'one_column',
  TWO_COLUMN = 'two_column',
  THREE_COLUMN = 'three_column',
  TWO_COLUMN_SIDEBAR = 'two_column_sidebar',
  SPACER = 'spacer',
  DIVIDER = 'divider',

  // Content blocks
  HEADING = 'heading',
  TEXT = 'text',
  BUTTON = 'button',
  LIST = 'list',
  QUOTE = 'quote',

  // Media blocks
  IMAGE = 'image',
  IMAGE_TEXT = 'image_text',
  IMAGE_GROUP = 'image_group',
  VIDEO = 'video',
  ICON = 'icon',

  // Social blocks
  SOCIAL_LINKS = 'social_links',
  SOCIAL_SHARE = 'social_share',
  SOCIAL_FOLLOW = 'social_follow',

  // E-commerce blocks
  PRODUCT = 'product',
  PRODUCT_GRID = 'product_grid',
  PRICING_TABLE = 'pricing_table',
  COUPON = 'coupon',

  // Interactive blocks
  COUNTDOWN = 'countdown',
  RATING = 'rating',
  PROGRESS_BAR = 'progress_bar',
  ACCORDION = 'accordion',

  // Special blocks
  HEADER = 'header',
  FOOTER = 'footer',
  HTML_CODE = 'html_code',
  NAVIGATION = 'navigation',
  MENU = 'menu',
  LOGO = 'logo',
  SURVEY = 'survey',
  FORM = 'form',
}

@Entity('email_block_library')
export class EmailBlockLibrary extends BaseEntity {
  @Column({
    type: 'enum',
    enum: BlockType,
  })
  type: BlockType;

  @Column({
    type: 'enum',
    enum: BlockCategory,
  })
  category: BlockCategory;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  icon: string; // Lucide icon name

  @Column({ type: 'jsonb' })
  defaultProperties: Record<string, any>;

  @Column({ type: 'jsonb' })
  defaultStyles: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  previewHtml: string; // Preview for block library

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
