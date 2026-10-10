import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { TemplateType } from '@affexai/shared-types';

// Re-export TemplateType for backward compatibility
export { TemplateType };

@Entity('email_templates')
export class EmailTemplate extends BaseEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({
    type: 'enum',
    enum: TemplateType,
    default: TemplateType.FILE_BASED,
  })
  type: TemplateType | string;

  @Column({ type: 'varchar', nullable: true })
  fileTemplateName: string;

  @Column({ type: 'jsonb', nullable: true })
  variables: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Email Builder columns (JSON-first architecture)
  @Column({ type: 'jsonb', nullable: true })
  structure: {
    rows: Array<{
      id: string;
      type: string;
      columns: Array<{
        id: string;
        width: string;
        blocks: Array<{
          id: string;
          type: string;
          properties: Record<string, any>;
          styles: Record<string, any>;
        }>;
      }>;
      settings: Record<string, any>;
    }>;
    settings: {
      backgroundColor?: string;
      contentWidth?: string;
      fonts?: string[];
    };
  };

  @Column({ type: 'text', nullable: true })
  compiledHtml: string;

  @Column({ type: 'text', nullable: true })
  compiledMjml: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdFrom: string; // 'scratch' | 'cloned' | 'starter-template-name'

  @Column({ type: 'boolean', default: true })
  isEditable: boolean;

}