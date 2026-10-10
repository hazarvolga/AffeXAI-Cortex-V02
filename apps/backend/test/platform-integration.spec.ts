import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { WebhookService } from '../src/modules/platform-integration/services/webhook.service';
import { AutomationExecutorService } from '../src/modules/platform-integration/services/automation-executor.service';
import { Webhook, WebhookAuthType } from '../src/modules/platform-integration/entities/webhook.entity';
import { AutomationRule } from '../src/modules/platform-integration/entities/automation-rule.entity';
import { AutomationApproval, ApprovalStatus, ActionImpactLevel } from '../src/modules/platform-integration/entities/automation-approval.entity';
import { PlatformEventType } from '../src/modules/platform-integration/entities/platform-event.entity';
import { EmailCampaignService } from '../src/modules/email-marketing/email-campaign.service';
import { TenantService } from '../src/core/tenant/tenant.service';
import { DataSource } from 'typeorm';

/**
 * Platform-integration unit tests: webhook create/dispatch (incl. retry +
 * tenant stamping) and automation rule approval flow.
 */
describe('PlatformIntegration (webhooks + automation rules)', () => {
    describe('WebhookService', () => {
        let service: WebhookService;

        const mockRepo = {
            create: jest.fn((d: any) => d),
            save: jest.fn((d: any) => Promise.resolve({ id: 'wh-1', ...d })),
            find: jest.fn(),
            findOne: jest.fn(),
            softDelete: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
        };
        const mockHttp = { post: jest.fn(), get: jest.fn() };

        const qb: any = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        };

        const makeHook = (overrides: Partial<any> = {}): any => ({
            id: 'wh-1',
            name: 'Slack hook',
            url: 'https://hooks.example.com/x',
            isActive: true,
            retryCount: 0,
            retryDelay: 0,
            timeout: 1000,
            customHeaders: {},
            getAuthHeaders: jest.fn().mockReturnValue({}),
            recordCall: jest.fn(),
            ...overrides,
        });

        const event: any = {
            id: 'evt-1',
            eventType: PlatformEventType.CAMPAIGN_SENT,
            tenantId: 'acme',
            source: 'email-marketing',
            createdAt: new Date(),
            payload: { campaignId: 'c-1' },
            metadata: {},
        };

        beforeEach(async () => {
            process.env.WEBHOOK_ALLOWED_HOSTS = 'x,hooks.example.com';
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    WebhookService,
                    { provide: getRepositoryToken(Webhook), useValue: mockRepo },
                    { provide: HttpService, useValue: mockHttp },
                ],
            }).compile();

            service = module.get(WebhookService);
            jest.clearAllMocks();
            jest.spyOn(service as any, 'createPinnedHttpsAgent').mockResolvedValue({
                destroy: jest.fn(),
            });
            mockRepo.create.mockImplementation((d: any) => d);
            mockRepo.save.mockImplementation((d: any) => Promise.resolve({ id: 'wh-1', ...d }));
            mockRepo.createQueryBuilder.mockReturnValue(qb);
            mockHttp.post.mockReturnValue(of({ status: 200 }));
        });

        it('creates a webhook stamped with the tenant and safe defaults', async () => {
            await service.create({ name: 'Hook', url: 'https://x', subscribedEvents: [PlatformEventType.CAMPAIGN_SENT] }, 'acme');

            expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                isActive: true,
                authType: WebhookAuthType.NONE,
                tenantId: 'acme',
            }));
        });

        it('dispatches the event payload and records a successful call', async () => {
            const hook = makeHook();

            await service.triggerWebhook(hook, event);

            expect(mockHttp.post).toHaveBeenCalledWith(
                'https://hooks.example.com/x',
                expect.objectContaining({ data: expect.objectContaining({ campaignId: 'c-1' }) }),
                expect.anything(),
            );
            expect(hook.recordCall).toHaveBeenCalledWith(true, 200);
            expect(mockRepo.save).toHaveBeenCalledWith(hook);
        });

        it('retries on failure, records it, and propagates it to the durable dispatcher', async () => {
            const hook = makeHook({ retryCount: 1 });
            mockHttp.post.mockReturnValue(throwError(() => Object.assign(new Error('boom'), { response: { status: 500 } })));

            await expect(service.triggerWebhook(hook, event)).rejects.toThrow('Webhook failed');

            expect(mockHttp.post).toHaveBeenCalledTimes(2); // initial + 1 retry
            expect(hook.recordCall).toHaveBeenCalledWith(false, 500, 'boom');
        });

        it('dispatches only when subscribed webhooks exist (tenant-scoped query)', async () => {
            await service.handlePlatformEvent({ event, payload: event.payload });
            expect(mockHttp.post).not.toHaveBeenCalled();

            qb.getMany.mockResolvedValueOnce([makeHook()]);
            await service.handlePlatformEvent({ event, payload: event.payload });
            expect(mockHttp.post).toHaveBeenCalledTimes(1);
            expect(qb.andWhere).toHaveBeenCalledWith('webhook.tenantId = :tenantId', { tenantId: 'acme' });
        });

        it('testWebhook reports success/failure instead of throwing', async () => {
            mockRepo.findOne.mockResolvedValue(makeHook());
            const ok = await service.testWebhook('wh-1', 'acme');
            expect(ok.success).toBe(true);
            expect(ok.status).toBe(200);

            mockHttp.post.mockReturnValue(throwError(() => Object.assign(new Error('down'), { response: { status: 503 } })));
            const bad = await service.testWebhook('wh-1', 'acme');
            expect(bad.success).toBe(false);
            expect(bad.status).toBe(503);
        });

        it('throws when testing a webhook that does not belong to the tenant', async () => {
            mockRepo.findOne.mockResolvedValue(null);
            await expect(service.testWebhook('wh-x', 'acme')).rejects.toThrow('Webhook not found');
        });
    });

    describe('AutomationExecutorService', () => {
        let service: AutomationExecutorService;

        const mockRuleRepo = { find: jest.fn(), update: jest.fn() };
        const mockApprovalRepo = {
            create: jest.fn((d: any) => ({ id: 'ap-1', ...d })),
            save: jest.fn((d: any) => Promise.resolve(d)),
            findOne: jest.fn(),
            find: jest.fn(),
        };
        const mockEmail = { create: jest.fn(), findBySlug: jest.fn(), sendCampaign: jest.fn() };
        const mockWebhookService = { findOne: jest.fn(), triggerWebhook: jest.fn() };
        const mockTenantService = { runWithTenant: jest.fn((_ctx: any, fn: any) => fn()) };
        const mockDataSource = {
            query: jest.fn(async (sql: string) => sql.includes('INSERT INTO automation_action_executions')
                ? [{ status: 'processing', lease_token: 'lease-token' }]
                : sql.includes('RETURNING lease_token')
                    ? [{ lease_token: 'lease-token' }]
                    : []),
        };

        const makeRule = (overrides: Partial<any> = {}): any => ({
            id: 'rule-1',
            tenantId: 'acme',
            name: 'Notify on send',
            actions: [],
            requiresApproval: false,
            executionCount: 0,
            impactLevel: ActionImpactLevel.MEDIUM,
            ...overrides,
        });

        const platformEvent: any = {
            id: 'evt-9',
            eventType: PlatformEventType.CAMPAIGN_SENT,
            tenantId: 'acme',
            payload: { recipientCount: 10 },
            metadata: { userId: 'u-1' },
        };

        beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    AutomationExecutorService,
                    { provide: getRepositoryToken(AutomationRule), useValue: mockRuleRepo },
                    { provide: getRepositoryToken(AutomationApproval), useValue: mockApprovalRepo },
                    { provide: EmailCampaignService, useValue: mockEmail },
                    { provide: WebhookService, useValue: mockWebhookService },
                    { provide: TenantService, useValue: mockTenantService },
                    { provide: DataSource, useValue: mockDataSource },
                ],
            }).compile();

            service = module.get(AutomationExecutorService);
            jest.clearAllMocks();
            mockTenantService.runWithTenant.mockImplementation((_ctx: any, fn: any) => fn());
            mockRuleRepo.update.mockResolvedValue({ affected: 1 });
            mockApprovalRepo.create.mockImplementation((d: any) => ({ id: 'ap-1', ...d }));
            mockApprovalRepo.save.mockImplementation((d: any) => Promise.resolve(d));
        });

        it('creates a PENDING approval inside the tenant context when approval is required', async () => {
            const rule = makeRule({ requiresApproval: true, impactLevel: ActionImpactLevel.HIGH, actions: [{ type: 'email.create_campaign', config: {}, order: 1 }] });

            await service.handleAutomationTrigger({ rule, event: platformEvent });

            expect(mockTenantService.runWithTenant).toHaveBeenCalledWith(
                { tenantId: 'acme' },
                expect.any(Function),
            );
            expect(mockApprovalRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                ruleId: 'rule-1',
                eventId: 'evt-9',
                tenantId: 'acme',
                status: ApprovalStatus.PENDING,
            }));
            expect(mockApprovalRepo.save).toHaveBeenCalled();
            expect(mockRuleRepo.update).not.toHaveBeenCalled(); // nothing executed yet
        });

        it('rejects legacy rules that bypass mandatory approval', async () => {
            const rule = makeRule({ requiresApproval: false, actions: [] });

            await expect(service.dispatch(rule, platformEvent))
                .rejects.toThrow('mandatory approval policy');

            expect(mockApprovalRepo.create).not.toHaveBeenCalled();
            expect(mockRuleRepo.update).not.toHaveBeenCalled();
        });

        it('refuses to execute an approved automation twice', async () => {
            mockApprovalRepo.findOne.mockResolvedValue({
                status: ApprovalStatus.APPROVED,
                isExecuted: true,
                rule: makeRule(),
                event: platformEvent,
                pendingActions: [],
            });

            await service.executeApprovedAutomation('ap-1', 'acme');

            expect(mockApprovalRepo.save).not.toHaveBeenCalled();
        });
    });
});
