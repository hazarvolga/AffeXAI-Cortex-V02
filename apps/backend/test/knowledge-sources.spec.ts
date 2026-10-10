import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { KnowledgeSourcesService } from '../src/modules/knowledge-sources/services/knowledge-sources.service';
import { FileProcessingService } from '../src/modules/knowledge-sources/services/file-processing.service';
import { UrlProcessingService } from '../src/modules/knowledge-sources/services/url-processing.service';
import { S3Service } from '../src/modules/media/s3.service';
import { CompanyKnowledgeSource } from '../src/modules/knowledge-sources/entities/company-knowledge-source.entity';
import { KnowledgeSourceType } from '../src/modules/knowledge-sources/entities/enums/knowledge-source-type.enum';
import { KnowledgeSourceStatus } from '../src/modules/knowledge-sources/entities/enums/knowledge-source-status.enum';

/**
 * KnowledgeSourcesService unit tests: CRUD, DTO-level validation,
 * query building (incl. uploadedById scoping) and usage statistics.
 *
 * NOTE: see final report — this module does NOT filter queries by tenantId.
 */
describe('KnowledgeSourcesService', () => {
    let service: KnowledgeSourcesService;
    const tenantId = 'tenant-test';

    const mockRepo = {
        create: jest.fn((d: any) => d),
        save: jest.fn((d: any) => Promise.resolve({ id: 'ks-1', ...d })),
        findOne: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
    };

    const mockFileProcessing = { processDocument: jest.fn() };
    const mockUrlProcessing = { processUrl: jest.fn() };
    const mockS3 = { downloadFile: jest.fn(), uploadFile: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KnowledgeSourcesService,
                { provide: getRepositoryToken(CompanyKnowledgeSource), useValue: mockRepo },
                { provide: FileProcessingService, useValue: mockFileProcessing },
                { provide: UrlProcessingService, useValue: mockUrlProcessing },
                { provide: S3Service, useValue: mockS3 },
            ],
        }).compile();

        service = module.get(KnowledgeSourcesService);
        jest.clearAllMocks();
        mockRepo.create.mockImplementation((d: any) => d);
        mockRepo.save.mockImplementation((d: any) => Promise.resolve({ id: 'ks-1', ...d }));
        mockRepo.createQueryBuilder.mockReturnValue(qb);
        jest.spyOn(service, 'processKnowledgeSource').mockResolvedValue(undefined);
    });

    describe('create', () => {
        it('creates a TEXT source with PENDING status', async () => {
            const dto: any = { title: 'Brand guide', sourceType: KnowledgeSourceType.TEXT, extractedContent: 'hello' };
            const result = await service.create(tenantId, dto);

            expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Brand guide',
                status: KnowledgeSourceStatus.PENDING,
            }));
            expect(mockRepo.save).toHaveBeenCalled();
            expect(result.id).toBe('ks-1');
            expect(service.processKnowledgeSource).toHaveBeenCalledWith(tenantId, 'ks-1');
        });

        it('rejects a DOCUMENT source without fileName or filePath', async () => {
            await expect(service.create(tenantId, { title: 'Doc', sourceType: KnowledgeSourceType.DOCUMENT } as any))
                .rejects.toThrow(BadRequestException);
            expect(mockRepo.save).not.toHaveBeenCalled();
        });

        it('rejects a URL source without a url field', async () => {
            await expect(service.create(tenantId, { title: 'Link', sourceType: KnowledgeSourceType.URL } as any))
                .rejects.toThrow(BadRequestException);
        });

        it('rejects a TEXT source without extractedContent', async () => {
            await expect(service.create(tenantId, { title: 'Txt', sourceType: KnowledgeSourceType.TEXT } as any))
                .rejects.toThrow(BadRequestException);
        });
    });


    describe('findById / update / archive / delete', () => {
        it('throws NotFoundException for a missing source', async () => {
            mockRepo.findOne.mockResolvedValue(null);
            await expect(service.findById(tenantId, 'missing')).rejects.toThrow(NotFoundException);
        });

        it('updates an existing source by merging the DTO', async () => {
            mockRepo.findOne.mockResolvedValue({ id: 'ks-1', title: 'Old', status: KnowledgeSourceStatus.ACTIVE });
            const updated = await service.update(tenantId, 'ks-1', { title: 'New' } as any);

            expect(updated.title).toBe('New');
            expect(mockRepo.save).toHaveBeenCalled();
        });

        it('archives a source with archivedById stamp', async () => {
            mockRepo.findOne.mockResolvedValue({ id: 'ks-1', status: KnowledgeSourceStatus.ACTIVE });
            const archived = await service.archive(tenantId, 'ks-1', 'user-9');

            expect(archived.status).toBe(KnowledgeSourceStatus.ARCHIVED);
            expect(archived.archivedById).toBe('user-9');
        });

        it('permanently deletes after loading the source', async () => {
            const source = { id: 'ks-1' };
            mockRepo.findOne.mockResolvedValue(source);
            await service.delete(tenantId, 'ks-1');
            expect(mockRepo.remove).toHaveBeenCalledWith(source);
        });
    });

    describe('findAll', () => {
        it('applies uploadedById scoping filter and pagination', async () => {
            qb.getManyAndCount.mockResolvedValueOnce([[{ id: 'ks-1' }], 1]);

            const result = await service.findAll(tenantId, { uploadedById: 'user-4', limit: 5, offset: 10 });

            expect(qb.where).toHaveBeenCalledWith('ks.tenantId = :tenantId', { tenantId });

            expect(qb.andWhere).toHaveBeenCalledWith(
                'ks.uploadedById = :uploadedById',
                { uploadedById: 'user-4' },
            );
            expect(qb.skip).toHaveBeenCalledWith(10);
            expect(qb.take).toHaveBeenCalledWith(5);
            expect(result).toEqual({ data: [{ id: 'ks-1' }], total: 1 });
        });
    });

    describe('updateUsageStats', () => {
        it('increments usage/helpful counters and recomputes the relevance average', async () => {
            const source = { id: 'ks-1', usageCount: 1, helpfulCount: 0, averageRelevanceScore: 0.5 };
            mockRepo.findOne.mockResolvedValue(source);

            await service.updateUsageStats(tenantId, 'ks-1', true, 0.8);

            expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                usageCount: 2,
                helpfulCount: 1,
            }));
            // running average: (0.5 * 1 + 0.8) / 2 = 0.65
            expect(mockRepo.save.mock.calls[0][0].averageRelevanceScore).toBeCloseTo(0.65);
        });
    });
});
