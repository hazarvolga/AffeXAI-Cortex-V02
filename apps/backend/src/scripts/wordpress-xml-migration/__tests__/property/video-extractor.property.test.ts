/**
 * Property-Based Tests for VideoExtractor
 * 
 * **Feature: wordpress-cms-migration, Property 8: Video URL Transformation**
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */

import * as fc from 'fast-check';
import { VideoExtractor } from '../../extractors/video-extractor';

// Generator for YouTube video IDs (11 chars)
const youtubeIdArbitrary = fc.string({ minLength: 11, maxLength: 11 })
  .map(s => s.replace(/[^a-zA-Z0-9_-]/g, 'a'));

// Generator for Vimeo video IDs (numeric)
const vimeoIdArbitrary = fc.integer({ min: 1, max: 999999999 }).map(n => n.toString());

// Generator for YouTube URLs
const youtubeUrlArbitrary = fc.record({
  videoId: youtubeIdArbitrary,
  format: fc.constantFrom('watch', 'short', 'embed'),
}).map(({ videoId, format }) => {
  switch (format) {
    case 'watch': return `https://www.youtube.com/watch?v=${videoId}`;
    case 'short': return `https://youtu.be/${videoId}`;
    case 'embed': return `https://www.youtube.com/embed/${videoId}`;
    default: return `https://www.youtube.com/watch?v=${videoId}`;
  }
});

// Generator for Vimeo URLs
const vimeoUrlArbitrary = fc.record({
  videoId: vimeoIdArbitrary,
  format: fc.constantFrom('standard', 'player'),
}).map(({ videoId, format }) => {
  if (format === 'player') return `https://player.vimeo.com/video/${videoId}`;
  return `https://vimeo.com/${videoId}`;
});

describe('VideoExtractor Property Tests', () => {
  let extractor: VideoExtractor;

  beforeEach(() => {
    extractor = new VideoExtractor();
  });

  /**
   * Property 8: YouTube URL Transformation
   * All YouTube URLs should be converted to embed format
   */
  it('Property 8: YouTube URLs should be converted to embed format', () => {
    fc.assert(
      fc.property(
        youtubeUrlArbitrary,
        (url) => {
          const video = extractor.extractVideo(url);
          
          expect(video).not.toBeNull();
          expect(video!.provider).toBe('youtube');
          expect(video!.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\/embed\//);
          expect(video!.videoId.length).toBe(11);
          expect(video!.videoUrl).toContain(video!.videoId);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Vimeo URL Transformation
   * All Vimeo URLs should be converted to player format
   */
  it('Vimeo URLs should be converted to player format', () => {
    fc.assert(
      fc.property(
        vimeoUrlArbitrary,
        (url) => {
          const video = extractor.extractVideo(url);
          
          expect(video).not.toBeNull();
          expect(video!.provider).toBe('vimeo');
          expect(video!.videoUrl).toMatch(/^https:\/\/player\.vimeo\.com\/video\//);
          expect(video!.videoUrl).toContain(video!.videoId);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Embed URLs remain unchanged (idempotent)
   */
  it('embed URLs should remain unchanged', () => {
    fc.assert(
      fc.property(
        youtubeIdArbitrary,
        (videoId) => {
          const embedUrl = `https://www.youtube.com/embed/${videoId}`;
          const video = extractor.extractVideo(embedUrl);
          
          expect(video).not.toBeNull();
          expect(video!.videoUrl).toBe(embedUrl);
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Invalid URLs return null
   */
  it('invalid URLs should return null', () => {
    const invalidUrls = [
      'https://example.com/video',
      'https://google.com',
      'not-a-url',
      '',
    ];

    for (const url of invalidUrls) {
      const video = extractor.extractVideo(url);
      expect(video).toBeNull();
    }
  });
});
