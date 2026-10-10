/**
 * Property-Based Tests for MediaManager
 * 
 * **Feature: wordpress-cms-migration, Property 2: Relative Path Storage**
 * **Validates: Requirements 3.3, 14.1**
 * 
 * **Feature: wordpress-cms-migration, Property 11: Media Entity Reuse**
 * **Validates: Requirements 9.3**
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { MediaManager } from '../../managers/media-manager';

// Mock repository
function createMockRepository() {
  const mediaStore: any[] = [];
  
  return {
    findOne: jest.fn().mockImplementation(async ({ where }: any) => {
      return mediaStore.find(m => m.filename === where.filename) || null;
    }),
    create: jest.fn().mockImplementation((data: any) => data),
    save: jest.fn().mockImplementation(async (media: any) => {
      const saved = { ...media, id: `media-${Date.now()}-${Math.random()}` };
      mediaStore.push(saved);
      return saved;
    }),
    find: jest.fn().mockImplementation(async () => [...mediaStore]),
    _store: mediaStore,
  };
}

// Generators
const filenameArbitrary = fc.string({ minLength: 3, maxLength: 20 })
  .map(s => s.replace(/[^a-zA-Z0-9-_]/g, '_'))
  .filter(s => s.length >= 3);

const extensionArbitrary = fc.constantFrom('.jpg', '.png', '.gif', '.webp');

describe('MediaManager Property Tests', () => {
  const tempFiles: string[] = [];

  afterEach(() => {
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch {}
      }
    });
    tempFiles.length = 0;
  });

  /**
   * Property 2: Relative Path Storage
   * All Media Entity URLs should be relative paths starting with /cms-media/
   */
  it('Property 2: all media URLs should be relative paths starting with /cms-media/', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            filename: filenameArbitrary,
            extension: extensionArbitrary,
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (files) => {
          const mockRepo = createMockRepository();
          const mediaManager = new MediaManager(mockRepo as any);

          // Create mapping
          const mappingData: Record<string, string> = {};
          files.forEach((file, i) => {
            const oldUrl = `https://old-site.com/wp-content/uploads/${file.filename}${file.extension}`;
            const newUrl = `http://localhost:9007/cms-media/${file.filename}${file.extension}`;
            mappingData[oldUrl] = newUrl;
          });

          const tempFile = path.join(__dirname, `temp-mapping-${Date.now()}.json`);
          tempFiles.push(tempFile);
          fs.writeFileSync(tempFile, JSON.stringify(mappingData));

          await mediaManager.loadMediaMapping(tempFile);

          // Create media entities
          for (const oldUrl of Object.keys(mappingData)) {
            await mediaManager.getOrCreateMediaEntity(oldUrl);
          }

          // Check all media have relative paths
          const allMedia = mockRepo._store;
          for (const media of allMedia) {
            expect(media.url).toMatch(/^\/cms-media\//);
            expect(media.url).not.toContain('://');
          }
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 11: Media Entity Reuse
   * Same filename should return same media entity (no duplicates)
   */
  it('Property 11: same URL should return same media entity ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        filenameArbitrary,
        extensionArbitrary,
        fc.integer({ min: 2, max: 4 }),
        async (filename, extension, requestCount) => {
          const mockRepo = createMockRepository();
          const mediaManager = new MediaManager(mockRepo as any);

          const oldUrl = `https://old-site.com/wp-content/uploads/${filename}${extension}`;
          const newUrl = `http://localhost:9007/cms-media/${filename}${extension}`;
          
          const mappingData = { [oldUrl]: newUrl };
          const tempFile = path.join(__dirname, `temp-reuse-${Date.now()}.json`);
          tempFiles.push(tempFile);
          fs.writeFileSync(tempFile, JSON.stringify(mappingData));

          await mediaManager.loadMediaMapping(tempFile);

          // Request same media multiple times
          const ids: (string | null)[] = [];
          for (let i = 0; i < requestCount; i++) {
            const id = await mediaManager.getOrCreateMediaEntity(oldUrl);
            ids.push(id);
          }

          // All IDs should be the same
          const uniqueIds = new Set(ids.filter(id => id !== null));
          expect(uniqueIds.size).toBe(1);
          
          // Only one entity in store
          expect(mockRepo._store.length).toBe(1);
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});
