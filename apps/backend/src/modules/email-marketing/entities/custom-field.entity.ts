import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum CustomFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT'
}

@Entity('custom_fields')
export class CustomField extends BaseEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'enum', enum: CustomFieldType })
  type: CustomFieldType;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'json', nullable: true })
  options: string[]; // For SELECT and MULTI_SELECT types

  @Column({ type: 'varchar', nullable: true })
  defaultValue: string;

  @Column({ type: 'varchar', nullable: true })
  placeholder: string;

  @Column({ type: 'json', nullable: true })
  validation: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}