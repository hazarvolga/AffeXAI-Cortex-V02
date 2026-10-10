import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Form } from "./form.entity";

@Entity("form_submissions")
export class FormSubmission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tenantId: string;

  @Column()
  formId: string;

  @ManyToOne(() => Form, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: "tenantId", referencedColumnName: "tenantId" },
    { name: "formId", referencedColumnName: "id" },
  ])
  form: Form;

  @Column({ type: "jsonb" })
  data: Record<string, unknown>;

  @Column({ nullable: true })
  submittedBy: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ length: 80, nullable: true })
  idempotencyKey: string | null;

  @Column({ length: 64, nullable: true })
  payloadHash: string | null;

  @CreateDateColumn()
  submittedAt: Date;
}
