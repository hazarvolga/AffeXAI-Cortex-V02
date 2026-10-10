import { randomUUID } from 'node:crypto';
import { TicketAttachmentService } from './ticket-attachment.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { Ticket } from '../entities/ticket.entity';

describe('attachment draft transaction binding',()=>{
 const tenant='tenant-a',ownerId=randomUUID(),ticketId=randomUUID(),id=randomUUID();
 const tenants=new TenantService();
 const repo={find:jest.fn(),update:jest.fn().mockResolvedValue({affected:1})};
 const manager={queryRunner:{isTransactionActive:true},findOne:jest.fn(async entity=>entity===Ticket?{id:ticketId,tenantId:tenant}:null),getRepository:()=>repo};
 const service=new TicketAttachmentService({} as never,{} as never,{} as never,tenants,{} as never);
 const run=callback=>tenants.runWithTenant({tenantId:tenant,source:'authenticated'},callback);
 beforeEach(()=>{jest.clearAllMocks();repo.find.mockResolvedValue([{id,ownerId,tenantId:tenant,ticketId:null,messageId:null,originalName:'fixture.txt',mimeType:'text/plain'}]);});
 it('binds own draft under row lock and scoped update',async()=>{
  await run(()=>service.bindDrafts(manager as never,[id],{tenantId:tenant,ownerId,ticketId}));
  expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({tenantId:tenant,ownerId}),lock:{mode:'pessimistic_write'}}));
  expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({tenantId:tenant,ownerId}),{ticketId,messageId:null});
 });
 it('requires an active producer transaction',async()=>{await expect(run(()=>service.bindDrafts({...manager,queryRunner:{isTransactionActive:false}} as never,[id],{tenantId:tenant,ownerId,ticketId}))).rejects.toThrow();expect(repo.update).not.toHaveBeenCalled();});
 it.each(['missing','already-bound'])('rejects %s attachment without updating any row',async kind=>{
  repo.find.mockResolvedValue(kind==='missing'?[]:[{id,ticketId:randomUUID()}]);
  await expect(run(()=>service.bindDrafts(manager as never,[id],{tenantId:tenant,ownerId,ticketId}))).rejects.toThrow();expect(repo.update).not.toHaveBeenCalled();
 });
 it('rejects foreign tenant',async()=>{await expect(run(()=>service.bindDrafts(manager as never,[id],{tenantId:'tenant-b',ownerId,ticketId}))).rejects.toThrow();expect(repo.find).not.toHaveBeenCalled();});
 it('rejects duplicate IDs',async()=>{await expect(run(()=>service.bindDrafts(manager as never,[id,id],{tenantId:tenant,ownerId,ticketId}))).rejects.toThrow();expect(repo.find).not.toHaveBeenCalled();});
 it('rejects foreign message before claiming drafts',async()=>{await expect(run(()=>service.bindDrafts(manager as never,[id],{tenantId:tenant,ownerId,ticketId,messageId:randomUUID()}))).rejects.toThrow();expect(repo.find).not.toHaveBeenCalled();});
});
