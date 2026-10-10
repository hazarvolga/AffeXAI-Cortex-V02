import { HTMLSanitizer } from '../../utils/html-sanitizer';

describe('HTMLSanitizer', () => {
  let sanitizer: HTMLSanitizer;

  beforeEach(() => {
    sanitizer = new HTMLSanitizer();
  });

  describe('sanitize', () => {
    it('should remove script tags', () => {
      const html = '<p>Safe content</p><script>alert("xss")</script>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Safe content');
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });

    it('should remove iframe tags', () => {
      const html = '<p>Content</p><iframe src="evil.com"></iframe>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Content');
      expect(result).not.toContain('iframe');
    });

    it('should remove object and embed tags', () => {
      const html = '<p>Text</p><object data="file.swf"></object><embed src="file.swf">';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Text');
      expect(result).not.toContain('object');
      expect(result).not.toContain('embed');
    });

    it('should remove form elements', () => {
      const html = `
        <p>Content</p>
        <form action="/submit">
          <input type="text" name="field">
          <button>Submit</button>
          <select><option>Option</option></select>
          <textarea></textarea>
        </form>
      `;
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Content');
      expect(result).not.toContain('form');
      expect(result).not.toContain('input');
      expect(result).not.toContain('button');
      expect(result).not.toContain('select');
      expect(result).not.toContain('textarea');
    });

    it('should remove style tags', () => {
      const html = '<p>Text</p><style>.hidden { display: none; }</style>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Text');
      expect(result).not.toContain('style');
      expect(result).not.toContain('display');
    });
  });

  describe('unsafe attributes removal', () => {
    it('should remove onclick attributes', () => {
      const html = '<a href="#" onclick="alert(\'xss\')">Click</a>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Click');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('should remove onerror attributes', () => {
      const html = '<img src="image.jpg" onerror="alert(\'xss\')">';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('img');
      expect(result).not.toContain('onerror');
    });

    it('should remove onload attributes', () => {
      const html = '<body onload="malicious()">Content</body>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Content');
      expect(result).not.toContain('onload');
    });

    it('should remove all event handler attributes', () => {
      const html = `
        <div 
          onclick="bad()" 
          onmouseover="bad()" 
          onkeypress="bad()"
        >
          Content
        </div>
      `;
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Content');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
      expect(result).not.toContain('onkeypress');
    });
  });

  describe('javascript: URL cleaning', () => {
    it('should replace javascript: in href with #', () => {
      const html = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Link');
      expect(result).toContain('href="#"');
      expect(result).not.toContain('javascript:');
    });

    it('should handle case-insensitive javascript: URLs', () => {
      const html = '<a href="JavaScript:alert(\'xss\')">Link</a>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('href="#"');
      expect(result).not.toContain('JavaScript:');
    });

    it('should remove javascript: from img src', () => {
      const html = '<img src="javascript:alert(\'xss\')">';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('img');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('src=');
    });
  });

  describe('safe content preservation', () => {
    it('should preserve formatting tags', () => {
      const html = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('should preserve headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<h2>Subtitle</h2>');
      expect(result).toContain('<h3>Section</h3>');
    });

    it('should preserve lists', () => {
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
      const result = sanitizer.sanitize(html);

      expect(result).toContain('<ul>');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>First</li>');
    });

    it('should preserve safe links', () => {
      const html = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('Link');
    });

    it('should preserve images with safe attributes', () => {
      const html = '<img src="/image.jpg" alt="Description">';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('src="/image.jpg"');
      expect(result).toContain('alt="Description"');
    });

    it('should preserve blockquotes and code', () => {
      const html = '<blockquote>Quote</blockquote><code>code</code><pre>preformatted</pre>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('<blockquote>Quote</blockquote>');
      expect(result).toContain('<code>code</code>');
      expect(result).toContain('<pre>preformatted</pre>');
    });
  });

  describe('containsUnsafeContent', () => {
    it('should detect script tags', () => {
      const html = '<p>Text</p><script>alert("xss")</script>';
      expect(sanitizer.containsUnsafeContent(html)).toBe(true);
    });

    it('should detect iframe tags', () => {
      const html = '<iframe src="evil.com"></iframe>';
      expect(sanitizer.containsUnsafeContent(html)).toBe(true);
    });

    it('should detect onclick attributes', () => {
      const html = '<a onclick="bad()">Link</a>';
      expect(sanitizer.containsUnsafeContent(html)).toBe(true);
    });

    it('should detect javascript: URLs', () => {
      const html = '<a href="javascript:alert()">Link</a>';
      expect(sanitizer.containsUnsafeContent(html)).toBe(true);
    });

    it('should return false for safe content', () => {
      const html = '<p>Safe <strong>content</strong></p>';
      expect(sanitizer.containsUnsafeContent(html)).toBe(false);
    });

    it('should handle empty input', () => {
      expect(sanitizer.containsUnsafeContent('')).toBe(false);
      expect(sanitizer.containsUnsafeContent(null as any)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(sanitizer.sanitize('')).toBe('');
      expect(sanitizer.sanitize('   ')).toBe('');
    });

    it('should handle null/undefined input', () => {
      expect(sanitizer.sanitize(null as any)).toBe('');
      expect(sanitizer.sanitize(undefined as any)).toBe('');
    });

    it('should handle malformed HTML', () => {
      const html = '<p>Unclosed paragraph<div>Nested</p></div>';
      const result = sanitizer.sanitize(html);

      expect(result).toContain('Unclosed paragraph');
      expect(result).toContain('Nested');
    });

    it('should handle mixed safe and unsafe content', () => {
      const html = `
        <h1>Title</h1>
        <script>alert("xss")</script>
        <p onclick="bad()">Paragraph</p>
        <a href="javascript:void(0)">Link</a>
        <strong>Bold</strong>
      `;
      const result = sanitizer.sanitize(html);

      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).not.toContain('script');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('javascript:');
    });
  });

  describe('getter methods', () => {
    it('should return list of unsafe tags', () => {
      const tags = sanitizer.getUnsafeTags();
      expect(tags).toContain('script');
      expect(tags).toContain('iframe');
      expect(tags).toContain('form');
    });

    it('should return list of unsafe attributes', () => {
      const attrs = sanitizer.getUnsafeAttributes();
      expect(attrs).toContain('onclick');
      expect(attrs).toContain('onerror');
      expect(attrs).toContain('onload');
    });

    it('should return list of safe tags', () => {
      const tags = sanitizer.getSafeTags();
      expect(tags).toContain('p');
      expect(tags).toContain('strong');
      expect(tags).toContain('a');
    });
  });
});
