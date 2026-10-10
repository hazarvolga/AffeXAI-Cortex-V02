import { VideoExtractor } from '../../extractors/video-extractor';

describe('VideoExtractor', () => {
  let extractor: VideoExtractor;

  beforeEach(() => {
    extractor = new VideoExtractor();
  });

  describe('YouTube URL extraction', () => {
    it('should extract video from standard watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('dQw4w9WgXcQ');
      expect(video!.provider).toBe('youtube');
      expect(video!.videoUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should extract video from youtu.be short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('dQw4w9WgXcQ');
      expect(video!.provider).toBe('youtube');
      expect(video!.videoUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should extract video from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('dQw4w9WgXcQ');
      expect(video!.provider).toBe('youtube');
      expect(video!.videoUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should extract video from shorts URL', () => {
      const url = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('dQw4w9WgXcQ');
      expect(video!.provider).toBe('youtube');
      expect(video!.videoUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should handle YouTube URL without protocol', () => {
      const url = 'youtube.com/watch?v=dQw4w9WgXcQ';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should handle YouTube URL without www', () => {
      const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should handle YouTube URL with additional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=PLxyz';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('dQw4w9WgXcQ');
    });
  });

  describe('Vimeo URL extraction', () => {
    it('should extract video from standard Vimeo URL', () => {
      const url = 'https://vimeo.com/123456789';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('123456789');
      expect(video!.provider).toBe('vimeo');
      expect(video!.videoUrl).toBe('https://player.vimeo.com/video/123456789');
    });

    it('should extract video from Vimeo player URL', () => {
      const url = 'https://player.vimeo.com/video/123456789';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('123456789');
      expect(video!.provider).toBe('vimeo');
      expect(video!.videoUrl).toBe('https://player.vimeo.com/video/123456789');
    });

    it('should handle Vimeo URL without protocol', () => {
      const url = 'vimeo.com/123456789';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('123456789');
    });

    it('should handle Vimeo URL without www', () => {
      const url = 'https://vimeo.com/123456789';
      const video = extractor.extractVideo(url);

      expect(video).not.toBeNull();
      expect(video!.videoId).toBe('123456789');
    });
  });

  describe('Invalid URLs', () => {
    it('should return null for empty string', () => {
      const video = extractor.extractVideo('');
      expect(video).toBeNull();
    });

    it('should return null for whitespace', () => {
      const video = extractor.extractVideo('   ');
      expect(video).toBeNull();
    });

    it('should return null for non-video URL', () => {
      const video = extractor.extractVideo('https://example.com');
      expect(video).toBeNull();
    });

    it('should return null for invalid YouTube URL', () => {
      const video = extractor.extractVideo('https://www.youtube.com/invalid');
      expect(video).toBeNull();
    });

    it('should return null for malformed video ID', () => {
      const video = extractor.extractVideo('https://www.youtube.com/watch?v=abc');
      expect(video).toBeNull();
    });
  });

  describe('extractVideosFromHTML', () => {
    it('should extract multiple YouTube videos from HTML', () => {
      const html = `
        <div>
          <p>Check out this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
          <p>And this one: https://youtu.be/abc123defgh</p>
        </div>
      `;

      const videos = extractor.extractVideosFromHTML(html);

      expect(videos).toHaveLength(2);
      expect(videos[0].videoId).toBe('dQw4w9WgXcQ');
      expect(videos[1].videoId).toBe('abc123defgh');
    });

    it('should extract mixed YouTube and Vimeo videos', () => {
      const html = `
        <div>
          <p>YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
          <p>Vimeo: https://vimeo.com/123456789</p>
        </div>
      `;

      const videos = extractor.extractVideosFromHTML(html);

      expect(videos).toHaveLength(2);
      expect(videos[0].provider).toBe('youtube');
      expect(videos[1].provider).toBe('vimeo');
    });

    it('should return empty array for HTML without videos', () => {
      const html = '<div><p>No videos here</p></div>';
      const videos = extractor.extractVideosFromHTML(html);

      expect(videos).toHaveLength(0);
    });

    it('should handle empty HTML', () => {
      const videos = extractor.extractVideosFromHTML('');
      expect(videos).toHaveLength(0);
    });
  });

  describe('isVideoUrl', () => {
    it('should return true for YouTube URL', () => {
      expect(extractor.isVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should return true for Vimeo URL', () => {
      expect(extractor.isVideoUrl('https://vimeo.com/123456789')).toBe(true);
    });

    it('should return false for non-video URL', () => {
      expect(extractor.isVideoUrl('https://example.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(extractor.isVideoUrl('')).toBe(false);
    });
  });

  describe('getProvider', () => {
    it('should return youtube for YouTube URL', () => {
      expect(extractor.getProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    });

    it('should return vimeo for Vimeo URL', () => {
      expect(extractor.getProvider('https://vimeo.com/123456789')).toBe('vimeo');
    });

    it('should return null for non-video URL', () => {
      expect(extractor.getProvider('https://example.com')).toBeNull();
    });
  });

  describe('convertToEmbedUrl', () => {
    it('should convert YouTube watch URL to embed URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const embedUrl = extractor.convertToEmbedUrl(url);

      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should convert youtu.be URL to embed URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const embedUrl = extractor.convertToEmbedUrl(url);

      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should convert Vimeo URL to player URL', () => {
      const url = 'https://vimeo.com/123456789';
      const embedUrl = extractor.convertToEmbedUrl(url);

      expect(embedUrl).toBe('https://player.vimeo.com/video/123456789');
    });

    it('should return null for non-video URL', () => {
      const embedUrl = extractor.convertToEmbedUrl('https://example.com');
      expect(embedUrl).toBeNull();
    });

    it('should keep embed URL as-is', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const embedUrl = extractor.convertToEmbedUrl(url);

      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });
});
