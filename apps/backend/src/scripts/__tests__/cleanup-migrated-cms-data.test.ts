import { DataSource } from 'typeorm';
import { MigrationCleanup, CleanupOptions } from '../cleanup-migrated-cms-data';

describe('MigrationCleanup', () => {
  let dataSource: DataSource;
  let cleanup: MigrationCleanup;
  let mockQueryBuilder: any;

  beforeEach(() => {
    // Create mock query builder
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
      execute: jest.fn(),
    };

    // Create mock data source
    dataSource = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      initialize: jest.fn(),
      destroy: jest.fn(),
      isInitialized: true,
    } as any;

    cleanup = new MigrationCleanup(dataSource);
  });

  describe('identifyMigratedPages', () => {
    it('should identify pages created after specified date', async () => {
      const afterDate = new Date('2024-12-01');
      const options: CleanupOptions = {
        dryRun: true,
        afterDate,
      };

      const mockPages = [
        { id: 'page-1' },
        { id: 'page-2' },
        { id: 'page-3' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockPages);

      const result = await (cleanup as any).identifyMigratedPages(options);

      expect(result).toEqual(['page-1', 'page-2', 'page-3']);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'page.created_at > :afterDate',
        { afterDate }
      );
    });

    it('should identify pages by slug pattern', async () => {
      const options: CleanupOptions = {
        dryRun: true,
        slugPattern: 'product-',
      };

      const mockPages = [
        { id: 'page-1' },
        { id: 'page-2' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockPages);

      const result = await (cleanup as any).identifyMigratedPages(options);

      expect(result).toEqual(['page-1', 'page-2']);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'page.slug LIKE :pattern',
        { pattern: '%product-%' }
      );
    });

    it('should use default 7-day filter when no options specified', async () => {
      const options: CleanupOptions = {
        dryRun: true,
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await (cleanup as any).identifyMigratedPages(options);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'page.created_at > :afterDate',
        expect.objectContaining({
          afterDate: expect.any(Date),
        })
      );
    });

    it('should return empty array when no pages found', async () => {
      const options: CleanupOptions = {
        dryRun: true,
        afterDate: new Date('2024-12-01'),
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await (cleanup as any).identifyMigratedPages(options);

      expect(result).toEqual([]);
    });
  });

  describe('countComponents', () => {
    it('should count components for given page IDs', async () => {
      const pageIds = ['page-1', 'page-2', 'page-3'];

      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '42' });

      const result = await (cleanup as any).countComponents(pageIds);

      expect(result).toBe(42);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'component."pageId" IN (:...pageIds)',
        { pageIds }
      );
    });

    it('should return 0 for empty page IDs array', async () => {
      const result = await (cleanup as any).countComponents([]);

      expect(result).toBe(0);
      expect(mockQueryBuilder.getRawOne).not.toHaveBeenCalled();
    });

    it('should parse count as integer', async () => {
      const pageIds = ['page-1'];

      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '123' });

      const result = await (cleanup as any).countComponents(pageIds);

      expect(result).toBe(123);
      expect(typeof result).toBe('number');
    });
  });

  describe('deletePages', () => {
    it('should delete pages with CASCADE', async () => {
      const pageIds = ['page-1', 'page-2', 'page-3'];

      mockQueryBuilder.execute.mockResolvedValue({ affected: 3 });

      const result = await (cleanup as any).deletePages(pageIds);

      expect(result).toBe(3);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith('cms_pages');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'id IN (:...pageIds)',
        { pageIds }
      );
    });

    it('should return 0 for empty page IDs array', async () => {
      const result = await (cleanup as any).deletePages([]);

      expect(result).toBe(0);
      expect(mockQueryBuilder.execute).not.toHaveBeenCalled();
    });

    it('should handle null affected count', async () => {
      const pageIds = ['page-1'];

      mockQueryBuilder.execute.mockResolvedValue({ affected: null });

      const result = await (cleanup as any).deletePages(pageIds);

      expect(result).toBe(0);
    });
  });

  describe('deleteOrphanedMedia', () => {
    it('should identify and delete orphaned media entities', async () => {
      const options: CleanupOptions = {
        dryRun: false,
      };

      const mockOrphanedMedia = [
        { id: 'media-1' },
        { id: 'media-2' },
      ];

      // Mock the query builder chain for finding orphaned media
      mockQueryBuilder.getRawMany.mockResolvedValueOnce(mockOrphanedMedia);
      mockQueryBuilder.execute.mockResolvedValue({ affected: 2 });

      const result = await (cleanup as any).deleteOrphanedMedia(options);

      expect(result).toBe(2);
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('component.id IS NULL');
    });

    it('should filter by date when specified', async () => {
      const afterDate = new Date('2024-12-01');
      const options: CleanupOptions = {
        dryRun: false,
        afterDate,
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await (cleanup as any).deleteOrphanedMedia(options);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'media.created_at > :afterDate',
        { afterDate }
      );
    });

    it('should return count in dry-run mode without deleting', async () => {
      const options: CleanupOptions = {
        dryRun: true,
      };

      const mockOrphanedMedia = [
        { id: 'media-1' },
        { id: 'media-2' },
        { id: 'media-3' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockOrphanedMedia);

      const result = await (cleanup as any).deleteOrphanedMedia(options);

      expect(result).toBe(3);
      expect(mockQueryBuilder.execute).not.toHaveBeenCalled();
    });

    it('should return 0 when no orphaned media found', async () => {
      const options: CleanupOptions = {
        dryRun: false,
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await (cleanup as any).deleteOrphanedMedia(options);

      expect(result).toBe(0);
      expect(mockQueryBuilder.execute).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should perform complete cleanup in live mode', async () => {
      const options: CleanupOptions = {
        dryRun: false,
        afterDate: new Date('2024-12-01'),
      };

      // Mock page identification
      const mockPageIds = ['page-1', 'page-2'];
      mockQueryBuilder.getRawMany.mockResolvedValueOnce(
        mockPageIds.map((id) => ({ id }))
      );

      // Mock component count
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '10' });

      // Mock page deletion
      mockQueryBuilder.execute.mockResolvedValueOnce({ affected: 2 });

      // Mock orphaned media
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([{ id: 'media-1' }]);
      mockQueryBuilder.execute.mockResolvedValueOnce({ affected: 1 });

      const result = await cleanup.cleanup(options);

      expect(result.deletedPages).toBe(2);
      expect(result.deletedComponents).toBe(10);
      expect(result.deletedMediaEntities).toBe(1);
      expect(result.pageIds).toEqual(mockPageIds);
      expect(result.errors).toEqual([]);
    });

    it('should not delete in dry-run mode', async () => {
      const options: CleanupOptions = {
        dryRun: true,
        afterDate: new Date('2024-12-01'),
      };

      const mockPageIds = ['page-1', 'page-2'];
      mockQueryBuilder.getRawMany.mockResolvedValue(
        mockPageIds.map((id) => ({ id }))
      );

      // Mock preview deletion query
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { id: 'page-1', title: 'Page 1', slug: 'page-1', created_at: new Date() },
        { id: 'page-2', title: 'Page 2', slug: 'page-2', created_at: new Date() },
      ]);

      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '10' });

      const result = await cleanup.cleanup(options);

      expect(result.deletedPages).toBe(0);
      expect(result.deletedComponents).toBe(0);
      expect(result.deletedMediaEntities).toBe(0);
      expect(mockQueryBuilder.execute).not.toHaveBeenCalled();
    });

    it('should handle no pages found', async () => {
      const options: CleanupOptions = {
        dryRun: false,
      };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await cleanup.cleanup(options);

      expect(result.deletedPages).toBe(0);
      expect(result.deletedComponents).toBe(0);
      expect(result.deletedMediaEntities).toBe(0);
      expect(result.pageIds).toEqual([]);
    });

    it('should capture errors and add to result', async () => {
      const options: CleanupOptions = {
        dryRun: false,
      };

      const error = new Error('Database connection failed');
      mockQueryBuilder.getRawMany.mockRejectedValue(error);

      await expect(cleanup.cleanup(options)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('generateReport', () => {
    it('should generate report for successful cleanup', () => {
      const result = {
        deletedPages: 10,
        deletedComponents: 50,
        deletedMediaEntities: 5,
        pageIds: ['page-1', 'page-2'],
        errors: [],
      };

      const options: CleanupOptions = {
        dryRun: false,
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      cleanup.generateReport(result, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CLEANUP REPORT')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pages deleted: 10')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Components deleted: 50')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Media entities deleted: 5')
      );

      consoleSpy.mockRestore();
    });

    it('should show dry-run warning in report', () => {
      const result = {
        deletedPages: 0,
        deletedComponents: 0,
        deletedMediaEntities: 0,
        pageIds: ['page-1'],
        errors: [],
      };

      const options: CleanupOptions = {
        dryRun: true,
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      cleanup.generateReport(result, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DRY RUN')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No data was actually deleted')
      );

      consoleSpy.mockRestore();
    });

    it('should display errors in report', () => {
      const result = {
        deletedPages: 5,
        deletedComponents: 20,
        deletedMediaEntities: 2,
        pageIds: ['page-1'],
        errors: ['Error 1', 'Error 2'],
      };

      const options: CleanupOptions = {
        dryRun: false,
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      cleanup.generateReport(result, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERRORS')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error 1'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error 2'));

      consoleSpy.mockRestore();
    });
  });
});
