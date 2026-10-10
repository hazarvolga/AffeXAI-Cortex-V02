import { ButtonExtractor } from '../../extractors/button-extractor';

describe('ButtonExtractor', () => {
  let extractor: ButtonExtractor;

  beforeEach(() => {
    extractor = new ButtonExtractor();
  });

  describe('extractButtons', () => {
    it('should extract button from <button> tag', () => {
      const html = '<button>Click Me</button>';
      const buttons = extractor.extractButtons(html);

      expect(buttons).toHaveLength(1);
      expect(buttons[0].text).toBe('Click Me');
      expect(buttons[0].href).toBe('#');
    });

    it('should extract button from <a> with button class', () => {
      const html = '<a href="/page" class="button">Learn More</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons).toHaveLength(1);
      expect(buttons[0].text).toBe('Learn More');
      expect(buttons[0].href).toBe('/page');
    });

    it('should extract button from <a> with btn class', () => {
      const html = '<a href="/contact" class="btn btn-primary">Contact Us</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons).toHaveLength(1);
      expect(buttons[0].text).toBe('Contact Us');
      expect(buttons[0].href).toBe('/contact');
    });

    it('should extract WordPress block button', () => {
      const html = `
        <div class="wp-block-button">
          <a href="/download">Download Now</a>
        </div>
      `;
      const buttons = extractor.extractButtons(html);

      expect(buttons).toHaveLength(1);
      expect(buttons[0].text).toBe('Download Now');
      expect(buttons[0].href).toBe('/download');
    });

    it('should extract multiple buttons', () => {
      const html = `
        <a href="/page1" class="button">Button 1</a>
        <a href="/page2" class="button">Button 2</a>
        <button>Button 3</button>
      `;
      const buttons = extractor.extractButtons(html);

      expect(buttons).toHaveLength(3);
      expect(buttons[0].text).toBe('Button 1');
      expect(buttons[1].text).toBe('Button 2');
      expect(buttons[2].text).toBe('Button 3');
    });

    it('should skip buttons with no text', () => {
      const html = '<button></button><a class="button">   </a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons).toHaveLength(0);
    });

    it('should use # as default href when missing', () => {
      const html = '<a class="button">No Link</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons).toHaveLength(1);
      expect(buttons[0].href).toBe('#');
    });

    it('should extract href from parent anchor for <button>', () => {
      const html = '<a href="/page"><button>Click</button></a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons).toHaveLength(1);
      expect(buttons[0].href).toBe('/page');
    });
  });

  describe('variant detection', () => {
    it('should detect primary variant', () => {
      const html = '<a class="button primary">Primary</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].variant).toBe('primary');
    });

    it('should detect primary variant from btn-primary', () => {
      const html = '<a class="btn btn-primary">Primary</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].variant).toBe('primary');
    });

    it('should detect secondary variant', () => {
      const html = '<a class="button secondary">Secondary</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].variant).toBe('secondary');
    });

    it('should detect outline variant', () => {
      const html = '<a class="btn btn-outline">Outline</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].variant).toBe('outline');
    });

    it('should default to default variant', () => {
      const html = '<a class="button">Default</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].variant).toBe('default');
    });
  });

  describe('placeholder detection', () => {
    it('should detect "Primary Button" as placeholder', () => {
      const html = '<a class="button">Primary Button</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].isPlaceholder).toBe(true);
    });

    it('should detect "Secondary Button" as placeholder', () => {
      const html = '<a class="button">Secondary Button</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].isPlaceholder).toBe(true);
    });

    it('should detect "Click Here" as placeholder', () => {
      const html = '<a class="button">Click Here</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].isPlaceholder).toBe(true);
    });

    it('should detect "Read More" as placeholder', () => {
      const html = '<a class="button">Read More</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].isPlaceholder).toBe(true);
    });

    it('should not detect actual text as placeholder', () => {
      const html = '<a class="button">Download Our Whitepaper</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].isPlaceholder).toBe(false);
    });

    it('should be case insensitive for placeholder detection', () => {
      const html = '<a class="button">PRIMARY BUTTON</a>';
      const buttons = extractor.extractButtons(html);

      expect(buttons[0].isPlaceholder).toBe(true);
    });
  });

  describe('validateButton', () => {
    it('should validate button with text and href', () => {
      const button = {
        text: 'Click Me',
        href: '/page',
        variant: 'primary' as const,
        isPlaceholder: false,
      };

      expect(extractor.validateButton(button)).toBe(true);
    });

    it('should validate button with # href', () => {
      const button = {
        text: 'Click Me',
        href: '#',
        variant: 'primary' as const,
        isPlaceholder: false,
      };

      expect(extractor.validateButton(button)).toBe(true);
    });

    it('should reject button with empty text', () => {
      const button = {
        text: '',
        href: '/page',
        variant: 'primary' as const,
        isPlaceholder: false,
      };

      expect(extractor.validateButton(button)).toBe(false);
    });

    it('should reject button with whitespace-only text', () => {
      const button = {
        text: '   ',
        href: '/page',
        variant: 'primary' as const,
        isPlaceholder: false,
      };

      expect(extractor.validateButton(button)).toBe(false);
    });

    it('should reject button without href', () => {
      const button = {
        text: 'Click Me',
        href: '',
        variant: 'primary' as const,
        isPlaceholder: false,
      };

      expect(extractor.validateButton(button)).toBe(false);
    });
  });

  describe('getButtonStats', () => {
    it('should return correct statistics', () => {
      const buttons = [
        { text: 'Button 1', href: '/page1', variant: 'primary' as const, isPlaceholder: false },
        { text: 'Primary Button', href: '#', variant: 'primary' as const, isPlaceholder: true },
        { text: 'Button 3', href: '#', variant: 'secondary' as const, isPlaceholder: false },
        { text: 'Click Here', href: '/page2', variant: 'outline' as const, isPlaceholder: true },
      ];

      const stats = extractor.getButtonStats(buttons);

      expect(stats.total).toBe(4);
      expect(stats.withPlaceholder).toBe(2);
      expect(stats.withoutHref).toBe(2);
      expect(stats.byVariant.primary).toBe(2);
      expect(stats.byVariant.secondary).toBe(1);
      expect(stats.byVariant.outline).toBe(1);
    });

    it('should handle empty button array', () => {
      const stats = extractor.getButtonStats([]);

      expect(stats.total).toBe(0);
      expect(stats.withPlaceholder).toBe(0);
      expect(stats.withoutHref).toBe(0);
      expect(Object.keys(stats.byVariant)).toHaveLength(0);
    });
  });

  describe('groupAdjacentButtons', () => {
    it('should group all buttons together', () => {
      const buttons = [
        { text: 'Button 1', href: '/page1', variant: 'primary' as const, isPlaceholder: false },
        { text: 'Button 2', href: '/page2', variant: 'secondary' as const, isPlaceholder: false },
      ];

      const groups = extractor.groupAdjacentButtons(buttons);

      expect(groups).toHaveLength(1);
      expect(groups[0]).toHaveLength(2);
    });

    it('should handle empty button array', () => {
      const groups = extractor.groupAdjacentButtons([]);

      expect(groups).toHaveLength(0);
    });
  });
});
