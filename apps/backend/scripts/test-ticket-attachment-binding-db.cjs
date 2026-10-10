const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {mkdtemp,rm,readFile}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const source=require('./dist/core/database/data-source').default;
const {TicketAttachmentService}=require('./dist/modules/tickets/services/ticket-attachment.service');
const {TicketAttachmentEntity}=require('./dist/modules/tickets/entities/ticket-attachment.entity');
const {Ticket}=require('./dist/modules/tickets/entities/ticket.entity');
const {TicketMessage}=require('./dist/modules/tickets/entities/ticket-message.entity');
const {TenantService}=require('./dist/core/tenant/tenant.service');
if(process.env.G3_ATTACHMENT_BINDING_ISOLATED!=='1'||process.env.DATABASE_NAME!=='affexai_g0_ephemeral')throw new Error('Isolated attachment DB required');
const tenantId=`attachment-bind-${randomUUID()}`,ownerId=randomUUID(),otherId=randomUUID(),ticketA=randomUUID(),ticketB=randomUUID(),messageId=randomUUID();
const tenants=new TenantService();const actor={id:ownerId,tenantId,roleNames:['customer']};
const run=callback=>tenants.runWithTenant({tenantId,source:'authenticated'},callback);
(async()=>{
 const root=await mkdtemp(join(tmpdir(),'affexai-attachment-binding-'));
 await source.initialize();
 const service=new TicketAttachmentService(source.getRepository(TicketAttachmentEntity),source.getRepository(Ticket),source.getRepository(TicketMessage),tenants,{get:()=>root});
 try{
  assert.equal((await source.query('SELECT current_database() name'))[0].name,'affexai_g0_ephemeral');
  for(const id of [ownerId,otherId])await source.query('INSERT INTO users(id,tenant_id,email,password,"firstName","lastName") VALUES($1,$2,$3,$4,$5,$6)',[id,tenantId,`${id}@example.test`,'unusable','Attachment','Fixture']);
  for(const id of [ticketA,ticketB])await source.query('INSERT INTO tickets(id,tenant_id,"displayNumber",subject,description,"userId") VALUES($1,$2,$3,$4,$5,$6)',[id,tenantId,id.slice(0,20),'Fixture','Fixture',ownerId]);
  const bytes=Buffer.from('Actual private attachment persisted bytes');
  const upload=()=>run(()=>service.uploadAttachment({originalname:'fixture.txt',buffer:bytes,size:bytes.length,mimetype:'text/plain'},actor));
  const attachment=await upload();
  const stored=await source.getRepository(TicketAttachmentEntity).findOneByOrFail({id:attachment.id});
  assert.deepEqual(await readFile(join(root,stored.storageKey)),bytes);
  const bind=(ticketId,id=attachment.id)=>run(()=>source.transaction(manager=>service.bindDrafts(manager,[id],{tenantId,ownerId,ticketId})));
  const results=await Promise.allSettled([bind(ticketA),bind(ticketB)]);
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  assert.equal(results.filter(result=>result.status==='rejected').length,1);
  const bound=await source.getRepository(TicketAttachmentEntity).findOneByOrFail({id:attachment.id});
  assert([ticketA,ticketB].includes(bound.ticketId));
  await assert.rejects(run(()=>service.getAttachment(attachment.id,{...actor,id:otherId})),/access denied/);
  const opened=await run(()=>service.openDownload(attachment.id,actor));const chunks=[];for await(const chunk of opened.stream)chunks.push(chunk);assert.deepEqual(Buffer.concat(chunks),bytes);
  const draft=await upload();
  await assert.rejects(run(()=>source.transaction(async manager=>{await service.bindDrafts(manager,[draft.id],{tenantId,ownerId,ticketId:ticketA});throw new Error('fixture rollback');})),/fixture rollback/);
  assert.equal((await source.getRepository(TicketAttachmentEntity).findOneByOrFail({id:draft.id})).ticketId,null);
  await assert.rejects(run(()=>source.transaction(manager=>service.bindDrafts(manager,[draft.id],{tenantId,ownerId:otherId,ticketId:ticketA}))),/Only your unbound/);
  await source.query('INSERT INTO ticket_messages(id,tenant_id,"ticketId","authorId",content,"isInternal") VALUES($1,$2,$3,$4,$5,true)',[messageId,tenantId,ticketA,ownerId,'Internal fixture']);
  await run(()=>source.transaction(manager=>service.bindDrafts(manager,[draft.id],{tenantId,ownerId,ticketId:ticketA,messageId})));
  await assert.rejects(run(()=>service.getAttachment(draft.id,actor)),/Message attachment access denied/);
  await run(()=>service.getAttachment(draft.id,{...actor,roleNames:['support_agent']}));
  console.log('PASS: actual PG repository pessimistic draft lock, concurrent bind one winner, binding rollback, foreign uploader denied, exact filesystem+download bytes, internal attachment customer denied/support allowed. No provider calls.');
 }finally{
  try{await source.query('DELETE FROM ticket_attachments WHERE tenant_id=$1',[tenantId]);await source.query('DELETE FROM ticket_messages WHERE id=$1',[messageId]);await source.query('DELETE FROM tickets WHERE id=ANY($1::uuid[])',[[ticketA,ticketB]]);await source.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[ownerId,otherId]]);}finally{await source.destroy();await rm(root,{recursive:true,force:true});}
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
