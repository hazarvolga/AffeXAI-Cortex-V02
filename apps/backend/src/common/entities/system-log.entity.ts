import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export enum LogContext {
  AI = 'AI',
  DATABASE = 'Database',
  AUTH = 'Auth',
  TICKET = 'Ticket',
  EMAIL = 'Email',
  CHAT = 'Chat',
  FAQ = 'FAQ',
  SETTINGS = 'Settings',
  SYSTEM = 'System',
  API = 'API',
}

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  @Index('IDX_system_logs_level')
  level: LogLevel;

  @Column({ type: 'varchar', length: 100 })
  @Index('IDX_system_logs_context')
  context: LogContext;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  stackTrace?: string;

  @Column({ type: 'integer', nullable: true })
  @Index('IDX_system_logs_user_id')
  userId?: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index('IDX_system_logs_tenant_id')
  tenantId?: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index('IDX_system_logs_created_at')
  createdAt: Date;
}
