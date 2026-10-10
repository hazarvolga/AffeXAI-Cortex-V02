import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuService } from './menu.service';
import { Menu } from '../entities/menu.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { ConflictException } from '@nestjs/common';

describe('MenuService', () => {
    let service: MenuService;
    let menuRepo: Repository<Menu>;
    let menuItemRepo: Repository<MenuItem>;

    const mockMenuRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ id: 'm-1', ...d })),
        findOne: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
    };

    const mockMenuItemRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ id: 'mi-1', ...d })),
        findOne: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MenuService,
                { provide: getRepositoryToken(Menu), useValue: mockMenuRepo },
                { provide: getRepositoryToken(MenuItem), useValue: mockMenuItemRepo },
            ],
        }).compile();

        service = module.get<MenuService>(MenuService);
        menuRepo = module.get(getRepositoryToken(Menu));
        menuItemRepo = module.get(getRepositoryToken(MenuItem));

        jest.clearAllMocks();
    });

    describe('Menu Operations', () => {
        it('should create menu', async () => {
            const result = await service.createMenu({ name: 'Main' });
            expect(result.slug).toBe('main');
        });

        it('should find nested menus', async () => {
            // Mock logic assumes find returns raw items that get nested
            mockMenuRepo.find.mockResolvedValue([]);
            const result = await service.findAllMenus();
            expect(result).toEqual([]);
        });
    });

    describe('MenuItem Operations', () => {
        it('should create menu item', async () => {
            mockMenuRepo.findOne.mockResolvedValue({ id: 'm-1' });
            const item = await service.createMenuItem({ menuId: 'm-1', title: 'Home' });
            expect(item).toBeDefined();
        });

        it('should check circular reference on update', async () => {
            jest.spyOn(service, 'wouldCreateCircularReference').mockResolvedValue(true);
            await expect(service.updateMenuItem('mi-1', { parentId: 'mi-2' }))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('batchUpdateMenuItems', () => {
        it('should update multiple items', async () => {
            const updates = [{ id: 'mi-1', parentId: null, orderIndex: 0 }];
            mockMenuItemRepo.findOne.mockResolvedValue({ id: 'mi-1' });

            await service.batchUpdateMenuItems('m-1', updates);

            expect(mockMenuItemRepo.save).toHaveBeenCalled();
        });
    });

    describe('wouldCreateCircularReference', () => {
        it('should detect circle', async () => {
            mockMenuItemRepo.findOne.mockImplementation(async ({ where: { id } }) => {
                if (id === 'child') return { id: 'child', parentId: 'parent' };
                if (id === 'parent') return { id: 'parent', parentId: 'root' };
                return null;
            });

            // If we move root under child -> root -> parent -> child -> root (Circle)
            // Implementation usually checks if newParent is a child of id

            // Let's rely on logic. We check parent of newParent until we hit id.
            // Call: check if 'root' can have parent 'child'
            // Path from 'child' up: child -> parent -> root 
            // Does path contain 'root'? Yes.

            const isCircular = await service.wouldCreateCircularReference('root', 'child');

            // Since mocks might be tricky without full recursion setup, simple expectation:
            // If logic implemented correctly, traversing up from 'child' hits 'root'.
            // With our mocks returning parentIds properly, it should work.

            expect(isCircular).toBe(true);
        });
    });
});
