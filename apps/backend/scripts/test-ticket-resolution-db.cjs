/* Run only in the existing labelled ephemeral app acceptance container. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const source = require('./dist/core/database/data-source').default;
const { TicketsService } = require('./dist/modules/tickets/tickets.service');
const { Ticket } = require('./dist/modules/tickets/entities/ticket.entity');
const { TenantService } = require('./dist/core/tenant/tenant.service');
const { CortexOutboxService } = require('./dist/core/cortex/cortex-outbox.service');
if (process.env.G2_TICKET_ISOLATED !== '1' || process.env.DATABASE_NAME !== 'affexai_g0_ephemeral') throw new Error('Isolated acceptance database required');
const tenantId = `ticket-acceptance-${randomUUID()}`, userId = randomUUID(), ticketId = randomUUID();
const tenants = new TenantService();
const outbox = new CortexOutboxService();
const service = Object.assign(Object.create(TicketsService.prototype), {
 ticketRepository: source.getRepository(Ticket), tenantService: tenants, cortexOutbox: outbox,
 userRepository: { findOne: async () => null },
 slaService: { calculateResolutionTime: () => 1, checkSLABreach: () => false },
 notificationsGateway: { emitStatusChanged: () => {} },
});
const change = status => tenants.runWithTenant({ tenantId, source: 'authenticated' }, () => service.updateStatus(ticketId, status, userId));
const count = async table => Number((await source.query(`SELECT count(*) AS n FROM ${table} WHERE ${table === 'tickets' ? 'id' : table === 'ticket_audit_logs' ? '"ticketId"' : 'tenant_id'}=$1`, [table === 'tickets' || table === 'ticket_audit_logs' ? ticketId : tenantId]))[0].n);
(async () => {
 await source.initialize();
 try {
  assert.equal((await source.query('SELECT current_database() AS name'))[0].name, 'affexai_g0_ephemeral');
  await source.query('INSERT INTO users(id,tenant_id,email,password,"firstName","lastName") VALUES($1,$2,$3,$4,$5,$6)', [userId,tenantId,`${userId}@example.test`,'unusable-fixture-hash','Ticket','Fixture']);
  await source.query('INSERT INTO tickets(id,tenant_id,"displayNumber",subject,description,"userId",status) VALUES($1,$2,$3,$4,$5,$6,$7)', [ticketId,tenantId,`G2-${ticketId.slice(0,12)}`,'Fixture','No external delivery',userId,'open']);
  service.cortexOutbox = { recordTicketResolved: async (...args) => { await outbox.recordTicketResolved(...args); throw new Error('forced producer rollback'); } };
  await assert.rejects(change('resolved'), /forced producer rollback/);
  assert.equal((await source.query('SELECT status FROM tickets WHERE id=$1',[ticketId]))[0].status,'open');
  assert.equal(await count('ticket_audit_logs'),0); assert.equal(await count('platform_events'),0); assert.equal(await count('cortex_outbox'),0);
  service.cortexOutbox = outbox;
  await Promise.all([change('resolved'),change('resolved')]);
  assert.equal(await count('ticket_audit_logs'),1); assert.equal(await count('platform_events'),1); assert.equal(await count('cortex_outbox'),1);
  await change('open'); await change('resolved');
  assert.equal(await count('ticket_audit_logs'),3); assert.equal(await count('platform_events'),2); assert.equal(await count('cortex_outbox'),2);
  const events = await source.query('SELECT event_id,payload FROM cortex_outbox WHERE tenant_id=$1',[tenantId]);
  assert.notEqual(events[0].event_id,events[1].event_id);
  const stats=await tenants.runWithTenant({tenantId,source:'authenticated'},()=>service.getStats());
  assert.equal(stats.averageResponseTime,0); assert.equal(stats.averageResolutionTime,1);

  await assert.rejects(tenants.runWithTenant({tenantId:'foreign-fixture',source:'authenticated'},()=>service.updateStatus(ticketId,'closed',userId)),/not found/);
  console.log('PASS: real TicketsService + PostgreSQL atomic ticket/audit/event/outbox rollback; concurrent resolutions one event; reopen resolves new event; foreign tenant denied. Mail/socket mocked, Cortex delivery separate.');
 } finally {
  await source.query('DELETE FROM cortex_outbox WHERE tenant_id=$1',[tenantId]);
  await source.query('DELETE FROM platform_events WHERE tenant_id=$1',[tenantId]);
  await source.query('DELETE FROM tickets WHERE id=$1',[ticketId]);
  await source.query('DELETE FROM users WHERE id=$1',[userId]);
  await source.destroy();
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
