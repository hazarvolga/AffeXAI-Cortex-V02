const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
if (process.env.G3_ATTACHMENT_ISOLATED !== '1' || process.env.DATABASE_NAME !== 'affexai_g0_ephemeral') throw new Error('Isolated database required');
const db = new Client({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT), user: process.env.DATABASE_USERNAME, password: process.env.DATABASE_PASSWORD, database: process.env.DATABASE_NAME });
(async () => {
 await db.connect(); await db.query('BEGIN');
 try {
  assert.equal((await db.query('SELECT current_database() AS name')).rows[0].name,'affexai_g0_ephemeral');
  const a=randomUUID(),b=randomUUID(),ta=randomUUID(),tb=randomUUID(),ma=randomUUID(),mb=randomUUID(),attachment=randomUUID();
  for(const [id,tenant] of [[a,'attachment-fixture-a'],[b,'attachment-fixture-b']]) await db.query('INSERT INTO users(id,tenant_id,email,password,"firstName","lastName") VALUES($1,$2,$3,$4,$5,$6)',[id,tenant,`${id}@example.test`,'unusable','Fixture','User']);
  for(const [id,tenant,owner] of [[ta,'attachment-fixture-a',a],[tb,'attachment-fixture-b',b]]) await db.query('INSERT INTO tickets(id,tenant_id,"displayNumber",subject,description,"userId") VALUES($1,$2,$3,$4,$5,$6)',[id,tenant,id.slice(0,20),'Fixture','Fixture',owner]);
  for(const [id,tenant,ticket,owner] of [[ma,'attachment-fixture-a',ta,a],[mb,'attachment-fixture-b',tb,b]]) await db.query('INSERT INTO ticket_messages(id,tenant_id,"ticketId","authorId",content) VALUES($1,$2,$3,$4,$5)',[id,tenant,ticket,owner,'Fixture']);
  await db.query('INSERT INTO ticket_attachments(id,tenant_id,owner_id,storage_key,original_name,mime_type,size,sha256) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[attachment,'attachment-fixture-a',a,randomUUID(),'fixture.txt','text/plain',7,'a'.repeat(64)]);
  async function rejects(sql,params,code) { await db.query('SAVEPOINT invalid_scope'); await assert.rejects(db.query(sql,params),e=>e.code===code); await db.query('ROLLBACK TO SAVEPOINT invalid_scope'); }
  await db.query('INSERT INTO ticket_messages(id,tenant_id,"ticketId","authorId",content,"isInternal",metadata) VALUES($1,$2,$3,NULL,$4,true,$5)',[randomUUID(),'attachment-fixture-a',ta,'System-only fixture',JSON.stringify({actorType:'system'})]);
  await rejects('INSERT INTO ticket_messages(id,tenant_id,"ticketId","authorId",content,"isInternal",metadata) VALUES($1,$2,$3,NULL,$4,false,$5)',[randomUUID(),'attachment-fixture-a',ta,'Invalid public system note',JSON.stringify({actorType:'system'})],'23514');
  await rejects('INSERT INTO ticket_messages(id,tenant_id,"ticketId","authorId",content,"isInternal",metadata) VALUES($1,$2,$3,NULL,$4,true,$5)',[randomUUID(),'attachment-fixture-a',ta,'Missing provenance',JSON.stringify({})],'23514');
  await rejects('UPDATE ticket_attachments SET owner_id=$1 WHERE id=$2',[b,attachment],'23503');
  await rejects('UPDATE ticket_attachments SET ticket_id=$1 WHERE id=$2',[tb,attachment],'23503');
  await rejects('UPDATE ticket_attachments SET message_id=$1 WHERE id=$2',[ma,attachment],'23514');
  await db.query('UPDATE ticket_attachments SET ticket_id=$1,message_id=$2 WHERE id=$3',[ta,ma,attachment]);
  await rejects('UPDATE ticket_attachments SET message_id=$1 WHERE id=$2',[mb,attachment],'23503');
  const movedTicket=randomUUID();
  await db.query('INSERT INTO tickets(id,tenant_id,"displayNumber",subject,description,"userId") VALUES($1,$2,$3,$4,$5,$6)',[movedTicket,'attachment-fixture-a',movedTicket.slice(0,20),'Moved','Fixture',a]);
  await db.query('UPDATE ticket_messages SET "ticketId"=$1 WHERE id=$2',[movedTicket,ma]);
  assert.equal((await db.query('SELECT ticket_id FROM ticket_attachments WHERE id=$1',[attachment])).rows[0].ticket_id,movedTicket);
  await rejects('DELETE FROM tickets WHERE id=$1',[movedTicket],'23503');
  await rejects('UPDATE ticket_attachments SET size=0 WHERE id=$1',[attachment],'23514');
  await rejects('UPDATE ticket_attachments SET sha256=$1 WHERE id=$2',['invalid',attachment],'23514');
  console.log('PASS: migration8 actual PG draft metadata, owner/tenant/ticket/message composite FKs, valid binding, delete restriction, size/hash constraints; fixtures rolled back. System-note provenance constraints verified; no file-byte acceptance claimed.');
 } finally {await db.query('ROLLBACK');await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
