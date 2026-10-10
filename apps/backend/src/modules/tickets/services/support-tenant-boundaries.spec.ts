import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';
import { SlaService } from './sla.service';
import { BusinessHoursService } from './business-hours.service';
import { TicketAnalyticsService } from './ticket-analytics.service';
import { TicketAssignmentRulesService } from './ticket-assignment-rules.service';
import { TicketEscalationRulesService } from './ticket-escalation-rules.service';
import { TicketMacroService } from './ticket-macro.service';
import { TicketsService } from '../tickets.service';
import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { TicketMacro } from '../entities/ticket-macro.entity';
import { TicketAssignmentRule } from '../entities/ticket-assignment-rule.entity';
import { TicketEscalationRule } from '../entities/ticket-escalation-rule.entity';
describe('support services never execute unscoped tenant queries', () => {
  const read = jest.fn(async () => []);
  it.each([
    [SlaService, 'getTicketsApproachingSLABreach'],
    [TicketAnalyticsService, 'getOverallStats'],
    [TicketAssignmentRulesService, 'getActiveRules'],
    [TicketEscalationRulesService, 'getActiveRules'],
    [TicketMacroService, 'getAllMacros'],
  ] as const)('%s rejects a missing tenant before persistence', async (Service, method) => {
    read.mockClear();
    const module = await Test.createTestingModule({ providers: [Service,
      { provide: TenantService, useValue: { getTenantId: () => undefined } },
      { provide: BusinessHoursService, useValue: {} }, { provide: TicketsService, useValue: {} },
      ...[Ticket, TicketMessage, TicketMacro, TicketAssignmentRule, TicketEscalationRule].map(entity => ({ provide: getRepositoryToken(entity), useValue: { find: read, createQueryBuilder: read } })),
    ] }).compile();
    const service = module.get(Service) as unknown as Record<string, () => Promise<unknown>>;
    await expect(service[method]()).rejects.toMatchObject({ status: 403 });
    expect(read).not.toHaveBeenCalled(); await module.close();
  });
});
