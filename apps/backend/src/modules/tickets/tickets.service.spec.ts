import { TicketsService } from './tickets.service';
import { TenantService } from '../../core/tenant/tenant.service';
import { TicketStatus } from './enums/ticket-status.enum';
import { TicketPriority } from './enums/ticket-priority.enum';

jest.mock('../mail/mail.service', () => ({ MailService: class {} }));
jest.mock('./services/ticket-email.service', () => ({ TicketEmailService: class {} }));
jest.mock('./gateways/ticket-notifications.gateway', () => ({ TicketNotificationsGateway: class {} }));
jest.mock('../settings/settings.service', () => ({ SettingsService: class {} }));
jest.mock('../ai/ai.service', () => ({ AiService: class {} }));
jest.mock('../faq-learning/services/faq-enhanced-search.service', () => ({ FaqEnhancedSearchService: class {} }));
jest.mock('./services/knowledge-base.service', () => ({ KnowledgeBaseService: class {} }));
jest.mock('../strategy/services/strategy.service', () => ({ StrategyService: class {} }));

// Mutation acceptance lives in ticket-resolution-outbox, ticket-attachment-binding,
// ticket-restructure and ticket-tenant-relations specs. This suite exercises the
// current read/statistics contract, replacing imports of removed legacy services.
describe('TicketsService tenant reads and measured statistics', () => {
  const tenants = new TenantService();
  const run = <T>(fn: () => T) => tenants.runWithTenant({tenantId:'tenant-a',source:'authenticated'}, fn);
  let service: TicketsService;
  let repository: any;
  let query: any;
  beforeEach(() => {
    query = { getMany:jest.fn().mockResolvedValue([]),getRawOne:jest.fn().mockResolvedValue({response:'2.75',resolution:'8.25'}) };
    for(const name of ['where','andWhere','leftJoinAndSelect','orderBy','select','addSelect']) query[name]=jest.fn().mockReturnValue(query);
    repository = { createQueryBuilder:jest.fn().mockReturnValue(query),findOne:jest.fn(),find:jest.fn().mockResolvedValue([]),count:jest.fn().mockResolvedValue(0) };
    service=Object.assign(Object.create(TicketsService.prototype),{ticketRepository:repository,tenantService:tenants});
  });
  it('always scopes list queries before applying caller filters', async () => {
    await run(()=>service.findAll({status:TicketStatus.OPEN,priority:TicketPriority.HIGH,userId:'owner',assignedToId:'agent',categoryId:'category',search:"' OR true --",tags:['tag']}));
    expect(query.where).toHaveBeenCalledWith('ticket.tenantId = :tenantId',{tenantId:'tenant-a'});
    expect(query.andWhere).toHaveBeenCalledWith('ticket.assignedToId = :assignedToId',{assignedToId:'agent'});
    expect(query.andWhere).toHaveBeenCalledWith('(ticket.subject ILIKE :search OR ticket.description ILIKE :search)',{search:"%' OR true --%"});
    expect(query.getMany).toHaveBeenCalledTimes(1);
  });
  it('rejects missing scope before issuing a query', async () => {
    await expect(service.findAll({})).rejects.toThrow(); expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });
  it('returns a scoped ticket and excludes soft-deleted rows', async () => {
    repository.findOne.mockResolvedValue({id:'ticket',tenantId:'tenant-a'});
    expect(await run(()=>service.findOne('ticket'))).toEqual({id:'ticket',tenantId:'tenant-a'});
    expect(repository.findOne).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({id:'ticket',tenantId:'tenant-a',deletedAt:expect.anything()})}));
  });
  it('does not turn missing tickets into empty successes', async () => {
    repository.findOne.mockResolvedValue(null); await expect(run(()=>service.findOne('missing'))).rejects.toThrow('not found');
  });
  it('scopes recent user tickets to the active tenant', async () => {
    await run(()=>service.getRecentByUser('owner',3));
    expect(repository.find).toHaveBeenCalledWith(expect.objectContaining({where:{userId:'owner',tenantId:'tenant-a'},take:3}));
  });
  it('calculates statistics from tenant-scoped persisted measurements', async () => {
    repository.count.mockResolvedValueOnce(10).mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(4).mockResolvedValueOnce(2).mockResolvedValueOnce(2);
    const stats=await run(()=>service.getStats());
    expect(stats).toEqual(expect.objectContaining({totalTickets:10,slaCompliance:80,averageResponseTime:2.75,averageResolutionTime:8.25}));
    for(const [options] of repository.count.mock.calls) expect(options.where.tenantId).toBe('tenant-a');
    expect(query.where).toHaveBeenCalledWith('ticket.tenantId = :tenantId',{tenantId:'tenant-a'});
  });
  it('returns zero averages for a tenant with no measured durations', async () => {
    query.getRawOne.mockResolvedValue({response:null,resolution:null});
    expect(await run(()=>service.getStats())).toEqual(expect.objectContaining({averageResponseTime:0,averageResolutionTime:0,slaCompliance:100}));
  });
});
