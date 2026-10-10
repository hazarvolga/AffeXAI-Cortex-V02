import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("ticket_attachments")
export class TicketAttachmentEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "tenant_id", type: "varchar" }) tenantId: string;
  @Column({ name: "owner_id", type: "uuid" }) ownerId: string;
  @Column({ name: "ticket_id", type: "uuid", nullable: true }) ticketId:
    string | null;
  @Column({ name: "message_id", type: "uuid", nullable: true }) messageId:
    string | null;
  @Column({ name: "original_name", type: "varchar", length: 255 })
  originalName: string;
  @Column({ name: "storage_key", type: "uuid", unique: true })
  storageKey: string;
  @Column({ name: "mime_type", type: "varchar", length: 127 }) mimeType: string;
  @Column({ type: "integer" }) size: number;
  @Column({ type: "char", length: 64 }) sha256: string;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
