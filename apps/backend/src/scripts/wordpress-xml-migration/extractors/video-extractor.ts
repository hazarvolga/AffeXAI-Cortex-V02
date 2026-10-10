/**
 * WordPress CMS Migration - Video Extractor
 * 
 * Extracts and converts video URLs from WordPress content.
 * Supports YouTube and Vimeo.
 */

import { log } from '../utils/logger';

export interface VideoData {
  videoUrl: string;
  provider: 'youtube' | 'vimeo';
  videoId: string;
}

export class VideoExtractor {
  // YouTube URL patterns
  private readonly youtubePatterns = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Short URL: https://youtu.be/VIDEO_ID
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Short format with additional params: https://youtube.com/shorts/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  // Vimeo URL patterns
  private readonly vimeoPatterns = [
    // Standard URL: https://vimeo.com/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    // Player URL: https://player.vimeo.com/video/VIDEO_ID
    /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
  ];

  /**
   * Extract video data from URL
   */
  extractVideo(url: string): VideoData | null {
    if (!url || url.trim().length === 0) {
      return null;
    }

    // Try YouTube patterns
    const youtubeData = this.extractYouTubeVideo(url);
    if (youtubeData) {
      return youtubeData;
    }

    // Try Vimeo patterns
    const vimeoData = this.extractVimeoVideo(url);
    if (vimeoData) {
      return vimeoData;
    }

    log.warn(`Could not extract video from URL: ${url}`);
    return null;
  }

  /**
   * Extract YouTube video data
   */
  private extractYouTubeVideo(url: string): VideoData | null {
    for (const pattern of this.youtubePatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const videoId = match[1];
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        
        log.info(`Extracted YouTube video: ${videoId}`);
        
        return {
          videoUrl: embedUrl,
          provider: 'youtube',
          videoId,
        };
      }
    }

    return null;
  }

  /**
   * Extract Vimeo video data
   */
  private extractVimeoVideo(url: string): VideoData | null {
    for (const pattern of this.vimeoPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const videoId = match[1];
        const embedUrl = `https://player.vimeo.com/video/${videoId}`;
        
        log.info(`Extracted Vimeo video: ${videoId}`);
        
        return {
          videoUrl: embedUrl,
          provider: 'vimeo',
          videoId,
        };
      }
    }

    return null;
  }

  /**
   * Extract multiple videos from HTML content
   */
  extractVideosFromHTML(html: string): VideoData[] {
    const videos: VideoData[] = [];
    
    // Find all URLs in the HTML
    const urlPattern = /https?:\/\/[^\s<>"]+/g;
    const urls = html.match(urlPattern) || [];

    for (const url of urls) {
      const videoData = this.extractVideo(url);
      if (videoData) {
        videos.push(videoData);
      }
    }

    return videos;
  }

  /**
   * Check if URL is a video URL
   */
  isVideoUrl(url: string): boolean {
    return this.extractVideo(url) !== null;
  }

  /**
   * Get video provider from URL
   */
  getProvider(url: string): 'youtube' | 'vimeo' | null {
    const videoData = this.extractVideo(url);
    return videoData ? videoData.provider : null;
  }

  /**
   * Convert any video URL to embed format
   */
  convertToEmbedUrl(url: string): string | null {
    const videoData = this.extractVideo(url);
    return videoData ? videoData.videoUrl : null;
  }
}
