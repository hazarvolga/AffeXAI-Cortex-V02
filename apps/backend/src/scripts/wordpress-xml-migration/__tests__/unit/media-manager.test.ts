import { MediaManager } from '../../managers/media-manager';
import { DataSource } from 'typeorm';
import { MediaType, StorageType, MediaModule, MediaCategory } from '@affexai/shared-types';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');

describe('MediaManager', () => {
  let mediaManager: MediaManager;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Create mock DataSource
    mockDataSource = {
      query: jest.fn(),
    } as any;

    mediaManager = new MediaManager(mockDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadMediaMapping', () => {
    it('should load media mapping from JSON file', async () => {
      const mockMapping = {
        'http://old-site.com/image1.jpg': 'http://localhost:9007/cms-media/image1.jpg',
        'http://old-site.com/image2.png': 'http://localhost:9007/cms-media/image2.png',
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockMapping));

      await mediaManager.loadMediaMapping('/path/to/mapping.json');

      const stats = mediaManager.getMappingStats();
      expect(stats.total).toBe(2);
      expect(stats.mapped).toBe(2);
    });

    it('should handle missing mapping file gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await mediaManager.loadMediaMapping('/path/to/missing.json');

      const stats = mediaManager.getMappingStats();
      expect(stats.total).toBe(0);
    });

    it('should throw error for invalid JSON', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      await expect(mediaManager.loadMediaMapping('/path/to/invalid.json')).rejects.toThrow();
    });
  });

  describe('getOrCreateMediaEntity', () => {
    beforeEach(async () => {
      const mockMapping = {
        'http://old-site.com/image1.jpg': 'http://localhost:9007/cms-media/images/image1.jpg',
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockMapping));

      await mediaManager.loadMediaMapping('/path/to/mapping.json');
    });

    it('should return existing media entity if found', async () => {
      const existingMedia = [
        {
          id: 'existing-id',
          filename: 'image1.jpg',
          url: '/cms-media/images/image1.jpg',
        },
      ];

      mockDataSource.query.mockResolvedValue(existingMedia);

      const result = await mediaManager.getOrCreateMediaEntity('http://old-site.com/image1.jpg');

      expect(result).toBe('existing-id');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'SELECT id FROM media WHERE filename = $1',
        ['image1.jpg']
      );
    });

    it('should create new media entity if not found', async () => {
      // First call returns empty array (not found), second call returns new ID
      mockDataSource.query
        .mockResolvedValueOnce([]) // SELECT query returns empty
        .mockResolvedValueOnce([{ id: 'new-id' }]); // INSERT query returns new ID

      const result = await mediaManager.getOrCreateMediaEntity('http://old-site.com/image1.jpg');

      expect(result).toBe('new-id');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'SELECT id FROM media WHERE filename = $1',
        ['image1.jpg']
      );
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO media'),
        expect.arrayContaining([
          'image1.jpg',
          'image1.jpg',
          'image/jpeg',
          0,
          '/cms-media/images/image1.jpg',
          MediaType.IMAGE,
          StorageType.CLOUD,
          MediaModule.CMS,
          MediaCategory.GALLERY,
          true,
        ])
      );
    });

    it('should return null for unmapped image URL', async () => {
      const result = await mediaManager.getOrCreateMediaEntity('http://old-site.com/unmapped.jpg');

      expect(result).toBeNull();
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('should extract relative path correctly', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([]) // SELECT query returns empty
        .mockResolvedValueOnce([{ id: 'new-id' }]); // INSERT query returns new ID

      await mediaManager.getOrCreateMediaEntity('http://old-site.com/image1.jpg');

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO media'),
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          '/cms-media/images/image1.jpg', // Relative path
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
        ])
      );
    });

    it('should set correct MIME type for different image formats', async () => {
      const mappings = {
        'http://old-site.com/image.png': 'http://localhost:9007/cms-media/image.png',
        'http://old-site.com/image.gif': 'http://localhost:9007/cms-media/image.gif',
        'http://old-site.com/image.webp': 'http://localhost:9007/cms-media/image.webp',
      };

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mappings));
      await mediaManager.loadMediaMapping('/path/to/mapping.json');

      mockDataSource.query
        .mockResolvedValue([]) // SELECT returns empty
        .mockResolvedValue([{ id: 'test-id' }]); // INSERT returns ID

      await mediaManager.getOrCreateMediaEntity('http://old-site.com/image.png');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO media'),
        expect.arrayContaining(['image/png'])
      );

      mockDataSource.query.mockClear();
      mockDataSource.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'test-id' }]);

      await mediaManager.getOrCreateMediaEntity('http://old-site.com/image.gif');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO media'),
        expect.arrayContaining(['image/gif'])
      );

      mockDataSource.query.mockClear();
      mockDataSource.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'test-id' }]);

      await mediaManager.getOrCreateMediaEntity('http://old-site.com/image.webp');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO media'),
        expect.arrayContaining(['image/webp'])
      );
    });
  });

  describe('getMappingStats', () => {
    it('should return correct statistics', async () => {
      const mockMapping = {
        'url1': 'minio1',
        'url2': 'minio2',
        'url3': 'minio3',
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockMapping));

      await mediaManager.loadMediaMapping('/path/to/mapping.json');

      const stats = mediaManager.getMappingStats();
      expect(stats.total).toBe(3);
      expect(stats.mapped).toBe(3);
    });
  });
});
