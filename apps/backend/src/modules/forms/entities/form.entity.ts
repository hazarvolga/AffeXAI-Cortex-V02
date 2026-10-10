import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import type { FormSettings, FormStatus, FormStructure } from '@affexai/shared-types';

export type { FormSettings, FormStructure } from '@affexai/shared-types';

export interface VisibilityRule {
  fieldId: string;
  operator: "equals" | "not_equals" | "contains" | "empty" | "not_empty";
  value: any;
}

export interface LogicConfig {
  rules: {
    blockId: string;
    conditions: VisibilityRule[];
    action: "show" | "hide";
  }[];
}

@Entity("forms")
@Index('IDX_forms_tenant_id', ['tenantId', 'id'], { unique: true })
export class Form {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "jsonb" })
  structure: FormStructure;

  @Column({ type: "jsonb", nullable: true })
  settings: FormSettings;

  @Column({ type: "jsonb", nullable: true })
  logicConfig: LogicConfig;

  @Column({ default: "draft" })
  status: FormStatus;

  @Column({ default: 0 })
  submissionCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
