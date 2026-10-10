/* Disposable acceptance fixture only. No email/provider calls. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const source = require('./dist/core/database/data-source').default;
const { TicketCSATService } = require('./dist/modules/tickets/services/ticket-csat.service');
const { TicketCSAT } = require('./dist/modules/tickets/entities/ticket-csat.entity');
const { Ticket } = require('./dist/modules/tickets/entities/ticket.entity');
const { TenantService } = require('./dist/core/tenant/tenant.service');
if (process.env.G2_CSAT_ISOLATED !== '1' || process.env.DATABASE_NAME !== 'affexai_g0_ephemeral') throw new Error('Isolated acceptance database required');
const tenantId = `csat-acceptance-${randomUUID()}`, userId = randomUUID(), ticketId = randomUUID();
const tenants = new TenantService();
let failure = true;
const sent = [];
const email = { sendTicketResolved: async (_ticket, token) => { if (failure) throw new Error('fixture mail unavailable'); sent.push(token); } };
const service = new TicketCSATService(source.getRepository(TicketCSAT), source.getRepository(Ticket), email, tenants);
const issue = () => tenants.runWithTenant({ tenantId, source: 'authenticated' }, () => service.requestSurvey(ticketId));
(async () => {
  await source.initialize();
  try {
    assert.equal((await source.query('SELECT current_database() AS name'))[0].name, 'affexai_g0_ephemeral');
    await source.query('INSERT INTO users(id,tenant_id,email,password,"firstName","lastName") VALUES($1,$2,$3,$4,$5,$6)', [userId, tenantId, `${userId}@example.test`, 'unusable-fixture-hash', 'CSAT', 'Fixture']);
    await source.query('INSERT INTO tickets(id,tenant_id,"displayNumber",subject,description,"userId",status) VALUES($1,$2,$3,$4,$5,$6,$7)', [ticketId, tenantId, `CSAT-${ticketId.slice(0, 12)}`, 'CSAT DB fixture', 'No external delivery', userId, 'resolved']);
    await assert.rejects(issue(), /fixture mail unavailable/);
    failure = false;
    let [first, second] = await Promise.all([issue(), issue()]);
    assert.equal(first.id, second.id); assert.equal(first.surveyToken, second.surveyToken);
    assert.equal(Number((await source.query('SELECT count(*) AS n FROM ticket_csat WHERE tenant_id=$1', [tenantId]))[0].n), 1);
    assert.deepEqual(sent, [first.surveyToken, first.surveyToken]);
    await source.query('DELETE FROM ticket_csat WHERE id=$1 AND tenant_id=$2', [first.id, tenantId]);
    [first, second] = await Promise.all([issue(), issue()]);
    assert.equal(first.id, second.id); assert.equal(first.surveyToken, second.surveyToken);
    assert.equal(Number((await source.query('SELECT count(*) AS n FROM ticket_csat WHERE tenant_id=$1', [tenantId]))[0].n), 1);
    await assert.rejects(tenants.runWithTenant({ tenantId: 'foreign-fixture', source: 'authenticated' }, () => service.requestSurvey(ticketId)), /not found/);
    const outcomes = await Promise.allSettled([service.submitSurvey(first.surveyToken, { rating: 5 }), service.submitSurvey(first.surveyToken, { rating: 1 })]);
    assert.equal(outcomes.filter(value => value.status === 'fulfilled').length, 1);
    assert.equal(outcomes.filter(value => value.status === 'rejected').length, 1);
    const stored = await source.getRepository(TicketCSAT).findOneByOrFail({ id: first.id });
    assert.ok(stored.surveyCompletedAt); assert.ok([1, 5].includes(stored.rating));
    const view = await service.getSurveyByToken(first.surveyToken);
    assert.deepEqual(Object.keys(view).sort(), ['surveyCompletedAt', 'ticket', 'ticketId']);
    await source.query('UPDATE ticket_csat SET "surveyRequestedAt"=now()-interval \'31 days\' WHERE id=$1', [first.id]);
    await assert.rejects(service.getSurveyByToken(first.surveyToken), /not found/);
    console.log('PASS: real PostgreSQL CSAT issuance serialization, delivery-failure same-token retry, single-winner response CAS, tenant boundary, safe public projection and expiry. Email mocked.');
  } finally {
    await source.query('DELETE FROM ticket_csat WHERE tenant_id=$1', [tenantId]);
    await source.query('DELETE FROM tickets WHERE id=$1', [ticketId]);
    await source.query('DELETE FROM users WHERE id=$1', [userId]);
    await source.destroy();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
