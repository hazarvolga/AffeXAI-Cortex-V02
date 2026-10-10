import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from '../tracking.service';
import { EmailLog } from '../entities/email-log.entity';
import { EmailCampaign } from '../entities/email-campaign.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { EmailOpenHistory } from '../entities/email-open-history.entity';

describe('TrackingService', () => {
    let service: TrackingService;
    let emailLogRepository: Repository<EmailLog>;
    let campaignRepository: Repository<EmailCampaign>;
    let subscriberRepository: Repository<Subscriber>;
    let emailOpenHistoryRepository: Repository<EmailOpenHistory>;
    let configService: ConfigService;

    const mockEmailLog: Partial<EmailLog> = {
        id: '123',
        trackingId: 'track-123',
        campaignId: 'campaign-123',
        recipientEmail: 'test@example.com',
        sentAt: new Date(),
        openedAt: null,
        clickedAt: null,
    };

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getCount: jest.fn(),
        })),
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TrackingService,
                {
                    provide: getRepositoryToken(EmailLog),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(EmailCampaign),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(Subscriber),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(EmailOpenHistory),
                    useValue: mockRepository,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<TrackingService>(TrackingService);
        emailLogRepository = module.get(getRepositoryToken(EmailLog));
        campaignRepository = module.get(getRepositoryToken(EmailCampaign));
        subscriberRepository = module.get(getRepositoryToken(Subscriber));
        emailOpenHistoryRepository = module.get(getRepositoryToken(EmailOpenHistory));
        configService = module.get<ConfigService>(ConfigService);

        jest.clearAllMocks();
    });

    describe('generateTrackingData', () => {
        it('should generate tracking data with pixel URL and link wrapper', async () => {
            mockRepository.create.mockReturnValue(mockEmailLog);
            mockRepository.save.mockResolvedValue(mockEmailLog);

            const result = await service.generateTrackingData('campaign-123', 'test@example.com');

            expect(result).toHaveProperty('trackingId');
            expect(result).toHaveProperty('pixelUrl');
            expect(result).toHaveProperty('linkWrapper');
            expect(typeof result.linkWrapper).toBe('function');
        });

        it('should create email log entry', async () => {
            mockRepository.create.mockReturnValue(mockEmailLog);
            mockRepository.save.mockResolvedValue(mockEmailLog);

            await service.generateTrackingData('campaign-123', 'test@example.com');

            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('trackEmailOpen', () => {
        it('should track email open event', async () => {
            mockRepository.findOne.mockResolvedValue(mockEmailLog);
            mockRepository.save.mockResolvedValue({
                ...mockEmailLog,
                openedAt: new Date(),
            });
            mockRepository.create.mockReturnValue({});

            await service.trackEmailOpen('track-123', {
                userAgent: 'Mozilla/5.0',
                ipAddress: '192.168.1.1',
                timestamp: new Date(),
            });

            expect(mockRepository.findOne).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should not track duplicate opens within 5 minutes', async () => {
            const recentlyOpened = {
                ...mockEmailLog,
                openedAt: new Date(),
            };
            mockRepository.findOne.mockResolvedValue(recentlyOpened);

            await service.trackEmailOpen('track-123', {
                timestamp: new Date(),
            });

            expect(mockRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('trackEmailClick', () => {
        it('should track email click event', async () => {
            mockRepository.findOne.mockResolvedValue(mockEmailLog);
            mockRepository.save.mockResolvedValue({
                ...mockEmailLog,
                clickedAt: new Date(),
            });

            await service.trackEmailClick('track-123', {
                originalUrl: 'https://example.com',
                timestamp: new Date(),
            });

            expect(mockRepository.findOne).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('getTrackingStats', () => {
        it('should return tracking statistics for campaign', async () => {
            const mockStats = {
                totalSent: 100,
                totalOpened: 50,
                totalClicked: 25,
            };

            mockRepository.createQueryBuilder().getCount.mockResolvedValue(100);
            mockRepository.createQueryBuilder().getMany.mockResolvedValue([]);

            const result = await service.getTrackingStats('campaign-123');

            expect(result).toHaveProperty('campaignId');
            expect(result).toHaveProperty('totalSent');
            expect(result).toHaveProperty('openRate');
            expect(result).toHaveProperty('clickRate');
        });
    });

    describe('detectDeviceType', () => {
        it('should detect mobile device', () => {
            const result = service.detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
            expect(result).toBe('mobile');
        });

        it('should detect tablet device', () => {
            const result = service.detectDeviceType('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)');
            expect(result).toBe('tablet');
        });

        it('should detect desktop device', () => {
            const result = service.detectDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
            expect(result).toBe('desktop');
        });

        it('should return unknown for undefined user agent', () => {
            const result = service.detectDeviceType(undefined);
            expect(result).toBe('unknown');
        });
    });

    describe('detectEmailClient', () => {
        it('should detect Gmail', () => {
            const result = service.detectEmailClient('Mozilla/5.0 Gmail');
            expect(result).toBe('Gmail');
        });

        it('should detect Outlook', () => {
            const result = service.detectEmailClient('Microsoft Outlook');
            expect(result).toBe('Outlook');
        });

        it('should return unknown for unrecognized client', () => {
            const result = service.detectEmailClient('Unknown Client');
            expect(result).toBe('Unknown');
        });
    });
});
