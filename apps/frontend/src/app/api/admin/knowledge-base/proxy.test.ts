import test from 'node:test';
import assert from 'node:assert/strict';
import { forwardKnowledgeAdmin, knowledgeBackendUrl } from './proxy';
test('knowledge backend prefix is normalized',()=>{assert.equal(knowledgeBackendUrl('http://127.0.0.1:9006/api/'),'http://127.0.0.1:9006/api');});
test('unauthenticated proxy never fetches',async()=>{assert.equal((await forwardKnowledgeAdmin('','GET','/knowledge-base/admin/all')).status,401);});
test('uses bearer and unwraps actual article search payload as array',async()=>{
 const original=global.fetch;try {global.fetch=async(url,init)=>{assert.ok(String(url).endsWith('/api/knowledge-base/admin/all'));assert.equal(new Headers(init?.headers).get('authorization'),'Bearer fixture');assert.equal(new Headers(init?.headers).has('x-tenant-id'),false);return Response.json({success:true,data:{articles:[{id:'article'}],total:1}});};const result=await forwardKnowledgeAdmin('fixture','GET','/knowledge-base/admin/all',undefined,true);assert.deepEqual(await result.json(),[{id:'article'}]);}finally{global.fetch=original;}
});
test('create converts publication flag and omits empty category without injecting tenant',async()=>{
 const original=global.fetch;try{global.fetch=async(_url,init)=>{assert.deepEqual(JSON.parse(String(init?.body)),{title:'Title',content:'Body',status:'draft'});return Response.json({success:true,data:{id:'article'}});};assert.equal((await forwardKnowledgeAdmin('fixture','POST','/knowledge-base/articles',{title:'Title',content:'Body',categoryId:'',isPublished:false})).status,200);}finally{global.fetch=original;}
});
test('rejects foreign metadata before backend request',async()=>{assert.equal((await forwardKnowledgeAdmin('fixture','PATCH','/knowledge-base/articles/id',{tenantId:'foreign'})).status,400);});
