import { AutomationRule } from '../entities/automation-rule.entity';
import { PlatformEvent } from '../entities/platform-event.entity';
import { AutomationDispatchWorker } from './automation-dispatch.worker';

describe('AutomationDispatchWorker', () => {
  const row = {
    event_id: '8f890f69-7e27-4a7f-a80c-89f3b6799301',
    rule_id: 'd7585519-2cf9-4a39-aadf-bb91ca0c8856', tenant_id: 'tenant-a',
    lease_token: '0eea2bfd-0cf5-44ab-9486-9fea4f165bb2', attempts: 1, // gitleaks:allow -- synthetic lease fixture
  };
  const event = { id: row.event_id, tenantId: 'tenant-a' };
  const rule = { id: row.rule_id, tenantId: 'tenant-a', isActive: true, shouldTrigger: jest.fn(() => true) };
  const eventRepo = { findOne: jest.fn().mockResolvedValue(event) };
  const ruleRepo = { findOne: jest.fn().mockResolvedValue(rule) };
  const db = {
    query: jest.fn(),
    getRepository: jest.fn((entity) => entity === PlatformEvent ? eventRepo : ruleRepo),
  };
  const executor = { dispatch: jest.fn().mockResolvedValue(undefined) };
  let worker: AutomationDispatchWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    eventRepo.findOne.mockResolvedValue(event);
    ruleRepo.findOne.mockResolvedValue(rule);
    executor.dispatch.mockResolvedValue(undefined);
    db.query.mockResolvedValueOnce([row]).mockResolvedValue([]);
    worker = new AutomationDispatchWorker(db as any, executor as any);
  });

  it('claims, executes and acknowledges matching tenant work', async () => {
    await worker.drain();
    expect(eventRepo.findOne).toHaveBeenCalledWith({ where: { id: row.event_id, tenantId: 'tenant-a' } });
    expect(ruleRepo.findOne).toHaveBeenCalledWith({ where: { id: row.rule_id, tenantId: 'tenant-a' } });
    expect(executor.dispatch).toHaveBeenCalledWith(rule, event);
    expect(db.query.mock.calls.at(-1)?.[1]).toEqual(expect.arrayContaining(['delivered']));
    expect(db.query.mock.calls.at(-1)?.[0]).toContain('triggeredRules');
  });

  it('requeues a failed execution without exposing its error', async () => {
    executor.dispatch.mockRejectedValue(new Error('sensitive provider detail'));
    await worker.drain();
    expect(db.query.mock.calls.at(-1)?.[1]).toEqual(expect.arrayContaining(['pending', 'execution_failed']));
  });

  it('marks missing or inactive work as skipped', async () => {
    ruleRepo.findOne.mockResolvedValue({ ...rule, isActive: false });
    await worker.drain();
    expect(executor.dispatch).not.toHaveBeenCalled();
    expect(db.query.mock.calls.at(-1)?.[1]).toEqual(expect.arrayContaining(['skipped']));
  });
});
