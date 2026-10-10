import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReusableSectionsService } from './reusable-sections.service';
import { ReusableSection } from '../entities/reusable-section.entity';
import { SectionComponent } from '../entities/section-component.entity';
import { ComponentFavorite } from '../entities/component-favorite.entity';
import { ReusableComponentsService } from './reusable-components.service';
import { ReusableComponent } from '../entities/reusable-component.entity';

describe('ReusableSectionsService', () => {
    let service: ReusableSectionsService;
    let sectionRepo: Repository<ReusableSection>;

    const mockSectionRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ id: 's-1', ...d })),
        findOne: jest.fn(),
        find: jest.fn(),
        increment: jest.fn(),
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
    };

    const mockComponentsService = {
        trackUsage: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReusableSectionsService,
                { provide: getRepositoryToken(ReusableSection), useValue: mockSectionRepo },
                { provide: getRepositoryToken(SectionComponent), useValue: { create: jest.fn(), save: jest.fn() } },
                { provide: getRepositoryToken(ComponentFavorite), useValue: { findOne: jest.fn(), save: jest.fn(), delete: jest.fn() } },
                { provide: getRepositoryToken(ReusableComponent), useValue: {} },
                { provide: ReusableComponentsService, useValue: mockComponentsService },
            ],
        }).compile();

        service = module.get<ReusableSectionsService>(ReusableSectionsService);
        sectionRepo = module.get(getRepositoryToken(ReusableSection));
    });

    describe('create', () => {
        it('should create section with slug', async () => {
            jest.spyOn(service, 'generateUniqueSlug').mockResolvedValue('test-section');

            const result = await service.create({ name: 'Test' } as any, 'u1');

            expect(result.slug).toBe('test-section');
            expect(sectionRepo.save).toHaveBeenCalled();
        });
    });

    describe('duplicate', () => {
        it('should duplicate section and components', async () => {
            mockSectionRepo.findOne.mockResolvedValue({
                id: '1',
                name: 'Orig',
                components: [{ id: 'c1', componentId: 'rc1' }]
            });

            await service.duplicate('1', {}, 'u1');

            expect(sectionRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: expect.stringContaining('(Copy)') })
            );
        });
    });

    describe('trackUsage', () => {
        it('should increment usage', async () => {
            await service.trackUsage('1', 'page', 'p1', 'u1');
            expect(sectionRepo.increment).toHaveBeenCalled();
        });
    });
});
