/* Real local PostgreSQL fixtures only; no external calls. */
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const source=require('./dist/core/database/data-source').default;
const {TicketTemplatesService}=require('./dist/modules/tickets/services/ticket-templates.service');
const {TicketTemplate}=require('./dist/modules/tickets/entities/ticket-template.entity');
const {TenantService}=require('./dist/core/tenant/tenant.service');
if(process.env.G3_TEMPLATE_ISOLATED!=='1'||process.env.DATABASE_NAME!=='affexai_g0_ephemeral')throw new Error('Isolated template database required');
const tenantId=`template-${randomUUID()}`,foreignTenant=`template-foreign-${randomUUID()}`;
const owner={id:randomUUID(),tenantId,roleNames:['editor']},other={id:randomUUID(),tenantId,roleNames:['editor']},customer={id:randomUUID(),tenantId,roleNames:['customer']},foreign={id:randomUUID(),tenantId:foreignTenant,roleNames:['editor']};
const category=randomUUID(),foreignCategory=randomUUID();
const scopes=new TenantService();
const run=(actor,callback)=>scopes.runWithTenant({tenantId:actor.tenantId,source:'authenticated'},callback);
(async()=>{
 await source.initialize();const repo=source.getRepository(TicketTemplate);const service=new TicketTemplatesService(repo,scopes);
 try{
  assert.equal((await source.query('SELECT current_database() AS name'))[0].name,'affexai_g0_ephemeral');
  for(const actor of [owner,other,customer,foreign])await source.query('INSERT INTO users(id,tenant_id,email,password,"firstName","lastName") VALUES($1,$2,$3,$4,$5,$6)',[actor.id,actor.tenantId,`${actor.id}@example.test`,'unusable','Template','Fixture']);
  for(const [id,tenant]of [[category,tenantId],[foreignCategory,foreignTenant]])await source.query('INSERT INTO ticket_categories(id,tenant_id,name) VALUES($1,$2,$3)',[id,tenant,'Template category fixture']);
  const create=(data)=>run(owner,()=>service.create({name:'Template fixture',subject:'Subject',content:'Body',...data},owner));
  const privateTemplate=await create({categoryId:category});const publicTemplate=await create({isPublic:true});
  await run(owner,()=>service.findOne(privateTemplate.id,owner));
  for(const actor of [other,customer,foreign])await assert.rejects(run(actor,()=>service.findOne(privateTemplate.id,actor)),/not found/);
  const view=await run(customer,()=>service.findOne(publicTemplate.id,customer));assert.equal(view.createdBy.email,undefined);assert.equal(view.createdBy.password,undefined);
  assert.deepEqual((await run(customer,()=>service.findAll(customer))).map(row=>row.id),[publicTemplate.id]);
  assert.deepEqual(await run(customer,()=>service.findAll(customer,false)),[]);
  await assert.rejects(create({categoryId:foreignCategory}),/unavailable/);
  await assert.rejects(run(other,()=>service.update(privateTemplate.id,{content:'Foreign overwrite'},other)),/not found/);
  await assert.rejects(run(foreign,()=>service.delete(privateTemplate.id,foreign)),/not found/);
  assert.equal((await repo.findOneByOrFail({id:privateTemplate.id})).content,'Body');
  await Promise.all(Array.from({length:8},()=>run(customer,()=>service.incrementUsage(publicTemplate.id,customer))));
  assert.equal((await repo.findOneByOrFail({id:publicTemplate.id})).usageCount,8);
  const originalFind=repo.findOne.bind(repo);let race=true;
  repo.findOne=async(options)=>{const value=await originalFind(options);if(race&&value?.id===publicTemplate.id){race=false;await source.query('UPDATE ticket_templates SET "isPublic"=false WHERE id=$1',[publicTemplate.id]);}return value;};
  await assert.rejects(run(other,()=>service.update(publicTemplate.id,{content:'Racing overwrite'},other)),/not found/);
  repo.findOne=originalFind;
  assert.equal((await repo.findOneByOrFail({id:publicTemplate.id})).content,'Body');
  await run(owner,()=>service.delete(privateTemplate.id,owner));
  assert.equal((await repo.findOneByOrFail({id:privateTemplate.id})).isActive,false);
  console.log('PASS: actual PostgreSQL template owner/private/public scope, foreign actor/category denial, creator projection, eight concurrent atomic usage increments, concurrent public-to-private mutation fencing, soft deletion. No external calls.');
 }finally{
  try{await source.query('DELETE FROM ticket_templates WHERE tenant_id=ANY($1::varchar[])',[[tenantId,foreignTenant]]);await source.query('DELETE FROM ticket_categories WHERE id=ANY($1::uuid[])',[[category,foreignCategory]]);await source.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[owner.id,other.id,customer.id,foreign.id]]);}finally{await source.destroy();}
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
