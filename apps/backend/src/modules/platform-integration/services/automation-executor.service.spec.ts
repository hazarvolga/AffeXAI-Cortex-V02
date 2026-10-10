import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { AutomationApproval, ActionImpactLevel } from '../entities/automation-approval.entity';
import { AutomationRule } from '../entities/automation-rule.entity';
import { AutomationExecutorService } from './automation-executor.service';
import { EmailCampaignService } from '../../email-marketing/email-campaign.service';
import { WebhookService } from './webhook.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { DataSource } from 'typeorm';

describe('AutomationExecutorService', () => {
  const ruleRepo = { update: jest.fn() };
  const approvalRepo = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'approval-1', ...value })),
    find: jest.fn(),
  };
  const emailCampaign = { create: jest.fn(), findBySlug: jest.fn(), sendCampaign: jest.fn() };
  const webhook = { findOne: jest.fn(), triggerWebhook: jest.fn() };
  const tenant = { runWithTenant: jest.fn(async (_context, callback) => callback()) };
  const dataSource = {
    query: jest.fn(async (sql: string) => {
      if (sql.includes('INSERT INTO automation_action_executions')) {
        return [{ status: 'processing', lease_token: 'lease-token' }];
      }
      if (sql.includes('RETURNING lease_token')) return [{ lease_token: 'lease-token' }];
      return [];
    }),
  };
  let service: AutomationExecutorService;

  const event = {
    id: '8f890f69-7e27-4a7f-a80c-89f3b6799301', tenantId: 'tenant-a',
    eventType: 'crm.lead.captured', payload: {}, metadata: {},
  } as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({ providers: [
      AutomationExecutorService,
      { provide: getRepositoryToken(AutomationRule), useValue: ruleRepo },
      { provide: getRepositoryToken(AutomationApproval), useValue: approvalRepo },
      { provide: EmailCampaignService, useValue: emailCampaign },
      { provide: WebhookService, useValue: webhook },
      { provide: TenantService, useValue: tenant },
      { provide: DataSource, useValue: dataSource },
    ] }).compile();
    service = module.get(AutomationExecutorService);
    jest.clearAllMocks();
    dataSource.query.mockReset();
    dataSource.query.mockImplementation(async (sql: string) => {
      if (sql.includes('INSERT INTO automation_action_executions')) {
        return [{ status: 'processing', lease_token: 'lease-token' }];
      }
      if (sql.includes('RETURNING lease_token')) return [{ lease_token: 'lease-token' }];
      return [];
    });
    approvalRepo.findOne.mockResolvedValue(null);
    ruleRepo.update.mockResolvedValue({ affected: 1 });
    emailCampaign.findBySlug.mockRejectedValue(new Error('Campaign not found by slug'));
  });

  it('rejects cross-tenant dispatches before running an action', async () => {
    const rule = { tenantId: 'tenant-b', actions: [], requiresApproval: false } as any;
    await expect(service.dispatch(rule, event)).rejects.toThrow('tenant mismatch');
    expect(tenant.runWithTenant).not.toHaveBeenCalled();
  });

  it('creates one approval for repeated delivery of the same event and rule', async () => {
    const rule = {
      id: 'd7585519-2cf9-4a39-aadf-bb91ca0c8856', tenantId: 'tenant-a',
      name: 'Review captured lead', requiresApproval: true,
      impactLevel: ActionImpactLevel.MEDIUM, actions: [],
    } as any;
    await service.dispatch(rule, event);
    expect(approvalRepo.save).toHaveBeenCalledTimes(1);
    expect(approvalRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      requestContext: expect.objectContaining({
        eventId: event.id,
        authorizedApprovers: [],
      }),
    }));
    expect(approvalRepo.create.mock.calls[0][0].requestContext).not.toHaveProperty('eventPayload');
    approvalRepo.findOne.mockResolvedValue({ id: 'approval-1' });
    await service.dispatch(rule, event);
    expect(approvalRepo.save).toHaveBeenCalledTimes(1);
  });

  it('persists failure details and rejects so the durable worker retries', async () => {
    const rule = {
      id: 'd7585519-2cf9-4a39-aadf-bb91ca0c8856', tenantId: 'tenant-a',
      name: 'Broken action', requiresApproval: false, executionCount: 0,
      actions: [{ type: 'notification.send', config: {}, order: 1 }],
    } as any;
    await expect(service.executeRule(rule, event)).rejects.toThrow('not implemented');
    expect(ruleRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: rule.id, tenantId: 'tenant-a' }),
      expect.objectContaining({
        lastExecutionResult: expect.objectContaining({ success: false, actionsExecuted: 0 }),
      }),
    );
  });

  it('does not repeat an action that its execution ledger already delivered', async () => {
    dataSource.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'delivered', lease_token: 'lease-token' }] as any)
      .mockResolvedValue([]);
    const rule = {
      id: 'd7585519-2cf9-4a39-aadf-bb91ca0c8856', tenantId: 'tenant-a',
      name: 'Create campaign once', requiresApproval: false, executionCount: 1,
      actions: [{ type: 'email.create_campaign', config: { name: 'Lead follow-up' }, order: 1 }],
    } as any;
    await service.executeRule(rule, event);
    expect(emailCampaign.create).not.toHaveBeenCalled();
  });

  it('passes a stable event-rule-action idempotency key to webhook delivery', async () => {
    const rule = {
      id: 'd7585519-2cf9-4a39-aadf-bb91ca0c8856', tenantId: 'tenant-a',
      name: 'Notify webhook', requiresApproval: false, executionCount: 0,
      actions: [{ type: 'webhook.trigger', config: { webhookId: 'webhook-1' }, order: 2 }],
    } as any;
    webhook.findOne.mockResolvedValue({ id: 'webhook-1', name: 'Receiver' });

    await service.executeRule(rule, event);

    expect(webhook.triggerWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'webhook-1' }),
      event,
      `${event.id}:${rule.id}:2`,
    );
  });

  it('reuses a deterministically named campaign after a post-create retry', async () => {
    const rule = {
      id: 'd7585519-2cf9-4a39-aadf-bb91ca0c8856', tenantId: 'tenant-a',
      name: 'Create campaign', requiresApproval: false, executionCount: 0,
      actions: [{ type: 'email.create_campaign', config: { name: 'Lead follow-up' }, order: 3 }],
    } as any;
    emailCampaign.findBySlug.mockResolvedValue({ id: 'campaign-existing' });

    await service.executeRule(rule, event);

    expect(emailCampaign.findBySlug).toHaveBeenCalledWith(
      `automation-${event.id}-${rule.id}-3`,
    );
    expect(emailCampaign.create).not.toHaveBeenCalled();
  });

  it('executes the approved action snapshot instead of mutable current rule actions', async () => {
    const approved = {
      id: 'approval-1',
      tenantId: 'tenant-a',
      status: 'approved',
      isExecuted: false,
      pendingActions: [
        {
          type: 'email.create_campaign',
          config: { name: 'Reviewed campaign' },
          order: 4,
          estimatedImpact: { affectedUsers: 1 },
        },
      ],
      rule: {
        id: 'd7585519-2cf9-4a39-aadf-bb91ca0c8856',
        tenantId: 'tenant-a',
        name: 'Changed after approval',
        actions: [{ type: 'notification.send', config: {}, order: 4 }],
      },
      event,
    } as any;
    approvalRepo.findOne.mockResolvedValue(approved);
    emailCampaign.create.mockResolvedValue({ id: 'campaign-new' });

    await service.executeApprovedAutomation('approval-1', 'tenant-a');

    expect(emailCampaign.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Reviewed campaign',
    }));
    expect(approved.isExecuted).toBe(true);
  });
});
