import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SettingScope } from './setting.entity';

@Entity('setting_audit_logs')
export class SettingAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 128, nullable: true })
  tenantId: string | null;

  @Column({ type: 'varchar', length: 16 })
  scope: SettingScope;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ type: 'bigint' })
  revision: number;

  @Column({ name: 'changed_keys', type: 'text', array: true })
  changedKeys: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
