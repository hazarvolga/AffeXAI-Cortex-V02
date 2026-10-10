import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitoringAlertingService } from './monitoring-alerting.service';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { LearningAnalyticsService } from './learning-analytics.service';
import { MailService } from '../../mail/mail.service'; // Assuming path or mock

// Mock MailService
class MockMailService {
    sendAlert = jest.fn();
}

describe('MonitoringAlertingService', () => {
    let service: MonitoringAlertingService;
    let configRepository: Repository<FaqLearningConfig>;
    let analyticsService: LearningAnalyticsService;
    let mailService: MailService; // Mocked

    const mockConfigRepository = {
        find: jest.fn(),
    };

    const mockAnalyticsService = {
        getLearningEffectiveness: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MonitoringAlertingService,
                {
                    provide: getRepositoryToken(FaqLearningConfig),
                    useValue: mockConfigRepository,
                },
                {
                    provide: LearningAnalyticsService,
                    useValue: mockAnalyticsService,
                },
                {
                    provide: MailService, // Providing mocked service token if it exists in module system, or string token
                    useValue: new MockMailService(), // Assuming class injection or useValue
                    // If MailService is not important for unit logic (just side effect), mocking is enough
                },
            ],
        }).compile();

        service = module.get<MonitoringAlertingService>(MonitoringAlertingService);
        configRepository = module.get(getRepositoryToken(FaqLearningConfig));
        analyticsService = module.get(LearningAnalyticsService);
        mailService = module.get(MailService); // Might need specific token

        jest.clearAllMocks();
    });

    describe('createAlert', () => {
        it('should create and store alert', async () => {
            const alert = await service.createAlert({
                type: 'test' as any,
                severity: 'info' as any,
                title: 'Test',
                message: 'Msg'
            });

            expect(alert.id).toBeDefined();
            expect(service.getActiveAlerts()).toHaveLength(1);
        });
    });

    describe('resolveAlert', () => {
        it('should mark alert as resolved', async () => {
            const alert = await service.createAlert({
                type: 'test' as any,
                severity: 'info' as any,
                title: 'Test',
                message: 'Msg'
            });

            await service.resolveAlert(alert.id);

            expect(service.getActiveAlerts()).toHaveLength(0);
            expect(service.getAllAlerts().find(a => a.id === alert.id)?.resolved).toBe(true);
        });
    });

    describe('performHealthCheck', () => {
        it('should run checks and create alerts if issues found', async () => {
            // Mock internal check methods
            jest.spyOn(service, 'checkDatabaseHealth').mockResolvedValue({ status: 'critical', message: 'DB Down' });
            jest.spyOn(service, 'createAlert');

            await service.performHealthCheck();

            expect(service.createAlert).toHaveBeenCalledWith(expect.objectContaining({
                type: expect.stringMatching(/system_health/i) // or whatever logic uses
            }));
        });
    });

    describe('checkPerformanceMetrics', () => {
        it('should alert on low approval rate', async () => {
            mockAnalyticsService.getLearningEffectiveness.mockResolvedValue({
                approvalRate: 0.5 // Below hypothetical threshold
            });
            jest.spyOn(service, 'createAlert');

            await service.checkPerformanceMetrics();

            expect(service.createAlert).toHaveBeenCalled();
        });
    });

    describe('clearResolvedAlerts', () => {
        it('should remove resolved alerts', async () => {
            const alert = await service.createAlert({ type: 't', severity: 'i', title: 't', message: 'm' } as any);
            await service.resolveAlert(alert.id);

            const count = service.clearResolvedAlerts();

            expect(count).toBe(1);
            expect(service.getAllAlerts()).toHaveLength(0);
        });
    });
});
