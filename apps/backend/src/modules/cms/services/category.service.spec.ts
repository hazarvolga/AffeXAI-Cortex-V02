import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryService } from './category.service';
import { Category } from '../entities/category.entity';
import { ConflictException } from '@nestjs/common';

describe('CategoryService', () => {
    let service: CategoryService;
    let repository: Repository<Category>;

    const mockCategory = { id: 'cat-1', name: 'Tech', parentId: null };

    const mockRepo = {
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn().mockImplementation(c => Promise.resolve({ id: '1', ...c })),
        findOne: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
            getMany: jest.fn(),
            leftJoin: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryService,
                { provide: getRepositoryToken(Category), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<CategoryService>(CategoryService);
        repository = module.get(getRepositoryToken(Category));

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create category with slug', async () => {
            const result = await service.create({ name: 'New Cat' });
            expect(result.slug).toBe('new-cat');
        });
    });

    describe('getTree', () => {
        it('should build recursive tree', async () => {
            mockRepo.find.mockResolvedValue([
                { id: '1', parentId: null, children: [] },
                { id: '2', parentId: '1', children: [] }
            ]);

            const tree = await service.getTree();
            expect(tree.length).toBe(1);
            expect(tree[0].children.length).toBe(1);
        });
    });

    describe('wouldCreateCircularReference', () => {
        it('should detect circular dependency', async () => {
            // Logic likely traverses parents.
            // Mock findOne to simulate chain: 3 -> 2 -> 1
            // If we try to set 1's parent to 3, it should fail.

            mockRepo.findOne.mockImplementation(async ({ where: { id } }) => {
                if (id === '3') return { id: '3', parentId: '2' };
                if (id === '2') return { id: '2', parentId: '1' };
                if (id === '1') return { id: '1', parentId: null };
                return null;
            });

            const isCircular = await service.wouldCreateCircularReference('1', '3');
            expect(isCircular).toBe(true);
        });
    });

    describe('update', () => {
        it('should prevent circular reference update', async () => {
            jest.spyOn(service, 'wouldCreateCircularReference').mockResolvedValue(true);

            await expect(service.update('1', { parentId: '3' }))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('batchUpdateCategories', () => {
        it('should process multiple updates', async () => {
            const updates = [{ id: '1', parentId: null, orderIndex: 0 }];
            mockRepo.findOne.mockResolvedValue(mockCategory);

            await service.batchUpdateCategories(updates);

            expect(mockRepo.save).toHaveBeenCalled();
        });
    });
});
