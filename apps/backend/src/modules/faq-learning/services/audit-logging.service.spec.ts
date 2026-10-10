import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLoggingService, AuditAction, AuditSeverity } from './audit-logging.service';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';

describe('AuditLoggingService', () => {
    let service: AuditLoggingService;
    let configRepository: Repository<FaqLearningConfig>;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditLoggingService,
                {
                    provide: getRepositoryToken(FaqLearningConfig),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<AuditLoggingService>(AuditLoggingService);
        configRepository = module.get(getRepositoryToken(FaqLearningConfig));

        jest.clearAllMocks();
    });

    describe('logAction', () => {
        it('should log an event', async () => {
            const log = await service.logAction({
                action: AuditAction.USER_ACCESS,
                resourceType: 'system',
                userId: 'u1'
            });

            expect(log).toBeDefined();
            expect(log.action).toBe(AuditAction.USER_ACCESS);
            expect(log.timestamp).toBeInstanceOf(Date);
        });
    });

    describe('getAuditLogs', () => {
        it('should filter logs', async () => {
            await service.logAction({ action: AuditAction.USER_ACCESS, resourceType: 'system', userId: 'u1' });
            await service.logAction({ action: AuditAction.CONFIGURATION_CHANGE, resourceType: 'config' });

            const logs = service.getAuditLogs({ action: AuditAction.USER_ACCESS });

            expect(logs).toHaveLength(1);
            expect(logs[0].action).toBe(AuditAction.USER_ACCESS);
        });
    });

    describe('checkAccess', () => {
        it('should allow access if role permitted', async () => {
            // Mock hasPermission to true
            jest.spyOn(service, 'hasPermission').mockReturnValue(true);

            const check = await service.checkAccess({
                userId: 'u1',
                userRole: 'admin',
                action: 'write',
                resourceType: 'config'
            });

            expect(check.allowed).toBe(true);
        });

        it('should deny if role insufficient', async () => {
            jest.spyOn(service, 'hasPermission').mockReturnValue(false);

            const check = await service.checkAccess({
                userId: 'u1',
                userRole: 'viewer',
                action: 'write',
                resourceType: 'config'
            });

            expect(check.allowed).toBe(false);
        });
    });

    describe('logSecurityEvent', () => {
        it('should log security event with high severity', async () => {
            await service.logSecurityEvent({
                eventType: 'Login Failure',
                severity: AuditSeverity.WARNING,
                details: {}
            });

            const logs = service.getAuditLogs({ action: AuditAction.SECURITY_EVENT });
            expect(logs).toHaveLength(1);
            expect(logs[0].severity).toBe(AuditSeverity.WARNING);
        });
    });

    describe('exportAuditLogs', () => {
        it('should export to CSV', async () => {
            await service.logAction({ action: AuditAction.USER_ACCESS, resourceType: 'test' });

            const csv = await service.exportAuditLogs({ format: 'csv' });

            expect(csv).toContain('Action,Severity,User ID');
            expect(csv).toContain(AuditAction.USER_ACCESS);
        });
    });
});
