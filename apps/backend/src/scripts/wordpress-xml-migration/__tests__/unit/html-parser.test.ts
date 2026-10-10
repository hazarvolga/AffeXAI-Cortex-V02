import { HTMLParser } from '../../parsers/html-parser';
import type { ParsedElement } from '../../types/migration.types';

describe('HTMLParser', () => {
  let parser: HTMLParser;

  beforeEach(() => {
    parser = new HTMLParser();
  });

  describe('parse', () => {
    it('should parse basic HTML with headings and paragraphs', () => {
      const html = `
        <h1>Main Title</h1>
        <p>First paragraph</p>
        <h2>Subtitle</h2>
        <p>Second paragraph</p>
      `;

      const result = parser.parse(html);

      expect(result.elements).toHaveLength(4);
      expect(result.elements[0].tagName).toBe('h1');
      expect(result.elements[0].content).toBe('Main Title');
      expect(result.elements[1].tagName).toBe('p');
      expect(result.elements[1].content).toBe('First paragraph');
    });

    it('should extract images with src attributes', () => {
      const html = `
        <img src="/images/test.jpg" alt="Test Image" />
        <img src="https://example.com/photo.png" alt="Photo" />
      `;

      const result = parser.parse(html);

      expect(result.images).toHaveLength(2);
      expect(result.images[0]).toBe('/images/test.jpg');
      expect(result.images[1]).toBe('https://example.com/photo.png');
    });

    it('should extract YouTube video URLs', () => {
      const html = `
        <p>Check out this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
        <iframe src="https://www.youtube.com/embed/abc123"></iframe>
        <a href="https://youtu.be/xyz789">Short link</a>
      `;

      const result = parser.parse(html);

      expect(result.videos.length).toBeGreaterThanOrEqual(1);
      expect(result.videos.some(v => v.includes('youtube.com') || v.includes('youtu.be'))).toBe(true);
    });

    it('should extract Vimeo video URLs', () => {
      const html = `
        <p>Watch on Vimeo: https://vimeo.com/123456789</p>
        <iframe src="https://player.vimeo.com/video/987654321"></iframe>
      `;

      const result = parser.parse(html);

      expect(result.videos.length).toBeGreaterThanOrEqual(1);
      expect(result.videos.some(v => v.includes('vimeo.com'))).toBe(true);
    });

    it('should extract button elements with text and href', () => {
      const html = `
        <a href="/contact" class="btn btn-primary">Contact Us</a>
        <button>Submit</button>
        <a href="https://example.com" class="button">Learn More</a>
      `;

      const result = parser.parse(html);

      expect(result.buttons.length).toBeGreaterThanOrEqual(2);
      expect(result.buttons[0]).toMatchObject({
        text: 'Contact Us',
        href: '/contact',
      });
      expect(result.buttons.some(b => b.text === 'Submit')).toBe(true);
    });

    it('should handle malformed HTML gracefully', () => {
      const html = `
        <h1>Unclosed heading
        <p>Missing closing tag
        <img src="test.jpg"
        <div><span>Nested unclosed
      `;

      const result = parser.parse(html);

      // Cheerio should still parse and extract what it can
      expect(result.elements.length).toBeGreaterThan(0);
      expect(result.images.length).toBeGreaterThan(0);
    });

    it('should handle empty HTML', () => {
      const html = '';

      const result = parser.parse(html);

      expect(result.elements).toHaveLength(0);
      expect(result.images).toHaveLength(0);
      expect(result.videos).toHaveLength(0);
      expect(result.buttons).toHaveLength(0);
    });

    it('should extract lists (ul/ol)', () => {
      const html = `
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <ol>
          <li>First</li>
          <li>Second</li>
        </ol>
      `;

      const result = parser.parse(html);

      const lists = result.elements.filter(el => el.tagName === 'ul' || el.tagName === 'ol');
      expect(lists.length).toBeGreaterThan(0);
    });

    it('should preserve element hierarchy', () => {
      const html = `
        <div>
          <h2>Section Title</h2>
          <p>Section content</p>
        </div>
      `;

      const result = parser.parse(html);

      // Should extract elements in order
      expect(result.elements.length).toBeGreaterThan(0);
      const section = result.elements.find(el => el.tagName === 'div');
      expect(section).toBeDefined();
      expect(section?.children.length).toBeGreaterThan(0);
    });

    it('should handle special characters in text', () => {
      const html = `
        <p>Text with &amp; ampersand &lt; less than &gt; greater than</p>
        <p>Unicode: café, naïve, 日本語</p>
      `;

      const result = parser.parse(html);

      expect(result.elements[0].content).toContain('&');
      expect(result.elements[0].content).toContain('<');
      expect(result.elements[0].content).toContain('>');
      expect(result.elements[1].content).toContain('café');
      expect(result.elements[1].content).toContain('日本語');
    });
  });
});
