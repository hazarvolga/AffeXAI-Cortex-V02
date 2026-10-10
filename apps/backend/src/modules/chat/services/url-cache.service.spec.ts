import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UrlCacheService } from './url-cache.service';
import { ChatUrlCache, UrlProcessingStatus } from '../entities/chat-url-cache.entity';

describe('UrlCacheService', () => {
    let service: UrlCacheService;
    let repository: Repository<ChatUrlCache>;

    const mockRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
            getMany: jest.fn(),
            execute: jest.fn(),
        })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UrlCacheService,
                { provide: getRepositoryToken(ChatUrlCache), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<UrlCacheService>(UrlCacheService);
        repository = module.get(getRepositoryToken(ChatUrlCache));

        jest.clearAllMocks();
    });

    describe('getCachedUrl', () => {
        it('should return valid cache entry', async () => {
            mockRepo.findOne.mockResolvedValue({
                urlHash: 'hash',
                expiresAt: new Date(Date.now() + 10000)
            });

            const entry = await service.getCachedUrl('hash');

            expect(entry).toBeDefined();
        });

        it('should return null for expired entry', async () => {
            mockRepo.findOne.mockResolvedValue({
                urlHash: 'hash',
                expiresAt: new Date(Date.now() - 10000)
            });

            const entry = await service.getCachedUrl('hash');

            expect(entry).toBeNull();
        });
    });

    describe('setCachedUrl', () => {
        it('should save entry with expiration', async () => {
            await service.setCachedUrl('http://test.com', { content: 'test' });

            expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                url: 'http://test.com',
                expiresAt: expect.any(Date)
            }));
        });
    });

    describe('cleanupCache', () => {
        it('should remove expired entries', async () => {
            mockRepo.delete.mockResolvedValue({ affected: 5 });

            const result = await service.cleanupCache({ removeExpired: true });

            expect(result.expiredRemoved).toBe(5);
        });
    });
});
