/* Isolated G1 CAS integration only. Mount transpiled auth-persistence.js read-only into
 * affexai-cortex-backend:g0-local; override entrypoint with node (never start Nest).
 * Required: G1_CAS_ISOLATED=1, AUTH_PERSISTENCE_MODULE path. Fixed G0 ephemeral DB only.
 */
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const appRequire = createRequire('/app/apps/backend/package.json');
const { DataSource, EntitySchema } = appRequire('typeorm');
if (process.env.G1_CAS_ISOLATED !== '1') throw new Error('Explicit isolated test opt-in required');
const { rotateRefreshCredentials: rotate, replacePasswordCredentials: password, consumeVerificationCredentials: verify } = require(process.env.AUTH_PERSISTENCE_MODULE);
const schema = `g1_cas_${Date.now()}`;
const User = new EntitySchema({ name: 'CasUser', tableName: 'users', schema, columns: {
 id:{type:'uuid',primary:true},deletedAt:{type:Date,nullable:true},tenantId:{type:String},email:{type:String},password:{type:String},tokenVersion:{type:Number},isActive:{type:Boolean},
 refreshToken:{type:String,nullable:true},refreshTokenExpires:{type:Date,nullable:true},emailVerified:{type:Boolean},emailVerifiedAt:{type:Date,nullable:true},emailVerificationToken:{type:String,nullable:true},emailVerificationExpires:{type:Date,nullable:true},
}});
const db = new DataSource({type:'postgres',host:'postgres-test',port:5432,username:'g0_test',password:'g0_ephemeral_local_only',database:'affexai_g0_ephemeral',entities:[User],synchronize:false});
async function main(){
 await db.initialize();
 try {
  await db.query(`CREATE SCHEMA "${schema}"`);
  await db.query(`CREATE TABLE "${schema}".users (id uuid PRIMARY KEY,"deletedAt" timestamp,"tenantId" text NOT NULL,email text NOT NULL,password text NOT NULL,"tokenVersion" integer NOT NULL,"isActive" boolean NOT NULL,"refreshToken" text,"refreshTokenExpires" timestamp,"emailVerified" boolean NOT NULL,"emailVerifiedAt" timestamp,"emailVerificationToken" text,"emailVerificationExpires" timestamp)`);
  const repo=db.getRepository(User);const id='11111111-1111-4111-8111-111111111111';const future=new Date(Date.now()+60000);
  const baseline={id,tenantId:'a',email:'isolated@example.invalid',password:'initial-hash',tokenVersion:1,isActive:true,refreshToken:'old',refreshTokenExpires:future,emailVerified:false,emailVerificationToken:'verify_once',emailVerificationExpires:future};
  await repo.save(baseline);
  const winners=await Promise.all([rotate(repo,id,'a','old',1,'winner-a',future),rotate(repo,id,'a','old',1,'winner-b',future)]);
  assert.equal(winners.filter(Boolean).length,1,'exactly one concurrent refresh wins');
  assert.equal(await rotate(repo,id,'b','old',1,'foreign',future),false);
  await repo.update(id,{refreshToken:'expired',refreshTokenExpires:new Date(Date.now()-1000)});
  assert.equal(await rotate(repo,id,'a','expired',1,'new',future),false);
  await repo.update(id,{refreshToken:'current',refreshTokenExpires:future});
  assert.equal(await password(repo,id,'a','new-hash',1),true);
  let row=await repo.findOneByOrFail({id});assert.equal(row.password,'new-hash');assert.equal(row.tokenVersion,2);assert.equal(row.refreshToken,null);assert.equal(row.refreshTokenExpires,null);
  assert.equal(await password(repo,id,'a','stale-hash',1),false);
  assert.equal(await rotate(repo,id,'a','current',1,'revoked',future),false);
  assert.equal(await verify(repo,id,'a','reset_once'),false);
  assert.equal(await verify(repo,id,'b','verify_once'),false);
  assert.equal(await verify(repo,id,'a','verify_once'),true);
  assert.equal(await verify(repo,id,'a','verify_once'),false);
  row=await repo.findOneByOrFail({id});assert.equal(row.emailVerified,true);assert.equal(row.emailVerificationToken,null);
  await repo.update(id,{isActive:false,emailVerified:false,emailVerificationToken:'verify_suspended',emailVerificationExpires:future});
  assert.equal(await verify(repo,id,'a','verify_suspended'),false);assert.equal((await repo.findOneByOrFail({id})).isActive,false);
  await repo.update(id,{isActive:true,emailVerificationToken:'verify_expired',emailVerificationExpires:new Date(Date.now()-1000)});
  assert.equal(await verify(repo,id,'a','verify_expired'),false);
  await repo.update(id,{deletedAt:new Date(),isActive:true,refreshToken:'deleted',refreshTokenExpires:future,emailVerificationToken:'verify_deleted',emailVerificationExpires:future});
  assert.equal(await rotate(repo,id,'a','deleted',2,'new',future),false);assert.equal(await password(repo,id,'a','deleted-hash',2),false);assert.equal(await verify(repo,id,'a','verify_deleted'),false);
  console.log('PASS: real PostgreSQL concurrent refresh CAS, expiry/tenant/revocation, password version and stored hash, one-use purpose-bound verification, suspended account unchanged');
 }finally{await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await db.destroy();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
