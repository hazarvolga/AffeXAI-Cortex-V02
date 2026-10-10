/**
 * Unit Tests for Validator
 * Tests specific validation scenarios and edge cases
 */

import { Validator } from '../Validator';
import { Logger, LogLevel } from '../Logger';
import { ParsedContent, ImageReference, MediaMapping } from '../types';

describe('Validator - Unit Tests', () => {
  let validator: Validator;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger(LogLevel.QUIET);
    validator = new Validator('http://localhost:9006/api', logger);
  });

  describe('validateContent - Required Fields', () => {
    it('should reject content with empty title', () => {
      const content: ParsedContent = {
        title: '',
        slug: 'valid-slug',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('title');
      expect(result.errors[0].severity).toBe('critical');
    });

    it('should reject content with empty slug', () => {
      const content: ParsedContent = {
        title: 'Valid Title',
        slug: '',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('slug');
      expect(result.errors[0].severity).toBe('critical');
    });

    it('should reject content with both empty title and slug', () => {
      const content: ParsedContent = {
        title: '',
        slug: '',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      
      const titleError = result.errors.find(e => e.field === 'title');
      const slugError = result.errors.find(e => e.field === 'slug');
      
      expect(titleError).toBeDefined();
      expect(slugError).toBeDefined();
    });

    it('should accept content with valid title and slug', () => {
      const content: ParsedContent = {
        title: 'Valid Page Title',
        slug: 'valid-page-slug',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      // Should not have critical errors
      const criticalErrors = result.errors.filter(e => e.severity === 'critical');
      expect(criticalErrors).toHaveLength(0);
    });
  });

  describe('validateContent - Slug Format', () => {
    it('should reject slug with uppercase letters', () => {
      const content: ParsedContent = {
        title: 'Valid Title',
        slug: 'Invalid-Slug-With-Uppercase',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      const slugError = result.errors.find(e => e.field === 'slug');
      expect(slugError).toBeDefined();
      expect(slugError?.message).toContain('lowercase');
    });

    it('should reject slug with spaces', () => {
      const content: ParsedContent = {
        title: 'Valid Title',
        slug: 'invalid slug with spaces',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      const slugError = result.errors.find(e => e.field === 'slug');
      expect(slugError).toBeDefined();
    });

    it('should reject slug with special characters', () => {
      const content: ParsedContent = {
        title: 'Valid Title',
        slug: 'invalid@slug#with$special',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      const slugError = result.errors.find(e => e.field === 'slug');
      expect(slugError).toBeDefined();
    });

    it('should accept slug with lowercase letters, numbers, and hyphens', () => {
      const content: ParsedContent = {
        title: 'Valid Title',
        slug: 'valid-slug-123',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      const slugError = result.errors.find(e => e.field === 'slug');
      expect(slugError).toBeUndefined();
    });
  });

  describe('validateContent - Warnings', () => {
    it('should warn about long titles', () => {
      const longTitle = 'A'.repeat(250);
      const content: ParsedContent = {
        title: longTitle,
        slug: 'valid-slug',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      const titleWarning = result.warnings.find(w => w.field === 'title');
      expect(titleWarning).toBeDefined();
      expect(titleWarning?.message).toContain('longer than 200');
    });

    it('should warn about missing sections', () => {
      const content: ParsedContent = {
        title: 'Valid Title',
        slug: 'valid-slug',
        sections: [],
        images: [],
        videos: [],
        links: [],
        metadata: { filename: 'test.txt' },
      };

      const result = validator.validateContent(content);

      const sectionsWarning = result.warnings.find(w => w.field === 'sections');
      expect(sectionsWarning).toBeDefined();
    });
  });

  describe('validateComponentProps - Hero Block', () => {
    it('should reject hero block without title', () => {
      const props = {
        subtitle: 'Valid subtitle',
        description: 'Valid description',
      };

      const result = validator.validateComponentProps('hero-centered-bg-image', props);

      expect(result.isValid).toBe(false);
      const titleError = result.errors.find(e => e.field === 'props.title');
      expect(titleError).toBeDefined();
    });

    it('should reject hero block with non-string backgroundImage', () => {
      const props = {
        title: 'Valid Title',
        backgroundImage: 123, // Invalid: should be string
      };

      const result = validator.validateComponentProps('hero-centered-bg-image', props);

      expect(result.isValid).toBe(false);
      const bgError = result.errors.find(e => e.field === 'props.backgroundImage');
      expect(bgError).toBeDefined();
    });

    it('should accept valid hero block props', () => {
      const props = {
        title: 'Hero Title',
        subtitle: 'Hero Subtitle',
        description: 'Hero Description',
        backgroundImage: 'https://example.com/image.jpg',
        buttons: [
          { text: 'Learn More', url: '/learn' },
        ],
      };

      const result = validator.validateComponentProps('hero-centered-bg-image', props);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateComponentProps - Features Block', () => {
    it('should reject features block without features array', () => {
      const props = {
        title: 'Features',
      };

      const result = validator.validateComponentProps('features-grid', props);

      expect(result.isValid).toBe(false);
      const featuresError = result.errors.find(e => e.field === 'props.features');
      expect(featuresError).toBeDefined();
    });

    it('should reject features with missing titles', () => {
      const props = {
        features: [
          { description: 'Feature description' }, // Missing title
        ],
      };

      const result = validator.validateComponentProps('features-grid', props);

      expect(result.isValid).toBe(false);
      const titleError = result.errors.find(e => e.field.includes('features[0].title'));
      expect(titleError).toBeDefined();
    });

    it('should accept valid features block', () => {
      const props = {
        features: [
          { title: 'Feature 1', description: 'Description 1', icon: 'icon1' },
          { title: 'Feature 2', description: 'Description 2', icon: 'icon2' },
        ],
      };

      const result = validator.validateComponentProps('features-grid', props);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateComponentProps - Workflow Tabs', () => {
    it('should reject workflow tabs without mainTabs', () => {
      const props = {
        title: 'Workflow',
      };

      const result = validator.validateComponentProps('workflow-tabs', props);

      expect(result.isValid).toBe(false);
      const tabsError = result.errors.find(e => e.field === 'props.mainTabs');
      expect(tabsError).toBeDefined();
    });

    it('should reject tabs without id', () => {
      const props = {
        mainTabs: [
          { label: 'Tab 1' }, // Missing id
        ],
      };

      const result = validator.validateComponentProps('workflow-tabs', props);

      expect(result.isValid).toBe(false);
      const idError = result.errors.find(e => e.field.includes('mainTabs[0].id'));
      expect(idError).toBeDefined();
    });

    it('should accept valid workflow tabs', () => {
      const props = {
        mainTabs: [
          {
            id: 'tab1',
            label: 'Tab 1',
            icon: 'icon1',
            subTabs: [],
          },
        ],
      };

      const result = validator.validateComponentProps('workflow-tabs', props);

      expect(result.isValid).toBe(true);
    });
  });

  describe('checkBrokenImages', () => {
    it('should detect images not in media mapping', () => {
      const images: ImageReference[] = [
        {
          originalUrl: 'https://old-site.com/image1.jpg',
          altText: 'Image 1',
          context: 'hero',
        },
        {
          originalUrl: 'https://old-site.com/image2.jpg',
          altText: 'Image 2',
          context: 'feature-1',
        },
      ];

      const mediaMapping: MediaMapping = {};

      const result = validator.checkBrokenImages(images, mediaMapping);

      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
      expect(result.warnings[0].message).toContain('not found in media mapping');
    });

    it('should not warn about images in media mapping', () => {
      const images: ImageReference[] = [
        {
          originalUrl: 'https://old-site.com/image1.jpg',
          altText: 'Image 1',
          context: 'hero',
        },
      ];

      const mediaMapping: MediaMapping = {
        'https://old-site.com/image1.jpg': 'https://new-cms.com/media/image1.jpg',
      };

      const result = validator.checkBrokenImages(images, mediaMapping);

      const missingWarnings = result.warnings.filter(w => 
        w.message.includes('not found in media mapping')
      );
      expect(missingWarnings).toHaveLength(0);
    });

    it('should reject images with empty URLs', () => {
      const images: ImageReference[] = [
        {
          originalUrl: '',
          altText: 'Image',
          context: 'hero',
        },
      ];

      const mediaMapping: MediaMapping = {};

      const result = validator.checkBrokenImages(images, mediaMapping);

      expect(result.isValid).toBe(false);
      const emptyUrlError = result.errors.find(e => 
        e.field === 'image.originalUrl' && e.message.includes('empty')
      );
      expect(emptyUrlError).toBeDefined();
    });

    it('should accept relative URLs', () => {
      const images: ImageReference[] = [
        {
          originalUrl: '/uploads/image.jpg',
          altText: 'Image',
          context: 'hero',
        },
      ];

      const mediaMapping: MediaMapping = {};

      const result = validator.checkBrokenImages(images, mediaMapping);

      // Should not have errors about invalid URL format
      const invalidUrlErrors = result.errors.filter(e => 
        e.message.includes('invalid')
      );
      expect(invalidUrlErrors).toHaveLength(0);
    });
  });

  describe('generateValidationReport', () => {
    it('should generate comprehensive validation report', () => {
      const contentValidation = {
        isValid: false,
        errors: [
          { field: 'title', message: 'Title is required', severity: 'critical' as const },
        ],
        warnings: [
          { field: 'sections', message: 'No sections found' },
        ],
      };

      const imageValidation = {
        isValid: true,
        errors: [],
        warnings: [
          { field: 'image', message: 'Image not in mapping', context: 'hero' },
        ],
      };

      const report = validator.generateValidationReport(
        contentValidation,
        imageValidation
      );

      expect(report).toContain('Validation Report');
      expect(report).toContain('Content Validation');
      expect(report).toContain('Image Validation');
      expect(report).toContain('Title is required');
      expect(report).toContain('No sections found');
      expect(report).toContain('Image not in mapping');
    });

    it('should include page verification in report', () => {
      const contentValidation = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const imageValidation = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const pageVerification = {
        pageId: 'test-page-123',
        exists: true,
        isAccessible: true,
        componentCount: 5,
        errors: [],
      };

      const report = validator.generateValidationReport(
        contentValidation,
        imageValidation,
        pageVerification
      );

      expect(report).toContain('Page Verification');
      expect(report).toContain('test-page-123');
      expect(report).toContain('Components: 5');
    });
  });
});
