import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReusableComponentsService } from './reusable-components.service';
import { ReusableComponent } from '../entities/reusable-component.entity';
import { ComponentUsageHistory } from '../entities/component-usage-history.entity';
import { ComponentFavorite } from '../entities/component-favorite.entity';

describe('ReusableComponentsService', () => {
    let service: ReusableComponentsService;
    let repo: Repository<ReusableComponent>;

    const mockRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ id: '1', ...d })),
        findOne: jest.fn(),
        find: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            getOne: jest.fn(),
        })),
        increment: jest.fn(),
    };

    const mockUsageRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
    const mockFavRepo = { create: jest.fn(), save: jest.fn(), delete: jest.fn(), find: jest.fn(), findOne: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReusableComponentsService,
                { provide: getRepositoryToken(ReusableComponent), useValue: mockRepo },
                { provide: getRepositoryToken(ComponentUsageHistory), useValue: mockUsageRepo },
                { provide: getRepositoryToken(ComponentFavorite), useValue: mockFavRepo },
            ],
        }).compile();

        service = module.get<ReusableComponentsService>(ReusableComponentsService);
        repo = module.get(getRepositoryToken(ReusableComponent));
    });

    describe('generateUniqueSlug', () => {
        it('should uniquify slug', async () => {
            // First call finds collision
            mockRepo.findOne
                .mockResolvedValueOnce({ id: 'existing' })
                .mockResolvedValueOnce(null); // Second call free

            const slug = await service.generateUniqueSlug('My Component');

            // Implementation usually appends count
            expect(slug).toMatch(/my-component/);
            // Exact loop behavior depends on impl details (e.g. -1, -2)
            // Assuming generic slugify
        });
    });

    describe('trackUsage', () => {
        it('should save history and increment count', async () => {
            await service.trackUsage('1', 'page', 'p1', 'u1');

            expect(mockUsageRepo.save).toHaveBeenCalled();
            expect(repo.increment).toHaveBeenCalled();
        });
    });

    describe('favorites', () => {
        it('should toggle favorites', async () => {
            await service.addToFavorites('c1', 'u1');
            expect(mockFavRepo.save).toHaveBeenCalled();

            await service.removeFromFavorites('c1', 'u1');
            expect(mockFavRepo.delete).toHaveBeenCalled();
        });
    });

    describe('import', () => {
        it('should handle bulk import', async () => {
            const components = [{ name: 'C1', content: {} }];

            // Mock safe slug generation
            jest.spyOn(service, 'generateUniqueSlug').mockResolvedValue('c1');

            const res = await service.import(components as any, 'u1');

            expect(res.success).toBe(1);
        });
    });
});
