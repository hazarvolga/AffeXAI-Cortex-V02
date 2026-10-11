/* DB-side crash/restart fixture for the isolated automation worker acceptance. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomBytes, randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');

const appRequire = createRequire('/app/apps/backend/package.json');
const { Client } = appRequire('pg');
const mode = process.argv[2];
const statePath = '/state/automation-restart.json';
if (process.env.FORMS_AUTOMATION_ISOLATED !== '1') throw new Error('Isolated automation restart opt-in required');
if (!['seed', 'verify', 'cleanup'].includes(mode)) throw new Error('Expected seed, verify, or cleanup mode');

const db = new Client({
  host: 'postgres-test', port: 5432, user: 'g0_test',
  password: 'g0_ephemeral_local_only', database: 'affexai_g0_ephemeral',
});

async function seed() {
  const state = {
    tenant: `restart-${randomBytes(5).toString('hex')}`,
    eventId: randomUUID(),
    ruleId: randomUUID(),
    staleLeaseToken: randomUUID(),
  };
  // Persist cleanup coordinates first so an interrupted seed cannot orphan rows.
  fs.writeFileSync(statePath, JSON.stringify(state), { mode: 0o600 });
  await db.query('BEGIN');
  try {
    await db.query(
      `INSERT INTO automation_rules
        (id, tenant_id, name, "triggerEventType", "triggerConditions", actions, requires_approval, impact_level, authorized_approvers)
       VALUES ($1,$2,$3,'form.submitted','{}'::jsonb,$4::jsonb,true,'medium','[]'::jsonb)`,
      [state.ruleId, state.tenant, 'Restart durable dispatch', JSON.stringify([{ type: 'email.create_campaign', config: {}, order: 0 }])],
    );
    await db.query(
      `INSERT INTO platform_events
        (id, tenant_id, source, "eventType", payload, metadata)
       VALUES ($1,$2,'forms','form.submitted',$3::jsonb,'{"containsPii":false}'::jsonb)`,
      [state.eventId, state.tenant, JSON.stringify({ schemaVersion: 1, formId: randomUUID(), submissionId: randomUUID() })],
    );
    await db.query(
      `INSERT INTO automation_dispatch_outbox
        (event_id,rule_id,tenant_id,status,attempts,lease_token,leased_until)
       VALUES($1,$2,$3,'processing',1,$4,now() - interval '1 second')`,
      [state.eventId, state.ruleId, state.tenant, state.staleLeaseToken],
    );
    await db.query('COMMIT');
    console.log('SEEDED: expired processing lease from an interrupted automation worker');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

function readState() {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!state || typeof state !== 'object'
    || !/^restart-[0-9a-f]{10}$/.test(state.tenant)
    || !uuid.test(state.eventId)
    || !uuid.test(state.ruleId)
    || !uuid.test(state.staleLeaseToken)) {
    throw new Error('Invalid automation restart fixture state');
  }
  return state;
}

async function verify() {
  const state = readState();
  const deadline = Date.now() + 20_000;
  let approval;
  while (Date.now() < deadline) {
    approval = (await db.query(
      'SELECT * FROM automation_approvals WHERE tenant_id=$1 AND rule_id=$2 AND event_id=$3',
      [state.tenant, state.ruleId, state.eventId],
    )).rows[0];
    if (approval) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(approval, 'Restarted worker did not create the persisted approval');
  assert.equal(approval.status, 'pending');
  const dispatch = (await db.query(
    'SELECT * FROM automation_dispatch_outbox WHERE event_id=$1 AND rule_id=$2 AND tenant_id=$3',
    [state.eventId, state.ruleId, state.tenant],
  )).rows[0];
  assert.equal(dispatch.status, 'delivered');
  assert.equal(dispatch.attempts, 2);
  assert.equal(dispatch.lease_token, null);
  const event = (await db.query('SELECT "triggeredRules" FROM platform_events WHERE id=$1 AND tenant_id=$2', [state.eventId, state.tenant])).rows[0];
  assert.deepEqual(event.triggeredRules, [state.ruleId]);
  const count = Number((await db.query(
    'SELECT count(*) AS count FROM automation_approvals WHERE tenant_id=$1 AND rule_id=$2 AND event_id=$3',
    [state.tenant, state.ruleId, state.eventId],
  )).rows[0].count);
  assert.equal(count, 1);
  console.log('PASS: expired worker lease was reclaimed and delivered exactly once after restart');
}

async function cleanup() {
  if (!fs.existsSync(statePath)) return;
  const state = readState();
  await db.query('DELETE FROM automation_approvals WHERE tenant_id=$1 AND rule_id=$2 AND event_id=$3', [state.tenant, state.ruleId, state.eventId]);
  await db.query('DELETE FROM automation_dispatch_outbox WHERE tenant_id=$1 AND rule_id=$2 AND event_id=$3', [state.tenant, state.ruleId, state.eventId]);
  await db.query('DELETE FROM platform_events WHERE tenant_id=$1 AND id=$2', [state.tenant, state.eventId]);
  await db.query('DELETE FROM automation_rules WHERE tenant_id=$1 AND id=$2', [state.tenant, state.ruleId]);
  fs.rmSync(statePath, { force: true });
}

async function main() {
  await db.connect();
  try {
    assert.equal((await db.query('SELECT current_database() AS name')).rows[0].name, 'affexai_g0_ephemeral');
    if (mode === 'seed') await seed();
    if (mode === 'verify') await verify();
    if (mode === 'cleanup') await cleanup();
  } finally {
    await db.end();
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
