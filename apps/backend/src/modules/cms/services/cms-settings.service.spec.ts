import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsSettingsService } from './cms-settings.service';
import { Page } from '../entities/page.entity';
import { Component } from '../entities/component.entity';

describe('CmsSettingsService', () => {
    let service: CmsSettingsService;
    let pageRepo: Repository<Page>;
    let compRepo: Repository<Component>;

    const mockPageRepo = {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn(),
    };

    const mockCompRepo = {
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CmsSettingsService,
                { provide: getRepositoryToken(Page), useValue: mockPageRepo },
                { provide: getRepositoryToken(Component), useValue: mockCompRepo },
            ],
        }).compile();

        service = module.get<CmsSettingsService>(CmsSettingsService);
        pageRepo = module.get(getRepositoryToken(Page));
        compRepo = module.get(getRepositoryToken(Component));
    });

    describe('getPageComponents', () => {
        it('should build hierarchical structure', async () => {
            // Mock flat list: Parent -> Child
            mockCompRepo.find.mockResolvedValue([
                { id: '1', parentId: null, orderIndex: 0, children: [] },
                { id: '2', parentId: '1', orderIndex: 0, children: [] }
            ]);

            const result = await service.getPageComponents('p1');

            expect(result.length).toBe(1); // Only root returned
            expect(result[0].id).toBe('1');
            expect(result[0].children.length).toBe(1); // Child nested
            expect(result[0].children[0].id).toBe('2');
        });
    });

    describe('getCmsConfiguration', () => {
        it('should return simplified config', async () => {
            mockPageRepo.find.mockResolvedValue([
                { id: '1', title: 'Home', slug: 'home' }
            ]);

            const config = await service.getCmsConfiguration();

            expect(config.pages.length).toBe(1);
            expect(config.pages[0].slug).toBe('home');
            expect(config.lastUpdated).toBeDefined();
        });
    });
});
