const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { DataSource } = require('typeorm');
const { of } = require('rxjs');
const { activeMigrations } = require('./g2-outbox/core/database/migration-catalog.js');
const { PlatformEvent } = require('./g2-outbox/modules/platform-integration/entities/platform-event.entity.js');
const { CortexOutboxService } = require('./g2-outbox/core/cortex/cortex-outbox.service.js');
const { CortexOutboxWorker } = require('./g2-outbox/core/cortex/cortex-outbox.worker.js');
const { cortexPointId } = require('./g2-outbox/core/cortex/delivery.js');
if (process.env.G2_OUTBOX_ISOLATED !== '1') throw new Error('Isolated acceptance marker required');
const source = new DataSource({ type: 'postgres', host: 'postgres-test', port: 5432, username: 'g0_test', password: 'g0_ephemeral_local_only', database: 'affexai_g0_ephemeral', entities: [PlatformEvent], migrations: activeMigrations, synchronize: false });
const fixtureIds = [];
const tenant = `outbox-fixture-${randomUUID()}`;
const service = new CortexOutboxService();
const config = { get: (key, fallback) => ({ 'cortex.url': 'http://cortex-fixture.invalid', 'cortex.serviceSecret': 'local-outbox-fixture-only-secret-32-characters' })[key] ?? fallback };
const points = new Map();
let transportCalls = 0;
// No network: exercise the real signed delivery/ACK validator using an in-process transport.
const http = { post: (_url, body) => {
 const signal = JSON.parse(body); const pointId = cortexPointId(signal.tenantId, signal.eventId);
 transportCalls++; points.set(pointId, signal);
 return of({ data: { status: 'ingested', tenantId: signal.tenantId, eventId: signal.eventId, pointId } });
} };
const envelope = () => ({ eventId: randomUUID(), tenantId: tenant, ticketId: randomUUID(), actorId: randomUUID(), occurredAt: new Date(), payload: { successScore: 5, context: 'Local outbox fixture', ticketId: randomUUID(), resolutionTime: null } });
async function record() { const event = envelope(); fixtureIds.push(event.eventId); await source.transaction(manager => service.recordTicketResolved(manager, event)); return event; }
async function row(id) { return (await source.query('SELECT * FROM cortex_outbox WHERE event_id=$1', [id]))[0]; }
(async () => {
 await source.initialize();
 try {
  await source.runMigrations({ transaction: 'all' });
  const history = await source.query('SELECT name FROM migrations ORDER BY id');
  assert.equal(history.length, 13); assert.equal(history[6].name, 'CortexOutbox1791378000000');
  assert.equal((await source.runMigrations({ transaction: 'all' })).length, 0);
  assert.equal((await source.query("SELECT event_id FROM cortex_outbox WHERE status IN ('pending','processing')")).length, 0, 'Another outbox test is active; do not drain its rows');
  const rolledBack = envelope(); fixtureIds.push(rolledBack.eventId);
  await assert.rejects(source.transaction(async manager => { await service.recordTicketResolved(manager, rolledBack); throw new Error('fixture rollback'); }), /fixture rollback/);
  assert.equal((await source.query('SELECT id FROM platform_events WHERE id=$1', [rolledBack.eventId])).length, 0);
  assert.equal(await row(rolledBack.eventId), undefined);
  await assert.rejects(service.recordTicketResolved(source.manager, envelope()), /active producer transaction/);

  const base = await record();
  const runner = source.createQueryRunner(); await runner.connect(); await runner.startTransaction();
  try {
   await runner.query('DELETE FROM cortex_outbox WHERE event_id=$1', [base.eventId]);
   await runner.query('SAVEPOINT foreign_tenant');
   await assert.rejects(runner.query('INSERT INTO cortex_outbox(event_id,tenant_id,payload) VALUES($1,$2,$3::jsonb)', [base.eventId, 'foreign-fixture', JSON.stringify({ eventId: base.eventId, tenantId: 'foreign-fixture' })]), error => error.code === '23503');
   await runner.query('ROLLBACK TO SAVEPOINT foreign_tenant');
  } finally { await runner.rollbackTransaction(); await runner.release(); }
  const downgrade = source.createQueryRunner(); await downgrade.connect(); await downgrade.startTransaction();
  const contender = source.createQueryRunner(); await contender.connect(); await contender.startTransaction();
  try {
   await assert.rejects(new activeMigrations[6]().down(downgrade), /Undelivered Cortex events/);
   await contender.query("SET LOCAL lock_timeout = '200ms'");
   await assert.rejects(contender.query('SELECT event_id FROM cortex_outbox LIMIT 1'), error => error.code === '55P03');
  } finally { await contender.rollbackTransaction(); await contender.release(); await downgrade.rollbackTransaction(); await downgrade.release(); }
  for (let i = 0; i < 5; i++) await record();
  const claims = [[], []];
  const dbFor = index => ({ query: async (sql, parameters) => { const result = await source.query(sql, parameters); if (sql.startsWith('WITH due')) claims[index].push(...result[0].map(value => value.event_id)); return result; } });
  await Promise.all([new CortexOutboxWorker(dbFor(0), http, config).drain(), new CortexOutboxWorker(dbFor(1), http, config).drain()]);
  assert.equal(claims[0].length + claims[1].length, 6);
  assert.equal(new Set(claims.flat()).size, 6);
  assert.equal((await source.query("SELECT event_id FROM cortex_outbox WHERE tenant_id=$1 AND status='delivered'", [tenant])).length, 6);

  const leased = await record(); const oldToken = randomUUID();
  await source.query("UPDATE cortex_outbox SET status='processing',lease_token=$2,leased_until=now()-interval '1 second',attempts=1 WHERE event_id=$1", [leased.eventId, oldToken]);
  const oldRow = await row(leased.eventId);
  const recovered = [];
  const recoveryDb = { query: async (sql, parameters) => { const result = await source.query(sql, parameters); if (sql.startsWith('WITH due')) recovered.push(...result[0]); return result; } };
  await new CortexOutboxWorker(recoveryDb, http, config).drain();
  assert.equal(recovered.length, 1); assert.notEqual(recovered[0].lease_token, oldToken); assert.equal((await row(leased.eventId)).attempts, 2);
  // Recreate a newer active lease and prove the stale worker ACK changes zero rows.
  const newToken = randomUUID();
  await source.query("UPDATE cortex_outbox SET status='processing',lease_token=$2,leased_until=now()+interval '60 seconds',delivered_at=NULL WHERE event_id=$1", [leased.eventId, newToken]);
  await new CortexOutboxWorker(source, http, config).deliver(oldRow);
  assert.equal((await row(leased.eventId)).lease_token, newToken); assert.equal((await row(leased.eventId)).status, 'processing');
  await source.query("UPDATE cortex_outbox SET leased_until=now()-interval '1 second' WHERE event_id=$1", [leased.eventId]);
  await new CortexOutboxWorker(source, http, config).drain();
  assert.equal((await row(leased.eventId)).status, 'delivered');

  const lost = await record(); const before = transportCalls; let loseAck = true;
  const flakyDb = { query: async (sql, parameters) => { if (loseAck && sql.includes("SET status = 'delivered'")) { loseAck = false; throw new Error('Simulated ACK persistence loss'); } return source.query(sql, parameters); } };
  await new CortexOutboxWorker(flakyDb, http, config).drain();
  assert.equal((await row(lost.eventId)).status, 'pending');
  await source.query('UPDATE cortex_outbox SET available_at=now() WHERE event_id=$1', [lost.eventId]);
  await new CortexOutboxWorker(source, http, config).drain();
  assert.equal((await row(lost.eventId)).status, 'delivered'); assert.equal((await row(lost.eventId)).attempts, 2); assert.equal(transportCalls - before, 2);
  assert.equal([...points.values()].filter(value => value.eventId === lost.eventId).length, 1);
  console.log('PASS: migrations=13 repeat=0; atomic rollback; tenant FK; disjoint concurrent claims; expired lease recovery; stale ACK fenced; lost ACK retry same identity; pending rollback refused; no external transport');
 } finally {
  if (fixtureIds.length) { await source.query('DELETE FROM cortex_outbox WHERE event_id = ANY($1::uuid[])', [fixtureIds]); await source.query('DELETE FROM platform_events WHERE id = ANY($1::uuid[])', [fixtureIds]); }
  await source.destroy();
 }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
