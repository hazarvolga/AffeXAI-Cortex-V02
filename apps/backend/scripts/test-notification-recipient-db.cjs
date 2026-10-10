const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {DataSource}=require('typeorm');
const {NotificationRecipientIntegrity1791399600000}=require('./g3-notification/migration.js');
if(process.env.G3_NOTIFICATION_ISOLATED!=='1')throw new Error('Isolated migration marker required');
const db=new DataSource({type:'postgres',host:'postgres-test',port:5432,username:'g0_test',password:'g0_ephemeral_local_only',database:'affexai_g0_ephemeral',entities:[],synchronize:false});
(async()=>{await db.initialize();const runner=db.createQueryRunner();const schema=`notification_${randomUUID().replaceAll('-','')}`;
try{
 await runner.connect();await runner.startTransaction();assert.equal((await runner.query('SELECT current_database() AS name'))[0].name,'affexai_g0_ephemeral');
 await runner.query(`CREATE SCHEMA "${schema}"`);await runner.query(`SET LOCAL search_path TO "${schema}", public`);
 await runner.query('CREATE TABLE users(id uuid PRIMARY KEY,tenant_id varchar,UNIQUE(id,tenant_id))');
 await runner.query('CREATE TABLE notifications(id uuid PRIMARY KEY,tenant_id varchar,"userId" varchar,user_id uuid,created_at timestamp DEFAULT now(),deleted_at timestamp)');
 await runner.query('ALTER TABLE notifications ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
 const a=randomUUID(),b=randomUUID(),orphan=randomUUID();await runner.query('INSERT INTO users VALUES($1,$2),($3,$4)',[a,'tenant-a',b,'tenant-b']);
 const cases=[['both',a,a,'tenant-a',a],['uppercase',a.toUpperCase(),a,'tenant-a',a],['stringOnly',a,null,'tenant-a',a],['relationOnly',null,a,'tenant-a',a],['blank','',a,'tenant-a',a],['conflict',a,b,'tenant-a',null],['invalid','not-uuid',a,'tenant-a',null],['orphan',orphan,null,'tenant-a',null],['foreign',b,null,'tenant-a',null],['noTenant',a,null,null,null],['neither',null,null,'tenant-a',null]];
 const fixtures=cases.map(values=>({id:randomUUID(),values}));
 for(const {id,values:[,raw,relation,tenant]}of fixtures)await runner.query('INSERT INTO notifications(id,"userId",user_id,tenant_id) VALUES($1,$2,$3,$4)',[id,raw,relation,tenant]);
 const migration=new NotificationRecipientIntegrity1791399600000();await migration.up(runner);
 for(const {id,values:[name,raw,relation,tenant,expected]}of fixtures){const [row]=await runner.query('SELECT * FROM notifications WHERE id=$1',[id]);assert.equal(row.recipient_id,expected,name);assert.equal(row.tenant_id,expected?tenant:null,name);assert.equal(row.legacy_tenant_id,tenant,name);assert.equal(row.userId,raw,name);assert.equal(row.user_id,relation,name);}
 await assert.rejects(migration.down(runner),/empty/);
 const rejects=async(sql,args)=>{await runner.query('SAVEPOINT rejection');await assert.rejects(runner.query(sql,args));await runner.query('ROLLBACK TO SAVEPOINT rejection');};
 await rejects('INSERT INTO notifications(id,tenant_id,recipient_id) VALUES($1,$2,$3)',[randomUUID(),'tenant-a',b]);
 await rejects('INSERT INTO notifications(id,tenant_id) VALUES($1,$2)',[randomUUID(),'tenant-a']);
 await rejects('INSERT INTO notifications(id,recipient_id) VALUES($1,$2)',[randomUUID(),a]);
 await runner.query('DELETE FROM users WHERE id=$1',[a]);assert.equal(Number((await runner.query('SELECT count(*) AS n FROM notifications WHERE recipient_id=$1',[a]))[0].n),0);
 assert.equal(Number((await runner.query('SELECT count(*) AS n FROM notifications WHERE recipient_id IS NULL'))[0].n),6);
 await runner.query('DELETE FROM users WHERE id=$1',[b]);assert.equal(Number((await runner.query('SELECT count(*) AS n FROM notifications WHERE recipient_id IS NULL'))[0].n),6);
 await runner.query('DELETE FROM notifications');await migration.down(runner);assert.equal((await runner.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema=$1 AND table_name='notifications' AND column_name='recipient_id'",[schema]))[0].n,0);
 await runner.rollbackTransaction();
 if(process.env.G3_NOTIFICATION_APPLY==='1'){db.migrations=[new NotificationRecipientIntegrity1791399600000()];const applied=await db.runMigrations({transaction:'all'});assert.ok(applied.length<=1);assert.equal((await db.runMigrations({transaction:'all'})).length,0);const history=await db.query('SELECT name FROM migrations ORDER BY id');assert.equal(history.length,13);assert.equal(history.at(-1).name,'NotificationRecipientIntegrity1791399600000');console.log('PASS: canonical migration13 applied; repeat0');}
 console.log('PASS: real PostgreSQL notification consistent/uppercase/one-sided backfill; conflicts/invalid/orphan/foreign/null tenant preserved and quarantined; compound tenant FK/check; recipient cascade; unsafe populated downgrade refused; empty downgrade; fixture schema rolled back. Canonical application occurs only with explicit G3_NOTIFICATION_APPLY=1.');
}finally{if(runner.isTransactionActive)await runner.rollbackTransaction();await runner.release();await db.destroy();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
