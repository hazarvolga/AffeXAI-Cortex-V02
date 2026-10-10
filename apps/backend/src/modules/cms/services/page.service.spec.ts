import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PageService } from './page.service';
import { Page } from '../entities/page.entity';
import { EventBusService } from '../../platform-integration/services/event-bus.service';
import { PageStatus } from '@affexai/shared-types';
import { Component } from '../entities/component.entity';
import { NotFoundException } from '@nestjs/common';

describe('PageService', () => {
    let service: PageService;
    let pageRepository: Repository<Page>;
    let eventBusService: EventBusService;

    const mockPage = {
        id: 'page-1',
        title: 'Test Page',
        slug: 'test-page',
        status: PageStatus.DRAFT,
        components: [],
    };

    const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockPageRepository = {
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn().mockImplementation(page => Promise.resolve({ id: '1', ...page })),
        find: jest.fn().mockResolvedValue([mockPage]),
        findOne: jest.fn().mockResolvedValue(mockPage),
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        manager: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            create: jest.fn().mockImplementation((entity, data) => data),
            save: jest.fn().mockResolvedValue([]),
        },
    };

    const mockEventBusService = {
        publishPagePublished: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PageService,
                { provide: getRepositoryToken(Page), useValue: mockPageRepository },
                { provide: EventBusService, useValue: mockEventBusService },
            ],
        }).compile();

        service = module.get<PageService>(PageService);
        pageRepository = module.get(getRepositoryToken(Page));
        eventBusService = module.get(EventBusService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a page', async () => {
            const dto = { title: 'New Page', slug: 'new-page' };
            const result = await service.create(dto as any);
            expect(result).toBeDefined();
            expect(pageRepository.create).toHaveBeenCalledWith(dto);
            expect(pageRepository.save).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all pages', async () => {
            const result = await service.findAll();
            expect(result).toEqual([]); // Mismatched mock vs QueryBuilder return, let's align
            // Logic uses createQueryBuilder. It returns [] from mockQueryBuilder.getMany
        });

        it('should filter by status', async () => {
            await service.findAll(PageStatus.PUBLISHED);
            expect(pageRepository.createQueryBuilder).toHaveBeenCalled();
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('page.status = :status', { status: PageStatus.PUBLISHED });
        });
    });

    describe('findOne', () => {
        it('should return a page with components', async () => {
            mockPageRepository.findOne.mockResolvedValue({
                ...mockPage,
                components: [{ id: 'comp-1' }]
            });

            const result = await service.findOne('page-1');
            expect(result).toBeDefined();
            expect(result.components.length).toBe(1);
        });

        it('should fallback to manual component fetching if relation missing', async () => {
            mockPageRepository.findOne.mockResolvedValue({ ...mockPage, components: [] });
            mockQueryBuilder.getMany.mockResolvedValue([{ id: 'manual-comp' }]);

            const result = await service.findOne('page-1');
            expect(result.components.length).toBe(1);
            expect(result.components[0].id).toBe('manual-comp');
        });
    });

    describe('publish', () => {
        it('should publish page and emit event', async () => {
            mockPageRepository.findOne.mockResolvedValue(mockPage);

            await service.publish('page-1');

            expect(pageRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                status: PageStatus.PUBLISHED
            }));
            expect(eventBusService.publishPagePublished).toHaveBeenCalled();
        });

        it('should throw if page not found', async () => {
            mockPageRepository.findOne.mockResolvedValue(null);
            await expect(service.publish('bad-id')).rejects.toThrow();
        });
    });

    describe('clone', () => {
        it('should clone page and components', async () => {
            mockPageRepository.findOne.mockResolvedValue({
                ...mockPage,
                components: [{ id: 'c1', type: 'hero' }]
            });

            const result = await service.clone('page-1');

            expect(pageRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('(Kopya)'),
                status: PageStatus.DRAFT
            }));
            expect(pageRepository.manager.create).toHaveBeenCalled(); // Component cloning
        });
    });

    describe('bulkOperations', () => {
        it('should bulk publish', async () => {
            const ids = ['1', '2'];
            mockPageRepository.update.mockResolvedValue({ affected: 2 });

            const res = await service.bulkPublish(ids);

            expect(res.successCount).toBe(2);
            expect(pageRepository.update).toHaveBeenCalledWith(
                { id: In(ids) },
                expect.objectContaining({ status: PageStatus.PUBLISHED })
            );
        });

        it('should bulk delete', async () => {
            const ids = ['1'];
            mockPageRepository.delete.mockResolvedValue({ affected: 1 });

            const res = await service.bulkDelete(ids);

            expect(res.successCount).toBe(1);
        });
    });
});
