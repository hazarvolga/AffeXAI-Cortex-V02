// Read-only table/column presence audit of every entity registered by the compiled CLI datasource.
const { DataSource } = require('typeorm');
if (process.env.G3_SCHEMA_AUDIT_ISOLATED !== '1' || process.env.DOTENV_CONFIG_PATH !== '/dev/null') throw new Error('Isolated read-only audit markers required');
const { default: AppDataSource } = require('./dist/core/database/data-source.js');
const db = new DataSource({...AppDataSource.options,host:'postgres-test',port:5432,username:'g0_test',password:'g0_ephemeral_local_only',database:'affexai_g0_ephemeral',synchronize:false,migrationsRun:false,dropSchema:false,logging:false});
(async()=>{
 await db.initialize();const runner=db.createQueryRunner();
 try {
  await runner.connect();await runner.startTransaction();await runner.query('SET TRANSACTION READ ONLY');
  const columns=await runner.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'");
  const actual=new Map();for(const row of columns){if(!actual.has(row.table_name))actual.set(row.table_name,new Set());actual.get(row.table_name).add(row.column_name);}
  const gaps=db.entityMetadatas.map(entity=>({table:entity.tableName,missing:entity.columns.map(column=>column.databaseName).filter(column=>!actual.get(entity.tableName)?.has(column))})).filter(entry=>entry.missing.length);
  console.log(JSON.stringify({scope:'registered entity table/column presence; types, indexes and FK parity excluded',entityCount:db.entityMetadatas.length,gaps},null,2));
  if(gaps.length)process.exitCode=1;
 }finally{if(runner.isTransactionActive)await runner.rollbackTransaction();await runner.release();await db.destroy();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
