import { TicketAutoTaggingService } from './ticket-auto-tagging.service';
import { Ticket } from '../entities/ticket.entity';
import { Repository } from 'typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';

describe('TicketAutoTaggingService current contract', () => {
  const tenants = new TenantService();
  let repo: {findOne: jest.Mock; update: jest.Mock; save: jest.Mock};
  let service: TicketAutoTaggingService;
  const ticket = {id:'ticket-a',tenantId:'tenant-a',subject:'Password login error',description:'Şifremi unuttum',tags:['manual'],status:'open'} as Ticket;
  const scoped = <T>(work:()=>T) => tenants.runWithTenant({tenantId:'tenant-a',source:'authenticated'},work);
  beforeEach(()=> {repo={findOne:jest.fn().mockResolvedValue({...ticket}),update:jest.fn().mockResolvedValue({affected:1}),save:jest.fn()};service=new TicketAutoTaggingService(repo as unknown as Repository<Ticket>,tenants);});
  it('detects English and Turkish keywords without persistence',async()=>{expect(await service.autoTag(ticket)).toContain('authentication');expect(repo.update).not.toHaveBeenCalled();});
  it('returns no tags for unrelated content',async()=>{expect(await service.autoTag({...ticket,subject:'Merhaba',description:''})).toEqual([]);});
  it('limits ranked suggestions to five distinct tags',async()=>{const result=await service.autoTag({...ticket,description:'payment invoice password login slow bug email notification account feature export data loss'});expect(result.length).toBeLessThanOrEqual(5);expect(new Set(result).size).toBe(result.length);});
  it.each(['applyAutoTags','getSuggestedTags'] as const)('requires tenant before %s query',async(method)=>{await expect(service[method](ticket.id)).rejects.toThrow();expect(repo.findOne).not.toHaveBeenCalled();});
  it('scopes suggested lookup and does not write',async()=>{expect(await scoped(()=>service.getSuggestedTags(ticket.id))).toContain('authentication');expect(repo.findOne).toHaveBeenCalledWith({where:{id:ticket.id,tenantId:'tenant-a'}});expect(repo.update).not.toHaveBeenCalled();});
  it.each(['applyAutoTags','getSuggestedTags'] as const)('rejects unavailable ticket in %s',async(method)=>{repo.findOne.mockResolvedValue(null);await expect(scoped(()=>service[method](ticket.id))).rejects.toThrow('not found');});
  it('merges tags with partial scoped update without writing stale ticket status',async()=>{await scoped(()=>service.applyAutoTags(ticket.id));expect(repo.update).toHaveBeenCalledWith({id:ticket.id,tenantId:'tenant-a'},{tags:expect.arrayContaining(['manual','authentication'])});expect(repo.save).not.toHaveBeenCalled();expect(ticket.tags).toEqual(['manual']);});
  it('propagates persistence failure',async()=>{repo.update.mockRejectedValue(new Error('storage unavailable'));await expect(scoped(()=>service.applyAutoTags(ticket.id))).rejects.toThrow('storage unavailable');});
  it('rejects disappearance during write',async()=>{repo.update.mockResolvedValue({affected:0});await expect(scoped(()=>service.applyAutoTags(ticket.id))).rejects.toThrow('not found');});
  it('matches custom keywords literally rather than executing regex',async()=>{service.addTagRule({tag:'literal',keywords:['[abc','a+b'],priority:20});expect(await service.autoTag({...ticket,subject:'[abc a+b',description:''})).toContain('literal');expect(await service.autoTag({...ticket,subject:'aaab',description:''})).not.toContain('literal');});
  it('does not expose mutable stored rules',()=>{const rules=service.getTagRules();rules[0].keywords.push('fixture mutation');expect(service.getTagRules()[0].keywords).not.toContain('fixture mutation');});
});
