import { ParsedContent, MediaMapping } from './types';

/**
 * URLTransformer handles URL transformation in migrated content
 * - Updates domain (aluplan.com.tr -> aluplan.tr)
 * - Replaces media URLs using mapping
 * - Preserves relative and external URLs
 */
export class URLTransformer {
  private oldDomain: string;
  private newDomain: string;
  
  constructor(oldDomain: string = 'aluplan.com.tr', newDomain: string = 'aluplan.tr') {
    this.oldDomain = oldDomain;
    this.newDomain = newDomain;
  }
  
  /**
   * Transform all URLs in parsed content
   * @param content - Parsed content
   * @param mediaMapping - Media URL mapping
   * @returns Transformed content
   */
  transformContent(content: ParsedContent, mediaMapping: MediaMapping): ParsedContent {
    // Transform image URLs
    const transformedImages = content.images.map(img => ({
      ...img,
      originalUrl: this.transformUrl(img.originalUrl, mediaMapping),
    }));
    
    // Transform video URLs
    const transformedVideos = content.videos.map(video => ({
      ...video,
      url: this.transformUrl(video.url, mediaMapping),
    }));
    
    // Transform link URLs
    const transformedLinks = content.links.map(link => ({
      ...link,
      url: this.transformUrl(link.url, mediaMapping),
    }));
    
    // Transform URLs in sections
    const transformedSections = content.sections.map(section => {
      if (section.content) {
        section.content = this.transformObjectUrls(section.content, mediaMapping);
      }
      return section;
    });
    
    return {
      ...content,
      images: transformedImages,
      videos: transformedVideos,
      links: transformedLinks,
      sections: transformedSections,
    };
  }
  
  /**
   * Transform single URL
   * @param url - URL to transform
   * @param mediaMapping - Media URL mapping
   * @returns Transformed URL
   */
  transformUrl(url: string, mediaMapping: MediaMapping): string {
    if (!url) return url;
    
    // 1. Check if URL is in media mapping (exact match)
    if (mediaMapping[url]) {
      return mediaMapping[url];
    }
    
    // 2. Check if URL contains old domain and replace
    if (url.includes(this.oldDomain)) {
      url = this.updateDomain(url, this.oldDomain, this.newDomain);
    }
    
    // 3. Try to find media mapping by filename
    const filename = this.extractFilename(url);
    if (filename) {
      // Look for mapping that contains this filename
      for (const [oldUrl, newUrl] of Object.entries(mediaMapping)) {
        if (oldUrl.includes(filename)) {
          return newUrl;
        }
      }
    }
    
    // 4. Preserve relative URLs (starting with /)
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    
    // 5. Preserve external URLs (not aluplan domains)
    if (this.isExternalUrl(url)) {
      return url;
    }
    
    // 6. Preserve YouTube/Vimeo URLs
    if (this.isVideoUrl(url)) {
      return url;
    }
    
    return url;
  }
  
  /**
   * Update domain in URL
   * @param url - URL to update
   * @param oldDomain - Old domain
   * @param newDomain - New domain
   * @returns Updated URL
   */
  updateDomain(url: string, oldDomain: string, newDomain: string): string {
    // Handle different URL formats
    const patterns = [
      `https://${oldDomain}`,
      `http://${oldDomain}`,
      `https://www.${oldDomain}`,
      `http://www.${oldDomain}`,
      `//${oldDomain}`,
      `//www.${oldDomain}`,
    ];
    
    for (const pattern of patterns) {
      if (url.includes(pattern)) {
        return url.replace(pattern, `https://${newDomain}`);
      }
    }
    
    return url;
  }
  
  /**
   * Transform URLs in an object recursively
   * @param obj - Object to transform
   * @param mediaMapping - Media URL mapping
   * @returns Transformed object
   */
  private transformObjectUrls(obj: any, mediaMapping: MediaMapping): any {
    if (typeof obj === 'string') {
      // Check if string looks like a URL
      if (this.looksLikeUrl(obj)) {
        return this.transformUrl(obj, mediaMapping);
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.transformObjectUrls(item, mediaMapping));
    }
    
    if (obj && typeof obj === 'object') {
      const transformed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Transform URL-like keys
        if (key === 'url' || key === 'href' || key === 'src' || key === 'icon' || key === 'backgroundImage' || key === 'mediaUrl') {
          transformed[key] = this.transformUrl(value as string, mediaMapping);
        } else {
          transformed[key] = this.transformObjectUrls(value, mediaMapping);
        }
      }
      return transformed;
    }
    
    return obj;
  }
  
  /**
   * Extract filename from URL
   */
  private extractFilename(url: string): string | null {
    try {
      // Remove query string and hash
      const cleanUrl = url.split('?')[0].split('#')[0];
      
      // Get last part of path
      const parts = cleanUrl.split('/');
      const filename = parts[parts.length - 1];
      
      // Check if it has an extension
      if (filename && filename.includes('.')) {
        return filename;
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }
  
  /**
   * Check if URL is external (not aluplan domain)
   */
  private isExternalUrl(url: string): boolean {
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
      return false;
    }
    
    // Check if it's an aluplan domain
    return !url.includes('aluplan.com.tr') && !url.includes('aluplan.tr');
  }
  
  /**
   * Check if URL is a video URL (YouTube, Vimeo)
   */
  private isVideoUrl(url: string): boolean {
    return (
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('vimeo.com')
    );
  }
  
  /**
   * Check if string looks like a URL
   */
  private looksLikeUrl(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    
    return (
      str.startsWith('http://') ||
      str.startsWith('https://') ||
      str.startsWith('//') ||
      str.startsWith('/') ||
      str.includes('aluplan.com.tr') ||
      str.includes('aluplan.tr')
    );
  }
}
