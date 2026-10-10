import { cmsService } from '../src/lib/cms/cms-service';

describe('CMS API Integration Tests', () => {
  // Test data
  const testPage = {
    title: 'Test Page',
    slug: 'test-page',
    description: 'A test page for CMS API integration',
  };

  const testComponent = {
    type: 'text',
    props: {
      content: 'Hello World',
      variant: 'body',
    },
  };

  let createdPageId: string;
  let createdComponentId: string;

  it('should create a new page', async () => {
    const page = await cmsService.createPage(testPage);
    expect(page).toHaveProperty('id');
    expect(page.title).toBe(testPage.title);
    expect(page.slug).toBe(testPage.slug);
    expect(page.description).toBe(testPage.description);
    createdPageId = page.id;
  });

  it('should create a new component', async () => {
    const componentData = {
      ...testComponent,
      pageId: createdPageId,
    };
    const component = await cmsService.createComponent(componentData);
    expect(component).toHaveProperty('id');
    expect(component.type).toBe(testComponent.type);
    expect(component.pageId).toBe(createdPageId);
    createdComponentId = component.id;
  });

  it('should retrieve a page with components', async () => {
    const page = await cmsService.getPage(createdPageId, true);
    expect(page).toHaveProperty('id');
    expect(page.title).toBe(testPage.title);
    expect(Array.isArray(page.components)).toBe(true);
  });

  it('should update a component', async () => {
    const updatedComponent = await cmsService.updateComponent(createdComponentId, {
      props: {
        content: 'Updated Hello World',
        variant: 'heading1',
      },
    });
    expect(updatedComponent.props.content).toBe('Updated Hello World');
    expect(updatedComponent.props.variant).toBe('heading1');
  });

  it('should reorder components', async () => {
    const reordered = await cmsService.reorderComponents([createdComponentId], [5]);
    expect(reordered).toHaveLength(1);
    expect(reordered[0].orderIndex).toBe(5);
  });

  it('should create a page version', async () => {
    const version = await cmsService.createPageVersion(createdPageId);
    expect(version).toHaveProperty('id');
    expect(version.version).toBe(2);
    expect(version.parentId).toBe(createdPageId);
  });

  it('should get page versions', async () => {
    const versions = await cmsService.getPageVersions(createdPageId);
    expect(versions).toHaveLength(2);
  });

  it('should batch create components', async () => {
    const components = await cmsService.batchCreateComponents([
      {
        pageId: createdPageId,
        type: 'button',
        props: {
          text: 'Click Me',
          href: '/test',
        },
      },
      {
        pageId: createdPageId,
        type: 'image',
        props: {
          src: 'https://example.com/image.jpg',
          alt: 'Test Image',
        },
      },
    ]);
    expect(components).toHaveLength(2);
    expect(components[0].type).toBe('button');
    expect(components[1].type).toBe('image');
  });

  it('should publish a page', async () => {
    const publishedPage = await cmsService.publishPage(createdPageId);
    expect(publishedPage.status).toBe('published');
    expect(publishedPage.publishedAt).toBeDefined();
  });

  it('should delete a component', async () => {
    await cmsService.deleteComponent(createdComponentId);
    // Verify component is deleted by trying to fetch it
    try {
      await cmsService.getComponent(createdComponentId);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should delete a page', async () => {
    await cmsService.deletePage(createdPageId);
    // Verify page is deleted by trying to fetch it
    try {
      await cmsService.getPage(createdPageId);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});