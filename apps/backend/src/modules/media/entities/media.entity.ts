import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { MediaType, StorageType, MediaModule, MediaCategory } from '@affexai/shared-types';

@Entity('media')
export class Media extends BaseEntity {
  @Column({ type: 'varchar' })
  filename: string;

  @Column({ type: 'varchar' })
  originalName: string;

  @Column({ type: 'varchar' })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'varchar', nullable: true })
  path: string;

  @Column({ type: 'varchar', nullable: true })
  url: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'image',
  })
  type: MediaType;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'local',
  })
  storageType: StorageType;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'general',
  })
  module: MediaModule;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'other',
  })
  category: MediaCategory;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', nullable: true })
  altText: string;

  @Column({ type: 'varchar', nullable: true })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}