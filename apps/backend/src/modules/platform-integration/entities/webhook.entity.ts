import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../core/database/entities/base.entity';
import { PlatformEventType } from './platform-event.entity';

/**
 * Webhook Authentication Types
 */
export enum WebhookAuthType {
  NONE = 'none',
  BEARER = 'bearer',
  API_KEY = 'api_key',
  BASIC = 'basic',
}

/**
 * Webhook Authentication Config
 */
export interface WebhookAuthConfig {
  token?: string;      // For bearer auth
  apiKey?: string;     // For API key auth
  username?: string;   // For basic auth
  password?: string;   // For basic auth
  headerName?: string; // Custom header name for API key
}

/**
 * Webhook Entity
 * 
 * Configures external webhooks to receive platform events
 * 
 * Example Use Cases:
 * - Send events to Zapier
 * - Notify Slack when event created
 * - Update external CRM when subscriber added
 * - Trigger GitHub Actions on deployment
 */
@Entity('webhooks')
@Index('idx_webhooks_active', ['isActive'])
@Index('idx_webhooks_deleted', ['deletedAt'])
export class Webhook extends BaseEntity {
  /**
   * Webhook name
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  /**
   * Webhook URL endpoint
   */
  @Column({
    type: 'varchar',
    length: 500,
  })
  url: string;

  /**
   * Is webhook active?
   */
  @Column({
    type: 'boolean',
    default: true,
  })
  @Index()
  isActive: boolean;

  /**
   * Event types this webhook subscribes to
   * 
   * Example: ['event.created', 'certificate.issued']
   */
  @Column({
    type: 'varchar',
    array: true,
  })
  subscribedEvents: PlatformEventType[];

  /**
   * Authentication type
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'none',
  })
  authType: WebhookAuthType;

  /**
   * Authentication configuration
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  authConfig?: WebhookAuthConfig;

  /**
   * Number of retry attempts on failure
   */
  @Column({
    type: 'int',
    default: 3,
  })
  retryCount: number;

  /**
   * Delay between retries (milliseconds)
   */
  @Column({
    type: 'int',
    default: 5000,
  })
  retryDelay: number;

  /**
   * Request timeout (milliseconds)
   */
  @Column({
    type: 'int',
    default: 10000,
  })
  timeout: number;

  /**
   * Custom headers to send with webhook
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  customHeaders?: Record<string, string>;

  /**
   * Total number of webhook calls
   */
  @Column({
    type: 'int',
    default: 0,
  })
  totalCalls: number;

  /**
   * Successful webhook calls
   */
  @Column({
    type: 'int',
    default: 0,
  })
  successfulCalls: number;

  /**
   * Failed webhook calls
   */
  @Column({
    type: 'int',
    default: 0,
  })
  failedCalls: number;

  /**
   * Last time webhook was called
   */
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastCalledAt?: Date;

  /**
   * Last HTTP status code received
   */
  @Column({
    type: 'int',
    nullable: true,
  })
  lastStatus?: number;

  /**
   * Last error message (if failed)
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  lastError?: string;

  /**
   * Description/notes
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  /**
   * Check if webhook is subscribed to event type
   */
  isSubscribedTo(eventType: PlatformEventType): boolean {
    return this.subscribedEvents.includes(eventType);
  }

  /**
   * Get success rate percentage
   */
  getSuccessRate(): number {
    if (this.totalCalls === 0) return 0;
    return Math.round((this.successfulCalls / this.totalCalls) * 100);
  }

  /**
   * Record webhook call
   */
  recordCall(success: boolean, statusCode?: number, error?: string): void {
    this.totalCalls++;
    this.lastCalledAt = new Date();
    this.lastStatus = statusCode;

    if (success) {
      this.successfulCalls++;
      this.lastError = undefined;
    } else {
      this.failedCalls++;
      this.lastError = error || 'Unknown error';
    }
  }

  /**
   * Get authorization header based on auth type
   */
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.authType) {
      case WebhookAuthType.BEARER:
        if (this.authConfig?.token) {
          headers['Authorization'] = `Bearer ${this.authConfig.token}`;
        }
        break;

      case WebhookAuthType.API_KEY:
        if (this.authConfig?.apiKey) {
          const headerName = this.authConfig.headerName || 'X-API-Key';
          headers[headerName] = this.authConfig.apiKey;
        }
        break;

      case WebhookAuthType.BASIC:
        if (this.authConfig?.username && this.authConfig?.password) {
          const credentials = Buffer.from(
            `${this.authConfig.username}:${this.authConfig.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;

      case WebhookAuthType.NONE:
      default:
        // No auth headers
        break;
    }

    // Add custom headers
    if (this.customHeaders) {
      Object.assign(headers, this.customHeaders);
    }

    return headers;
  }
}
