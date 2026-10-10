/**
 * Media management types
 * Based on backend Media entity
 */

import { BaseEntity } from './common.types';

/**
 * Media type enum
 */
export enum MediaType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
}

/**
 * Storage type enum
 */
export enum StorageType {
  LOCAL = 'local',
  CLOUD = 'cloud',
  S3 = 's3',
}

/**
 * Media module enum - which module uploaded the media
 */
export enum MediaModule {
  SITE_SETTINGS = 'site-settings',
  CMS = 'cms',
  CERTIFICATES = 'certificates',
  EMAIL_MARKETING = 'email-marketing',
  TICKETS = 'tickets',
  CHAT = 'chat',
  EVENTS = 'events',
  USERS = 'users',
  GENERAL = 'general',
  MIGRATION = 'migration',
}

/**
 * Media category enum - what type of content
 */
export enum MediaCategory {
  // Site Settings
  LOGO = 'logo',
  FAVICON = 'favicon',

  // CMS
  HERO = 'hero',
  GALLERY = 'gallery',
  BANNER = 'banner',
  THUMBNAIL = 'thumbnail',
  BACKGROUND = 'background',
  ICON = 'icon',

  // Certificates
  SIGNATURE = 'signature',
  CERTIFICATE_TEMPLATE = 'certificate-template',

  // Email Marketing
  CAMPAIGN = 'campaign',
  EMAIL_HEADER = 'email-header',

  // Tickets & Chat
  ATTACHMENT = 'attachment',

  // Users
  AVATAR = 'avatar',
  PROFILE = 'profile',

  // Events
  EVENT_COVER = 'event-cover',

  // Migration
  WORDPRESS = 'wordpress',

  // General
  OTHER = 'other',
}

/**
 * Media entity
 */
export interface Media extends BaseEntity {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  type: MediaType;
  storageType: StorageType;
  module: MediaModule;
  category: MediaCategory;
  tags: string[] | null;
  altText: string | null;
  title: string | null;
  description: string | null;
  isActive: boolean;
}

/**
 * Create media DTO
 */
export interface CreateMediaDto {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  type?: MediaType;
  storageType?: StorageType;
  module?: MediaModule;
  category?: MediaCategory;
  tags?: string[];
  altText?: string;
  title?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Update media DTO
 */
export interface UpdateMediaDto {
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  type?: MediaType;
  storageType?: StorageType;
  module?: MediaModule;
  category?: MediaCategory;
  tags?: string[];
  altText?: string;
  title?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Media upload response
 */
export interface MediaUploadResponse {
  media: Media;
  uploadUrl?: string;
}

/**
 * Media query parameters
 */
export interface MediaQueryParams {
  type?: MediaType;
  storageType?: StorageType;
  module?: MediaModule;
  category?: MediaCategory;
  tags?: string[];
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}
