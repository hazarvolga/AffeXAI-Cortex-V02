/**
 * WordPress CMS Migration - Media Manager
 * 
 * Manages media entity creation and lookup for migrated images.
 * Uses MinIO for storage with relative paths.
 */

import { DataSource } from 'typeorm';
import { MediaType, StorageType, MediaModule, MediaCategory } from '@affexai/shared-types';
import { log } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface MediaMapping {
  [oldUrl: string]: string; // Maps old URL to new MinIO URL
}

export class MediaManager {
  private dataSource: DataSource;
  private mediaMapping: MediaMapping = {};

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Load media mapping from MIGRATION_MAPPING.json
   */
  async loadMediaMapping(mappingFilePath: string): Promise<void> {
    try {
      if (fs.existsSync(mappingFilePath)) {
        const content = fs.readFileSync(mappingFilePath, 'utf-8');
        this.mediaMapping = JSON.parse(content);
        log.info(`Loaded ${Object.keys(this.mediaMapping).length} media mappings`);
      } else {
        log.warn(`Media mapping file not found: ${mappingFilePath}`);
      }
    } catch (error) {
      log.error('Failed to load media mapping', error);
      throw error;
    }
  }

  /**
   * Get or create media entity for an image URL
   * Returns the media entity ID
   */
  async getOrCreateMediaEntity(imageUrl: string): Promise<string | null> {
    try {
      // Lookup in mapping
      const minioUrl = this.mediaMapping[imageUrl];
      if (!minioUrl) {
        log.warn(`No mapping found for image: ${imageUrl}`);
        return null;
      }

      // Extract relative path from MinIO URL
      const relativePath = this.extractRelativePath(minioUrl);
      if (!relativePath) {
        log.warn(`Could not extract relative path from: ${minioUrl}`);
        return null;
      }

      // Extract filename
      const filename = path.basename(relativePath);

      // Check if media entity already exists
      const existingMedia = await this.dataSource.query(
        `SELECT id FROM media WHERE filename = $1`,
        [filename]
      );

      if (existingMedia.length > 0) {
        log.info(`Media entity already exists: ${filename}`);
        return existingMedia[0].id;
      }

      // Create new media entity
      const result = await this.dataSource.query(
        `INSERT INTO media (id, filename, original_name, mime_type, size, url, type, storage_type, module, category, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id`,
        [
          filename,
          filename,
          this.getMimeType(filename),
          0, // Size not available from mapping
          relativePath, // Store relative path
          'image', // MediaType.IMAGE
          'cloud', // StorageType.CLOUD - MinIO is cloud storage
          'cms', // MediaModule.CMS (lowercase)
          'gallery', // MediaCategory.GALLERY - CMS gallery images
          true,
        ]
      );

      const mediaId = result[0].id;
      log.info(`Created media entity: ${filename} (${mediaId})`);

      return mediaId;
    } catch (error) {
      log.error(`Failed to get/create media entity for: ${imageUrl}`, error);
      return null;
    }
  }

  /**
   * Extract relative path from MinIO URL
   * Removes http://localhost:9007 or similar base URL
   */
  private extractRelativePath(minioUrl: string): string | null {
    try {
      // Remove protocol and host
      const url = new URL(minioUrl);
      return url.pathname; // Returns /cms-media/...
    } catch (error) {
      // If URL parsing fails, try simple string manipulation
      const match = minioUrl.match(/\/cms-media\/.+/);
      return match ? match[0] : null;
    }
  }

  /**
   * Get MIME type from filename extension
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Get media mapping statistics
   */
  getMappingStats(): { total: number; mapped: number } {
    return {
      total: Object.keys(this.mediaMapping).length,
      mapped: Object.keys(this.mediaMapping).length,
    };
  }
}
