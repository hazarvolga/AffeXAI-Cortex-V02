/**
 * Notification types
 * Based on backend Notification entity
 */

import { BaseEntity } from './common.types';

/**
 * Notification type enum
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Notification entity
 */
export interface Notification extends BaseEntity {
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata: Record<string, any>;
}

/**
 * Create notification DTO
 */
export interface CreateNotificationDto {
  userId?: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

/**
 * Update notification DTO
 */
export interface UpdateNotificationDto {
  isRead?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Notification query parameters
 */
export interface NotificationQueryParams {
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  limit?: number;
}
