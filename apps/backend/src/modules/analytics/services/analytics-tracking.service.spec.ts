import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsTrackingService } from './analytics-tracking.service';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { AnalyticsSession } from '../entities/analytics-session.entity';
import { DeviceType, InteractionType, ComponentType } from '../entities/analytics-event.entity';

describe('AnalyticsTrackingService', () => {
    let service: AnalyticsTrackingService;
    let eventRepo: Repository<AnalyticsEvent>;
    let sessionRepo: Repository<AnalyticsSession>;

    const mockEventRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ id: 'e-1', ...d })),
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(10),
    };

    const mockSessionRepo = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ ...d })), // ID provided in input usually
        findOne: jest.fn(),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsTrackingService,
                { provide: getRepositoryToken(AnalyticsEvent), useValue: mockEventRepo },
                { provide: getRepositoryToken(AnalyticsSession), useValue: mockSessionRepo },
            ],
        }).compile();

        service = module.get<AnalyticsTrackingService>(AnalyticsTrackingService);
        eventRepo = module.get(getRepositoryToken(AnalyticsEvent));
        sessionRepo = module.get(getRepositoryToken(AnalyticsSession));

        jest.clearAllMocks();
    });

    describe('trackEvent', () => {
        it('should save event and update interactions', async () => {
            const dto = {
                componentId: 'c1',
                componentType: ComponentType.BUTTON,
                interactionType: InteractionType.CLICK,
                sessionId: 's1',
                pageUrl: '/home',
                deviceType: DeviceType.DESKTOP,
                viewport: { width: 1920, height: 1080 }
            };

            await service.trackEvent(dto as any);

            expect(eventRepo.save).toHaveBeenCalled();
            expect(sessionRepo.update).toHaveBeenCalled();
        });
    });

    describe('trackEventsBatch', () => {
        it('should process batch and upsert session', async () => {
            const dto = {
                session: { id: 's1', startTime: new Date(), deviceType: DeviceType.MOBILE },
                events: [{ componentId: 'c1', sessionId: 's1', viewport: {} } as any]
            };

            // Mock session not found first
            mockSessionRepo.findOne.mockResolvedValue(null);

            const result = await service.trackEventsBatch(dto as any);

            expect(result.success).toBe(true);
            expect(sessionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }));
            expect(eventRepo.save).toHaveBeenCalledTimes(1);
        });
    });

    describe('upsertSession', () => {
        it('should return existing session if found', async () => {
            mockSessionRepo.findOne.mockResolvedValue({ id: 'exist' });
            await (service as any).upsertSession({ id: 'exist' });
            expect(sessionRepo.save).not.toHaveBeenCalled();
        });

        it('should create new session if missing', async () => {
            mockSessionRepo.findOne.mockResolvedValue(null);
            await (service as any).upsertSession({ id: 'new' });
            expect(sessionRepo.save).toHaveBeenCalled();
        });
    });

    describe('endSession', () => {
        it('should calculate duration', async () => {
            const start = new Date('2023-01-01T10:00:00Z');
            const end = new Date('2023-01-01T10:05:00Z');

            mockSessionRepo.findOne.mockResolvedValue({ id: 's1', startTime: start });

            await service.endSession('s1', end);

            expect(sessionRepo.update).toHaveBeenCalledWith('s1', {
                endTime: end,
                duration: 5 * 60 * 1000 // 5 minutes
            });
        });
    });

    describe('markSessionAsConverted', () => {
        it('should update conversion status', async () => {
            await service.markSessionAsConverted('s1', 'signup');
            expect(sessionRepo.update).toHaveBeenCalledWith('s1', {
                converted: true,
                conversionGoal: 'signup'
            });
        });
    });
});
