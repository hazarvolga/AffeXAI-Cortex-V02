import { CmsService } from '../cms-service';

// Mock fetch globally
global.fetch = jest.fn();

describe('CmsService', () => {
  let cmsService: CmsService;
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    cmsService = new CmsService();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Page Methods', () => {
    it('should fetch all pages', async () => {
      const mockPages = [
        { id: '1', title: 'Page 1', slug: 'page-1' },
        { id: '2', title: 'Page 2', slug: 'page-2' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockPages),
      });

      const pages = await cmsService.getPages();
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/pages`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(pages).toEqual(mockPages);
    });

    it('should fetch pages with status filter', async () => {
      const mockPages = [{ id: '1', title: 'Draft Page', slug: 'draft-page', status: 'draft' }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockPages),
      });

      const pages = await cmsService.getPages('draft');
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/pages?status=draft`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(pages).toEqual(mockPages);
    });

    it('should fetch a single page by ID', async () => {
      const mockPage = { id: '1', title: 'Test Page', slug: 'test-page' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockPage),
      });

      const page = await cmsService.getPage('1');
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/pages/1`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(page).toEqual(mockPage);
    });

    it('should fetch a page by slug', async () => {
      const mockPage = { id: '1', title: 'Test Page', slug: 'test-page' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockPage),
      });

      const page = await cmsService.getPageBySlug('test-page');
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/pages/slug/test-page`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(page).toEqual(mockPage);
    });

    it('should create a new page', async () => {
      const newPageData = { title: 'New Page', slug: 'new-page' };
      const mockCreatedPage = { id: '1', ...newPageData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockCreatedPage),
      });

      const page = await cmsService.createPage(newPageData);
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/pages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPageData),
      });
      expect(page).toEqual(mockCreatedPage);
    });

    it('should update a page', async () => {
      const updateData = { title: 'Updated Page' };
      const mockUpdatedPage = { id: '1', title: 'Updated Page', slug: 'test-page' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUpdatedPage),
      });

      const page = await cmsService.updatePage('1', updateData);
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/pages/1`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      expect(page).toEqual(mockUpdatedPage);
    });

    it('should delete a page', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await cmsService.deletePage('1');
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/pages/1`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should publish a page', async () => {
      const mockPublishedPage = { id: '1', title: 'Test Page', slug: 'test-page', status: 'published' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockPublishedPage),
      });

      const page = await cmsService.publishPage('1');
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/pages/1/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(page).toEqual(mockPublishedPage);
    });

    it('should unpublish a page', async () => {
      const mockUnpublishedPage = { id: '1', title: 'Test Page', slug: 'test-page', status: 'draft' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUnpublishedPage),
      });

      const page = await cmsService.unpublishPage('1');
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/pages/1/unpublish`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(page).toEqual(mockUnpublishedPage);
    });
  });

  describe('Component Methods', () => {
    it('should fetch all components', async () => {
      const mockComponents = [
        { id: '1', type: 'text', pageId: '1' },
        { id: '2', type: 'button', pageId: '1' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockComponents),
      });

      const components = await cmsService.getComponents();
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/components`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(components).toEqual(mockComponents);
    });

    it('should fetch components for a specific page', async () => {
      const mockComponents = [{ id: '1', type: 'text', pageId: '1' }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockComponents),
      });

      const components = await cmsService.getComponents('1');
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/components?pageId=1`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(components).toEqual(mockComponents);
    });

    it('should fetch a single component by ID', async () => {
      const mockComponent = { id: '1', type: 'text', pageId: '1' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockComponent),
      });

      const component = await cmsService.getComponent('1');
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/components/1`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(component).toEqual(mockComponent);
    });

    it('should create a new component', async () => {
      const newComponentData = { pageId: '1', type: 'text', props: { content: 'Hello' } };
      const mockCreatedComponent = { id: '1', ...newComponentData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockCreatedComponent),
      });

      const component = await cmsService.createComponent(newComponentData);
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/components`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComponentData),
      });
      expect(component).toEqual(mockCreatedComponent);
    });

    it('should update a component', async () => {
      const updateData = { props: { content: 'Updated content' } };
      const mockUpdatedComponent = { id: '1', type: 'text', pageId: '1', props: { content: 'Updated content' } };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUpdatedComponent),
      });

      const component = await cmsService.updateComponent('1', updateData);
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/components/1`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      expect(component).toEqual(mockUpdatedComponent);
    });

    it('should delete a component', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await cmsService.deleteComponent('1');
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/components/1`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should reorder components', async () => {
      const componentIds = ['1', '2', '3'];
      const orderIndexes = [0, 1, 2];
      const mockReorderedComponents = [
        { id: '1', orderIndex: 0 },
        { id: '2', orderIndex: 1 },
        { id: '3', orderIndex: 2 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockReorderedComponents),
      });

      const components = await cmsService.reorderComponents(componentIds, orderIndexes);
      
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/cms/components/reorder`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componentIds, orderIndexes }),
      });
      expect(components).toEqual(mockReorderedComponents);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(cmsService.getPage('1')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
      });

      await expect(cmsService.getPage('1')).rejects.toThrow('Failed to parse server response');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(cmsService.getPage('1')).rejects.toThrow('Network error');
    });
  });
});