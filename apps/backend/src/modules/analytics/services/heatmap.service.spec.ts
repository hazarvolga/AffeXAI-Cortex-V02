import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeatmapService } from './heatmap.service';
import { AnalyticsHeatmap } from '../entities/analytics-heatmap.entity';
import { AnalyticsEvent } from '../entities/analytics-event.entity';

describe('HeatmapService', () => {
    let service: HeatmapService;
    let heatmapRepo: Repository<AnalyticsHeatmap>;
    let eventRepo: Repository<AnalyticsEvent>;

    const mockHeatmapRepo = {
        findOne: jest.fn(),
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ id: 'h-1', ...d })),
        find: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            delete: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 5 }),
        })),
    };

    const mockEventRepo = {
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HeatmapService,
                { provide: getRepositoryToken(AnalyticsHeatmap), useValue: mockHeatmapRepo },
                { provide: getRepositoryToken(AnalyticsEvent), useValue: mockEventRepo },
            ],
        }).compile();

        service = module.get<HeatmapService>(HeatmapService);
        heatmapRepo = module.get(getRepositoryToken(AnalyticsHeatmap));
        eventRepo = module.get(getRepositoryToken(AnalyticsEvent));
        jest.clearAllMocks();
    });

    describe('generateHeatmap', () => {
        it('should return existing heatmap if found', async () => {
            mockHeatmapRepo.findOne.mockResolvedValue({ id: 'exists' });
            const result = await service.generateHeatmap({ componentId: 'c1', timeRange: 'today' } as any);
            expect(result.id).toBe('exists');
            expect(eventRepo.createQueryBuilder).not.toHaveBeenCalled();
        });

        it('should aggregate points and create heatmap', async () => {
            mockHeatmapRepo.findOne.mockResolvedValue(null);
            // Mock interactions
            (mockEventRepo.createQueryBuilder().getMany as jest.Mock).mockResolvedValue([
                { relativeX: 10, relativeY: 10, interactionType: 'click', userId: 'u1', componentType: 'btn' },
                { relativeX: 12, relativeY: 12, interactionType: 'click', userId: 'u1' } // Should group to same grid
            ]);

            const result = await service.generateHeatmap({ componentId: 'c1', timeRange: 'today' } as any);

            expect(result.points.length).toBe(1); // 10,10 and 12,12 fall in same 10x10 block
            expect(result.points[0].intensity).toBe(2);
            expect(result.uniqueUsers).toBe(1);
            expect(heatmapRepo.save).toHaveBeenCalled();
        });
    });

    describe('deleteOldHeatmaps', () => {
        it('should execute delete query', async () => {
            const affected = await service.deleteOldHeatmaps(30);
            expect(heatmapRepo.createQueryBuilder).toHaveBeenCalled();
            expect(affected).toBe(5);
        });
    });
});
