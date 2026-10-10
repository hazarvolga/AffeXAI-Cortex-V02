import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SettingScope } from './setting.entity';

@Entity('setting_revisions')
export class SettingRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 128, nullable: true })
  tenantId: string | null;

  @Column({ type: 'varchar', length: 16 })
  scope: SettingScope;

  @Column({ type: 'bigint', default: 0 })
  revision: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
