import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import {
  MediaMapping,
  MediaUploadResult,
  MediaReport,
} from './types';

/**
 * MediaManager handles image uploads and URL mapping
 * Uploads images from WordPress uploads directory to CMS media library
 */
export class MediaManager {
  private mapping: MediaMapping = {};
  private uploadResults: MediaUploadResult[] = [];
  private apiBaseUrl: string;
  private uploadsDir: string;
  
  constructor(apiBaseUrl: string, uploadsDir: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.uploadsDir = uploadsDir;
  }
  
  /**
   * Upload all images from uploads directory
   * @returns Media mapping (old URL -> new URL)
   */
  async uploadAllMedia(): Promise<MediaMapping> {
    console.log('📁 Scanning uploads directory:', this.uploadsDir);
    
    // Get all image files
    const imageFiles = this.scanImageFiles(this.uploadsDir);
    console.log(`Found ${imageFiles.length} images to upload\n`);
    
    // Upload each image
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < imageFiles.length; i++) {
      const filePath = imageFiles[i];
      const fileName = path.basename(filePath);
      
      console.log(`[${i + 1}/${imageFiles.length}] Uploading ${fileName}...`);
      
      const result = await this.uploadImage(filePath);
      this.uploadResults.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`  ✓ Success: ${result.newUrl}`);
      } else {
        failureCount++;
        console.log(`  ✗ Failed: ${result.error}`);
      }
    }
    
    console.log(`\n✓ Upload complete: ${successCount} success, ${failureCount} failed`);
    
    return this.mapping;
  }
  
  /**
   * Upload single image to CMS
   * @param localPath - Local file path
   * @returns Upload result
   */
  async uploadImage(localPath: string): Promise<MediaUploadResult> {
    try {
      // Check if file exists
      if (!fs.existsSync(localPath)) {
        return {
          success: false,
          originalPath: localPath,
          error: 'File not found',
        };
      }
      
      // Read file
      const fileBuffer = fs.readFileSync(localPath);
      const fileName = path.basename(localPath);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: this.getMimeType(fileName),
      });
      
      // Upload to CMS API
      // Using 'general' module and 'other' category as fallback if MIGRATION/WORDPRESS not available
      const response = await axios.post(
        `${this.apiBaseUrl}/media/upload?module=general&category=other&tags=migration,wordpress`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30 second timeout
        }
      );
      
      // Extract new URL from response
      const newUrl = response.data.url;
      
      // Create mapping (old URL -> new URL)
      // WordPress URLs typically look like: /wp-content/uploads/2023/10/image.jpg
      const oldUrl = `/wp-content/uploads/${fileName}`;
      this.mapping[oldUrl] = newUrl;
      
      // Also map full URLs
      this.mapping[`https://aluplan.com.tr${oldUrl}`] = newUrl;
      this.mapping[`http://aluplan.com.tr${oldUrl}`] = newUrl;
      this.mapping[`https://www.aluplan.com.tr${oldUrl}`] = newUrl;
      
      return {
        success: true,
        originalPath: localPath,
        newUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        originalPath: localPath,
        error: error.message || 'Unknown error',
      };
    }
  }
  
  /**
   * Scan directory for image files
   * @param directory - Directory to scan
   * @returns Array of image file paths
   */
  private scanImageFiles(directory: string): string[] {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const imageFiles: string[] = [];
    
    if (!fs.existsSync(directory)) {
      console.warn(`⚠ Directory not found: ${directory}`);
      return imageFiles;
    }
    
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = this.scanImageFiles(filePath);
        imageFiles.push(...subFiles);
      } else {
        // Check if file is an image
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
          imageFiles.push(filePath);
        }
      }
    }
    
    return imageFiles;
  }
  
  /**
   * Get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  /**
   * Get URL mapping
   * @returns Media mapping
   */
  getMapping(): MediaMapping {
    return { ...this.mapping };
  }
  
  /**
   * Generate upload report
   * @returns Media report
   */
  generateReport(): MediaReport {
    const successResults = this.uploadResults.filter(r => r.success);
    const failureResults = this.uploadResults.filter(r => !r.success);
    
    return {
      totalImages: this.uploadResults.length,
      uploadedCount: successResults.length,
      failedCount: failureResults.length,
      skippedCount: 0,
      failures: failureResults,
      mapping: this.mapping,
    };
  }
  
  /**
   * Save mapping to file
   * @param outputPath - Output file path
   */
  saveMapping(outputPath: string): void {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(this.mapping, null, 2),
      'utf-8'
    );
    console.log(`✓ Saved media mapping to ${outputPath}`);
  }
  
  /**
   * Load mapping from file
   * @param inputPath - Input file path
   */
  loadMapping(inputPath: string): void {
    if (fs.existsSync(inputPath)) {
      const content = fs.readFileSync(inputPath, 'utf-8');
      this.mapping = JSON.parse(content);
      console.log(`✓ Loaded media mapping from ${inputPath}`);
    } else {
      console.warn(`⚠ Mapping file not found: ${inputPath}`);
    }
  }
}
