import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('crm_leads')
@Index('IDX_crm_leads_tenant_source_record', ['tenantId', 'sourceType', 'sourceRecordId'], { unique: true })
export class CrmLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 128 })
  tenantId: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ name: 'source_type', type: 'varchar', length: 32 })
  sourceType: string;

  @Column({ name: 'source_record_id', type: 'uuid' })
  sourceRecordId: string;

  @Column({ name: 'form_id', type: 'uuid', nullable: true })
  formId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
  companyName: string | null;

  @Column({ name: 'contact_name', type: 'varchar', length: 100, nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 32, default: 'new' })
  status: string;

  @Column({ name: 'source_data', type: 'jsonb', default: {} })
  sourceData: Record<string, unknown>;

  @Column({ name: 'schema_version', type: 'integer', default: 1 })
  schemaVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
