export enum MediaType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum StorageType {
  LOCAL = 'local',
  CLOUD = 'cloud',
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  storageType: StorageType;
  altText?: string;
  title?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMediaDto {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  storageType: StorageType;
  altText?: string;
  title?: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateMediaDto {
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  type?: MediaType;
  storageType?: StorageType;
  altText?: string;
  title?: string;
  description?: string;
  isActive?: boolean;
}