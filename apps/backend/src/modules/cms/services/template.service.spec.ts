import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateService } from './template.service';
import { PageTemplate } from '../entities/page-template.entity';
import { BadRequestException } from '@nestjs/common';

describe('TemplateService', () => {
    let service: TemplateService;
    let repository: Repository<PageTemplate>;

    const mockRepo = {
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn().mockImplementation(t => Promise.resolve({ id: '1', ...t })),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        })),
        increment: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TemplateService,
                { provide: getRepositoryToken(PageTemplate), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<TemplateService>(TemplateService);
        repository = module.get(getRepositoryToken(PageTemplate));
    });

    describe('import', () => {
        it('should parse valid json and create template', async () => {
            const json = JSON.stringify({
                name: 'T1', category: 'C', designSystem: {}, blocks: []
            });

            await service.import({ templateData: json, authorId: 'u1' });

            expect(repository.create).toHaveBeenCalled();
        });

        it('should reject invalid json', async () => {
            await expect(service.import({ templateData: '{bad', authorId: 'u1' }))
                .rejects.toThrow(BadRequestException);
        });

        it('should reject missing fields', async () => {
            const json = JSON.stringify({ name: 'Only Name' });
            await expect(service.import({ templateData: json, authorId: 'u1' }))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('export', () => {
        it('should format export data', async () => {
            mockRepo.findOne.mockResolvedValue({ id: '1', name: 'T1', blocks: [] });

            const result = await service.export('1');

            expect(result.data).toHaveProperty('blocks');
            expect(result.exportedAt).toBeDefined();
        });
    });

    describe('duplicate', () => {
        it('should clone with copy suffix', async () => {
            mockRepo.findOne.mockResolvedValue({ name: 'Original', blocks: [] });

            await service.duplicate('1');

            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Original (Copy)' })
            );
        });
    });

    describe('getStats', () => {
        it('should aggregate usage metrics', async () => {
            // Mock find returns list
            mockRepo.createQueryBuilder().getMany.mockResolvedValue([
                { category: 'Blog', usageCount: 10, isFeatured: true },
                { category: 'Blog', usageCount: 5, isFeatured: false }
            ]);

            const stats = await service.getStats();

            expect(stats.total).toBe(2);
            expect(stats.byCategory['Blog']).toBe(2);
            expect(stats.totalUsage).toBe(15);
        });
    });
});
