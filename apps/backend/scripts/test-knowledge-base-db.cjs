/* Isolated tenant fixtures only: real PostgreSQL, no provider or mail. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const source = require('./dist/core/database/data-source').default;
const { KnowledgeBaseService } = require('./dist/modules/tickets/services/knowledge-base.service');
const { KnowledgeBaseArticle } = require('./dist/modules/tickets/entities/knowledge-base-article.entity');
const { TenantService } = require('./dist/core/tenant/tenant.service');
if (process.env.G3_KB_ISOLATED !== '1' || process.env.DATABASE_NAME !== 'affexai_g0_ephemeral') throw new Error('Isolated KB acceptance database required');
const tenantId=`kb-acceptance-${randomUUID()}`, foreignTenant=`kb-foreign-${randomUUID()}`;
const author=randomUUID(), foreignAuthor=randomUUID(), category=randomUUID(), foreignCategory=randomUUID();
const scopes=new TenantService();
const run=(callback,tenant=tenantId)=>scopes.runWithTenant({tenantId:tenant,source:'authenticated'},callback);
(async()=>{
 await source.initialize();
 const repository=source.getRepository(KnowledgeBaseArticle);
 const service=new KnowledgeBaseService(repository,scopes);
 try{
  assert.equal((await source.query('SELECT current_database() AS name'))[0].name,'affexai_g0_ephemeral');
  for(const [id,tenant] of [[author,tenantId],[foreignAuthor,foreignTenant]])await source.query('INSERT INTO users(id,tenant_id,email,password,"firstName","lastName",phone) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,tenant,`${id}@example.test`,'unusable','Knowledge','Fixture','private-contact']);
  for(const [id,tenant] of [[category,tenantId],[foreignCategory,foreignTenant]])await source.query('INSERT INTO ticket_categories(id,tenant_id,name) VALUES($1,$2,$3)',[id,tenant,'KB fixture']);
  const draft=await run(()=>service.createArticle(author,{title:'Scoped article',content:'Fixture body',categoryId:category,tags:['support','privacy']}));
  assert.equal(draft.tenantId,tenantId);assert.equal(draft.isPublished,false);
  await assert.rejects(run(()=>service.getArticle(draft.id)),/not found/);
  assert.equal((await run(()=>service.getArticle(draft.id,false))).id,draft.id);
  assert.equal((await run(()=>service.searchArticles({},false))).total,1);
  await assert.rejects(run(()=>service.createArticle(author,{title:'Foreign category',content:'Body',categoryId:foreignCategory})),/unavailable/);
  await assert.rejects(run(()=>service.createArticle(foreignAuthor,{title:'Foreign author',content:'Body'})),/unavailable/);
  await run(()=>service.updateArticle(draft.id,{status:'published'}));
  await run(()=>service.updateArticle(draft.id,{summary:'Partial update'}));
  const published=await run(()=>service.getArticle(draft.id));assert.equal(published.isPublished,true);assert.equal(published.author.email,undefined);assert.equal(published.author.phone,undefined);assert.equal(published.author.password,undefined);
  assert.equal((await run(()=>service.searchArticles({tags:['support']}))).total,1);
  assert.equal((await run(()=>service.searchArticles({tags:['absent']}))).total,0);
  await Promise.all([run(()=>service.getArticleBySlug(draft.slug)),run(()=>service.getArticleBySlug(draft.slug))]);
  await Promise.all([run(()=>service.markHelpful(draft.id,true)),run(()=>service.markHelpful(draft.id,false))]);
  const stored=await repository.findOneByOrFail({id:draft.id});assert.equal(stored.viewCount,2);assert.equal(stored.helpfulCount,1);assert.equal(stored.notHelpfulCount,1);assert.equal(stored.searchScore,50);
  const stats=await run(()=>service.getStatistics());assert.equal(stats.total,1);assert.equal(stats.published,1);assert.equal(stats.totalViews,2);assert.equal(stats.avgHelpfulness,50);
  await assert.rejects(run(()=>service.getArticle(draft.id),foreignTenant),/not found/);
  await assert.rejects(run(()=>service.updateArticle(draft.id,{title:'Foreign overwrite'}),foreignTenant),/not found/);
  assert.equal((await run(()=>service.getPopularArticles(),foreignTenant)).length,0);
  await source.query('UPDATE knowledge_base_articles SET "isPublished"=false WHERE id=$1',[draft.id]);
  assert.equal((await run(()=>service.searchArticles({status:'published'}))).total,0);
  await assert.rejects(run(()=>service.deleteArticle(draft.id),foreignTenant),/not found/);
  await run(()=>service.deleteArticle(draft.id));
  console.log('PASS: real PG article create/draft/admin/public/update, scoped author/category rejection, tenant read/write isolation, simple-array tag SQL, atomic concurrent view/feedback counters, safe author projection and statistics. No external calls.');
 }finally{
  try{await source.query('DELETE FROM knowledge_base_articles WHERE tenant_id=ANY($1::varchar[])',[[tenantId,foreignTenant]]);await source.query('DELETE FROM ticket_categories WHERE id=ANY($1::uuid[])',[[category,foreignCategory]]);await source.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[author,foreignAuthor]]);}finally{await source.destroy();}
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
