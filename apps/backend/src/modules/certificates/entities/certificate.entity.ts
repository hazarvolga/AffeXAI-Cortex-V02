import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from '../../../core/database/entities/base.entity';

export enum CertificateStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  SENT = 'sent',
  REVOKED = 'revoked',
}

@Entity('certificates')
export class Certificate extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Recipient Information (nullable for backward compatibility)
  @Column({ type: 'varchar', nullable: true })
  recipientName: string | null;

  @Column({ type: 'varchar', nullable: true })
  recipientEmail: string | null;

  @Column({ type: 'varchar', nullable: true })
  trainingTitle: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Template & Media
  @Column({ type: 'varchar', nullable: true })
  templateId: string | null;

  @Column({ type: 'varchar', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  logoMediaId: string | null; // Media ID for certificate product/subject logo

  @Column({ type: 'varchar', nullable: true })
  signatureUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null; // Custom image for certificate

  // PDF Storage
  @Column({ type: 'varchar', nullable: true })
  pdfUrl: string | null;

  // Status & Dates
  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status: CertificateStatus;

  @Column({ type: 'timestamp' })
  issuedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  validUntil: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  // Backward compatibility fields
  @Column({ type: 'varchar', nullable: true })
  name: string | null; // Maps to trainingTitle

  @Column({ type: 'date', nullable: true })
  issueDate: Date | null; // Maps to issuedAt

  @Column({ type: 'date', nullable: true })
  expiryDate: Date | null; // Maps to validUntil

  @Column({ type: 'varchar', nullable: true })
  fileUrl: string | null; // Maps to pdfUrl

  // Relations
  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', nullable: true })
  eventId: string | null;

  // Certificate number generator (computed)
  get certificateNumber(): string {
    const date = new Date(this.issuedAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const shortId = this.id.substring(0, 8).toUpperCase();
    return `ALP-TR-${year}-${month}-${shortId}`;
  }

  // Verification URL generator
  get verificationUrl(): string {
    return `/education/certification?id=${this.certificateNumber}`;
  }
}