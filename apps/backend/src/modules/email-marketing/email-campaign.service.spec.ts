import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailCampaignService } from '../email-campaign.service';
import { EmailCampaign } from '../entities/email-campaign.entity';
import { CacheService } from '../../../core/shared/services/cache.service';
import { EventBusService } from '../../../platform-integration/services/event-bus.service';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';

describe('EmailCampaignService', () => {
    let service: EmailCampaignService;
    let campaignRepository: Repository<EmailCampaign>;
    let emailQueue: Queue;
    let cacheService: CacheService;
    let eventBusService: EventBusService;

    const mockCampaign: Partial<EmailCampaign> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Campaign',
        subject: 'Test Subject',
        content: 'Test Content',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        sentCount: 0,
        openedCount: 0,
        clickedCount: 0,
        totalRecipients: 0,
    };

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        increment: jest.fn(),
    };

    const mockQueue = {
        add: jest.fn(),
    };

    const mockCacheService = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    };

    const mockEventBusService = {
        publishCampaignSent: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailCampaignService,
                {
                    provide: getRepositoryToken(EmailCampaign),
                    useValue: mockRepository,
                },
                {
                    provide: getQueueToken('email'),
                    useValue: mockQueue,
                },
                {
                    provide: CacheService,
                    useValue: mockCacheService,
                },
                {
                    provide: EventBusService,
                    useValue: mockEventBusService,
                },
            ],
        }).compile();

        service = module.get<EmailCampaignService>(EmailCampaignService);
        campaignRepository = module.get<Repository<EmailCampaign>>(
            getRepositoryToken(EmailCampaign),
        );
        emailQueue = module.get<Queue>(getQueueToken('email'));
        cacheService = module.get<CacheService>(CacheService);
        eventBusService = module.get<EventBusService>(EventBusService);

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new campaign', async () => {
            const createDto: CreateCampaignDto = {
                name: 'New Campaign',
                subject: 'New Subject',
                content: 'New Content',
            };

            mockRepository.create.mockReturnValue(mockCampaign);
            mockRepository.save.mockResolvedValue(mockCampaign);
            mockCacheService.del.mockResolvedValue(undefined);

            const result = await service.create(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(mockRepository.save).toHaveBeenCalledWith(mockCampaign);
            expect(mockCacheService.del).toHaveBeenCalledWith('email-campaigns:all');
            expect(result).toEqual(mockCampaign);
        });

        it('should clear cache after creating campaign', async () => {
            const createDto: CreateCampaignDto = {
                name: 'New Campaign',
                subject: 'New Subject',
                content: 'New Content',
            };

            mockRepository.create.mockReturnValue(mockCampaign);
            mockRepository.save.mockResolvedValue(mockCampaign);
            mockCacheService.del.mockResolvedValue(undefined);

            await service.create(createDto);

            expect(mockCacheService.del).toHaveBeenCalledTimes(1);
            expect(mockCacheService.del).toHaveBeenCalledWith('email-campaigns:all');
        });
    });

    describe('findAll', () => {
        it('should return cached campaigns if available', async () => {
            const campaigns = [mockCampaign];
            mockCacheService.get.mockResolvedValue(campaigns);

            const result = await service.findAll();

            expect(mockCacheService.get).toHaveBeenCalledWith('email-campaigns:all');
            expect(mockRepository.find).not.toHaveBeenCalled();
            expect(result).toEqual(campaigns);
        });

        it('should fetch from database and cache if not cached', async () => {
            const campaigns = [mockCampaign];
            mockCacheService.get.mockResolvedValue(null);
            mockRepository.find.mockResolvedValue(campaigns);
            mockCacheService.set.mockResolvedValue(undefined);

            const result = await service.findAll();

            expect(mockCacheService.get).toHaveBeenCalledWith('email-campaigns:all');
            expect(mockRepository.find).toHaveBeenCalledWith({
                order: { createdAt: 'DESC' },
            });
            expect(mockCacheService.set).toHaveBeenCalledWith(
                'email-campaigns:all',
                campaigns,
                30,
            );
            expect(result).toEqual(campaigns);
        });
    });

    describe('findOne', () => {
        it('should return cached campaign if available', async () => {
            mockCacheService.get.mockResolvedValue(mockCampaign);

            const result = await service.findOne(mockCampaign.id);

            expect(mockCacheService.get).toHaveBeenCalledWith(
                `email-campaigns:${mockCampaign.id}`,
            );
            expect(mockRepository.findOne).not.toHaveBeenCalled();
            expect(result).toEqual(mockCampaign);
        });

        it('should fetch from database and cache if not cached', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockRepository.findOne.mockResolvedValue(mockCampaign);
            mockCacheService.set.mockResolvedValue(undefined);

            const result = await service.findOne(mockCampaign.id);

            expect(mockCacheService.get).toHaveBeenCalledWith(
                `email-campaigns:${mockCampaign.id}`,
            );
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockCampaign.id },
            });
            expect(mockCacheService.set).toHaveBeenCalledWith(
                `email-campaigns:${mockCampaign.id}`,
                mockCampaign,
                60,
            );
            expect(result).toEqual(mockCampaign);
        });

        it('should throw error if campaign not found', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent-id')).rejects.toThrow(
                'Campaign not found',
            );
        });
    });

    describe('update', () => {
        it('should update campaign and clear cache', async () => {
            const updateDto: UpdateCampaignDto = {
                name: 'Updated Campaign',
            };

            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockRepository.findOne.mockResolvedValue({
                ...mockCampaign,
                ...updateDto,
            });
            mockCacheService.del.mockResolvedValue(undefined);

            const result = await service.update(mockCampaign.id, updateDto);

            expect(mockRepository.update).toHaveBeenCalledWith(
                mockCampaign.id,
                updateDto,
            );
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockCampaign.id },
            });
            expect(mockCacheService.del).toHaveBeenCalledWith(
                `email-campaigns:${mockCampaign.id}`,
            );
            expect(mockCacheService.del).toHaveBeenCalledWith('email-campaigns:all');
            expect(result).toEqual({ ...mockCampaign, ...updateDto });
        });

        it('should throw error if campaign not found', async () => {
            const updateDto: UpdateCampaignDto = {
                name: 'Updated Campaign',
            };

            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockRepository.findOne.mockResolvedValue(null);

            await expect(
                service.update('non-existent-id', updateDto),
            ).rejects.toThrow('Campaign not found');
        });
    });

    describe('remove', () => {
        it('should delete campaign and clear cache', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });
            mockCacheService.del.mockResolvedValue(undefined);

            await service.remove(mockCampaign.id);

            expect(mockRepository.delete).toHaveBeenCalledWith(mockCampaign.id);
            expect(mockCacheService.del).toHaveBeenCalledWith(
                `email-campaigns:${mockCampaign.id}`,
            );
            expect(mockCacheService.del).toHaveBeenCalledWith('email-campaigns:all');
        });
    });

    describe('sendCampaign', () => {
        it('should send campaign and queue emails', async () => {
            const campaignToSend = { ...mockCampaign };
            mockCacheService.get.mockResolvedValue(null);
            mockRepository.findOne.mockResolvedValue(campaignToSend);
            mockRepository.save.mockResolvedValue(campaignToSend);
            mockQueue.add.mockResolvedValue({});
            mockEventBusService.publishCampaignSent.mockResolvedValue(undefined);
            mockCacheService.del.mockResolvedValue(undefined);

            await service.sendCampaign(mockCampaign.id);

            expect(mockRepository.save).toHaveBeenCalledTimes(2);
            expect(mockQueue.add).toHaveBeenCalledTimes(3); // 3 recipients
            expect(mockEventBusService.publishCampaignSent).toHaveBeenCalledWith(
                mockCampaign.id,
                3,
                'system',
            );
            expect(mockCacheService.del).toHaveBeenCalledWith(
                `email-campaigns:${mockCampaign.id}`,
            );
        });

        it('should throw error if campaign not found', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.sendCampaign('non-existent-id')).rejects.toThrow(
                'Campaign not found',
            );
        });

        it('should update campaign status to sending', async () => {
            const campaignToSend = { ...mockCampaign };
            mockCacheService.get.mockResolvedValue(null);
            mockRepository.findOne.mockResolvedValue(campaignToSend);
            mockRepository.save.mockResolvedValue(campaignToSend);
            mockQueue.add.mockResolvedValue({});
            mockEventBusService.publishCampaignSent.mockResolvedValue(undefined);
            mockCacheService.del.mockResolvedValue(undefined);

            await service.sendCampaign(mockCampaign.id);

            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'sending',
                    sentAt: expect.any(Date),
                }),
            );
        });
    });

    describe('incrementSentCount', () => {
        it('should increment sent count and clear cache', async () => {
            mockRepository.increment.mockResolvedValue({ affected: 1 });
            mockCacheService.del.mockResolvedValue(undefined);

            await service.incrementSentCount(mockCampaign.id);

            expect(mockRepository.increment).toHaveBeenCalledWith(
                { id: mockCampaign.id },
                'sentCount',
                1,
            );
            expect(mockCacheService.del).toHaveBeenCalledWith(
                `email-campaigns:${mockCampaign.id}`,
            );
        });
    });

    describe('incrementOpenedCount', () => {
        it('should increment opened count and clear cache', async () => {
            mockRepository.increment.mockResolvedValue({ affected: 1 });
            mockCacheService.del.mockResolvedValue(undefined);

            await service.incrementOpenedCount(mockCampaign.id);

            expect(mockRepository.increment).toHaveBeenCalledWith(
                { id: mockCampaign.id },
                'openedCount',
                1,
            );
            expect(mockCacheService.del).toHaveBeenCalledWith(
                `email-campaigns:${mockCampaign.id}`,
            );
        });
    });

    describe('incrementClickedCount', () => {
        it('should increment clicked count and clear cache', async () => {
            mockRepository.increment.mockResolvedValue({ affected: 1 });
            mockCacheService.del.mockResolvedValue(undefined);

            await service.incrementClickedCount(mockCampaign.id);

            expect(mockRepository.increment).toHaveBeenCalledWith(
                { id: mockCampaign.id },
                'clickedCount',
                1,
            );
            expect(mockCacheService.del).toHaveBeenCalledWith(
                `email-campaigns:${mockCampaign.id}`,
            );
        });
    });

    describe('getCampaignStats', () => {
        it('should return campaign statistics', async () => {
            const campaign = {
                ...mockCampaign,
                totalRecipients: 100,
                sentCount: 95,
                openedCount: 50,
                clickedCount: 25,
            };

            mockCacheService.get.mockResolvedValue(null);
            mockRepository.findOne.mockResolvedValue(campaign);
            mockCacheService.set.mockResolvedValue(undefined);

            const result = await service.getCampaignStats(mockCampaign.id);

            expect(result).toEqual({
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                totalRecipients: 100,
                sentCount: 95,
                openedCount: 50,
                clickedCount: 25,
                completionRate: 95,
            });
        });

        it('should handle zero recipients', async () => {
            const campaign = {
                ...mockCampaign,
                totalRecipients: 0,
                sentCount: 0,
            };

            mockCacheService.get.mockResolvedValue(null);
            mockRepository.findOne.mockResolvedValue(campaign);
            mockCacheService.set.mockResolvedValue(undefined);

            const result = await service.getCampaignStats(mockCampaign.id);

            expect(result.completionRate).toBe(0);
        });

        it('should throw error if campaign not found', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockRepository.findOne.mockResolvedValue(null);

            await expect(
                service.getCampaignStats('non-existent-id'),
            ).rejects.toThrow('Campaign not found');
        });
    });
});
