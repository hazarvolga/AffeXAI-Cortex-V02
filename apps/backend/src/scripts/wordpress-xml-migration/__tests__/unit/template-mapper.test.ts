import { TemplateMapper } from '../../mappers/template-mapper';
import { DataSource } from 'typeorm';

describe('TemplateMapper', () => {
  let templateMapper: TemplateMapper;
  let mockDataSource: jest.Mocked<DataSource>;

  const mockTemplates = [
    { id: '1', name: 'Corporate Homepage', description: 'Homepage template', isActive: true },
    { id: '2', name: 'Product Landing Page', description: 'Product template', isActive: true },
    { id: '3', name: 'Services Page', description: 'Services template', isActive: true },
    { id: '4', name: 'Contact Page', description: 'Contact template', isActive: true },
    { id: '5', name: 'About Us Page', description: 'About template', isActive: true },
    { id: '6', name: 'Free Trial Signup', description: 'Trial template', isActive: true },
    { id: '7', name: 'Case Study', description: 'Case study template', isActive: true },
    { id: '8', name: 'Pricing Page', description: 'Pricing template', isActive: true },
  ];

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue(mockTemplates),
    } as any;

    templateMapper = new TemplateMapper(mockDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadTemplates', () => {
    it('should load templates from database', async () => {
      await templateMapper.loadTemplates();

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, description'),
        undefined
      );
      const stats = templateMapper.getStats();
      expect(stats.totalTemplates).toBe(8);
      expect(stats.defaultTemplate).toBe('Services Page');
    });

    it('should handle empty template list', async () => {
      mockDataSource.query = jest.fn().mockResolvedValue([]);

      await templateMapper.loadTemplates();

      const stats = templateMapper.getStats();
      expect(stats.totalTemplates).toBe(0);
      expect(stats.defaultTemplate).toBeNull();
    });

    it('should handle database errors', async () => {
      mockDataSource.query = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(templateMapper.loadTemplates()).rejects.toThrow('DB Error');
    });
  });

  describe('getTemplateForPage - Pattern Matching', () => {
    beforeEach(async () => {
      await templateMapper.loadTemplates();
    });

    it('should match homepage patterns', async () => {
      const result = await templateMapper.getTemplateForPage('Home', 'home');
      expect(result.name).toBe('Corporate Homepage');
    });

    it('should match homepage with numbers', async () => {
      const result = await templateMapper.getTemplateForPage('Home 2', 'home-2');
      expect(result.name).toBe('Corporate Homepage');
    });

    it('should match Turkish homepage', async () => {
      const result = await templateMapper.getTemplateForPage('Ana Sayfa', 'ana-sayfa');
      expect(result.name).toBe('Corporate Homepage');
    });

    it('should match product pages', async () => {
      const result = await templateMapper.getTemplateForPage('Allplan 2024', 'allplan-2024');
      expect(result.name).toBe('Product Landing Page');
    });

    it('should match product with category', async () => {
      const result = await templateMapper.getTemplateForPage('Allplan Architecture', 'allplan-architecture');
      expect(result.name).toBe('Product Landing Page');
    });

    it('should match services/features pages', async () => {
      // Pattern: /^features?-/ or title keyword 'services'
      const result = await templateMapper.getTemplateForPage('Our Services', 'features-list');
      expect(result.name).toBe('Services Page');
    });

    it('should match download pages', async () => {
      // Pattern: /^.*-download$/ with non-product title
      const result = await templateMapper.getTemplateForPage('Software Download', 'software-download');
      expect(result.name).toBe('Free Trial Signup');
    });

    it('should match trial pages by keyword', async () => {
      // Title keyword: 'trial'
      const result = await templateMapper.getTemplateForPage('Free Trial', 'some-page');
      expect(result.name).toBe('Free Trial Signup');
    });

    it('should match contact pages', async () => {
      // Pattern: /^contact-/
      const result = await templateMapper.getTemplateForPage('Contact Us', 'contact-us');
      expect(result.name).toBe('Contact Page');
    });

    it('should match Turkish contact pages', async () => {
      // Pattern: /^iletisim-/
      const result = await templateMapper.getTemplateForPage('İletişim', 'iletisim-sayfasi');
      expect(result.name).toBe('Contact Page');
    });

    it('should match project pages as Case Study', async () => {
      // Pattern: /^project-/
      const result = await templateMapper.getTemplateForPage('Project Showcase', 'project-showcase');
      expect(result.name).toBe('Case Study');
    });

    it('should match about pages', async () => {
      const result = await templateMapper.getTemplateForPage('About Us', 'about-us');
      expect(result.name).toBe('About Us Page');
    });

    it('should match Turkish about pages', async () => {
      const result = await templateMapper.getTemplateForPage('Hakkımızda', 'hakkimizda');
      expect(result.name).toBe('About Us Page');
    });
  });

  describe('getTemplateForPage - Slug Priority', () => {
    beforeEach(async () => {
      await templateMapper.loadTemplates();
    });

    it('should prefer slug pattern over title pattern', async () => {
      // Title suggests contact, but slug suggests download
      const result = await templateMapper.getTemplateForPage('Contact for Download', 'allplan-download');
      expect(result.name).toBe('Free Trial Signup');
    });

    it('should use title pattern when slug does not match', async () => {
      const result = await templateMapper.getTemplateForPage('Allplan Architecture 2024', 'some-page');
      expect(result.name).toBe('Product Landing Page');
    });
  });

  describe('getTemplateForPage - Fallback', () => {
    beforeEach(async () => {
      await templateMapper.loadTemplates();
    });

    it('should use default template for unmapped pages', async () => {
      const result = await templateMapper.getTemplateForPage('Random Page', 'random-page');
      expect(result.name).toBe('Services Page'); // Default fallback
    });

    it('should handle empty title and slug', async () => {
      const result = await templateMapper.getTemplateForPage('', '');
      expect(result.name).toBe('Services Page');
    });

    it('should use keyword fallback for service-related pages', async () => {
      const result = await templateMapper.getTemplateForPage('Our Services', 'our-services');
      expect(result.name).toBe('Services Page');
    });

    it('should use keyword fallback for product-related pages', async () => {
      const result = await templateMapper.getTemplateForPage('Product Details', 'product-details');
      expect(result.name).toBe('Product Landing Page');
    });
  });

  describe('getTemplateForPage - Case Insensitivity', () => {
    beforeEach(async () => {
      await templateMapper.loadTemplates();
    });

    it('should match regardless of case', async () => {
      const result1 = await templateMapper.getTemplateForPage('ALLPLAN 2024', 'ALLPLAN-2024');
      const result2 = await templateMapper.getTemplateForPage('allplan 2024', 'allplan-2024');
      const result3 = await templateMapper.getTemplateForPage('Allplan 2024', 'Allplan-2024');

      expect(result1.name).toBe('Product Landing Page');
      expect(result2.name).toBe('Product Landing Page');
      expect(result3.name).toBe('Product Landing Page');
    });
  });

  describe('getStats', () => {
    it('should return correct stats after loading', async () => {
      await templateMapper.loadTemplates();

      const stats = templateMapper.getStats();
      expect(stats.totalTemplates).toBe(8);
      expect(stats.defaultTemplate).toBe('Services Page');
    });

    it('should return zero stats before loading', () => {
      const stats = templateMapper.getStats();
      expect(stats.totalTemplates).toBe(0);
      expect(stats.defaultTemplate).toBeNull();
    });
  });

  describe('previewMatching', () => {
    beforeEach(async () => {
      await templateMapper.loadTemplates();
    });

    it('should preview template matching for multiple pages', () => {
      const pages = [
        { title: 'Home', slug: 'home' },
        { title: 'Allplan 2024', slug: 'allplan-2024' },
        { title: 'Contact Us', slug: 'contact-us' },
        { title: 'Random Page', slug: 'random' },
      ];

      const preview = templateMapper.previewMatching(pages);

      expect(preview.get('Corporate Homepage')).toContain('Home (home)');
      expect(preview.get('Product Landing Page')).toContain('Allplan 2024 (allplan-2024)');
      expect(preview.get('Contact Page')).toContain('Contact Us (contact-us)');
      // Random page falls back to default
      expect(preview.get('Default (Services Page)')).toContain('Random Page (random)');
    });

    it('should group pages by template', () => {
      const pages = [
        { title: 'Allplan 2024', slug: 'allplan-2024' },
        { title: 'Allplan 2025', slug: 'allplan-2025' },
        { title: 'Allplan Architecture', slug: 'allplan-architecture' },
      ];

      const preview = templateMapper.previewMatching(pages);
      const productPages = preview.get('Product Landing Page');

      expect(productPages).toHaveLength(3);
    });
  });
});
