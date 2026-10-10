/* Real transactions on the labelled disposable acceptance database only. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const source = require('./dist/core/database/data-source').default;
const { TicketAutomationService } = require('./dist/modules/tickets/services/ticket-automation.service');
const { TicketEscalationRulesService } = require('./dist/modules/tickets/services/ticket-escalation-rules.service');
const { TicketEscalationRule } = require('./dist/modules/tickets/entities/ticket-escalation-rule.entity');
const { Ticket } = require('./dist/modules/tickets/entities/ticket.entity');
const { TicketMessage } = require('./dist/modules/tickets/entities/ticket-message.entity');
const { NotificationsService } = require('./dist/modules/notifications/notifications.service');
const { Notification } = require('./dist/modules/notifications/entities/notification.entity');
const { Role } = require('./dist/modules/roles/entities/role.entity');
const { User } = require('./dist/modules/users/entities/user.entity');
const { TenantService } = require('./dist/core/tenant/tenant.service');
if (process.env.G3_AUTOMATION_ISOLATED !== '1' || process.env.DATABASE_NAME !== 'affexai_g0_ephemeral') throw new Error('Isolated acceptance database required');
const tenantId = `automation-${randomUUID()}`, userId = randomUUID(), ticketId = randomUUID(), ruleId = randomUUID(), roleId = randomUUID();
const tenants = new TenantService();
const notifications = new NotificationsService(source.getRepository(Notification), tenants, source.getRepository(User));
const rules = new TicketEscalationRulesService(source.getRepository(TicketEscalationRule), tenants);
const service = Object.assign(Object.create(TicketAutomationService.prototype), { tenantService: tenants, ticketRepository: source.getRepository(Ticket), escalationRulesService: rules, notificationsService: notifications });
const apply = (ticket, rule) => tenants.runWithTenant({ tenantId, source: 'system' }, () => service.applyEscalationActions(ticket, rule));
const count = async entity => source.getRepository(entity).countBy({ tenantId });
(async () => {
  await source.initialize();
  try {
    assert.equal((await source.query('SELECT current_database() AS name'))[0].name, 'affexai_g0_ephemeral');
    await source.getRepository(Role).save({ id: roleId, tenantId, name: 'support_manager', isActive: true });
    await source.query('INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","roleId") VALUES($1,$2,$3,$4,$5,$6,$7)', [userId, tenantId, `${userId}@example.test`, 'unusable-fixture-hash', 'Automation', 'Fixture', roleId]);
    await source.query('INSERT INTO tickets(id,tenant_id,"displayNumber",subject,description,"userId",status) VALUES($1,$2,$3,$4,$5,$6,$7)', [ticketId, tenantId, `AUTO-${ticketId.slice(0,12)}`, 'Automation fixture', 'No external providers', userId, 'open']);
    await source.getRepository(TicketEscalationRule).save({ id: ruleId, tenantId, name: 'Fixture escalation', conditions: {}, actions: { addNote: 'Automatic fixture note', notifySupervisors: true, assignToId: userId, setPriority: 'high' }, maxApplications: 1 });
    const ticket = await source.getRepository(Ticket).findOneByOrFail({ id: ticketId });
    const rule = await source.getRepository(TicketEscalationRule).findOneByOrFail({ id: ruleId });
    service.notificationsService = { createNotification: async (...args) => { await notifications.createNotification(...args); throw new Error('forced notification rollback'); } };
    await assert.rejects(apply(ticket, rule), /forced notification rollback/);
    assert.equal(await count(TicketMessage), 0); assert.equal(await count(Notification), 0);
    assert.equal((await source.getRepository(Ticket).findOneByOrFail({ id: ticketId })).escalationLevel, 0);
    service.notificationsService = notifications;
    await Promise.all([apply(ticket, rule), apply(ticket, rule)]);
    assert.equal(await count(TicketMessage), 1); assert.equal(await count(Notification), 1);
    const current = await source.getRepository(Ticket).findOneByOrFail({ id: ticketId });
    assert.equal(current.escalationLevel, 1); assert.equal(current.assignedToId, userId); assert.equal(current.priority, 'high');
    const note = await source.getRepository(TicketMessage).findOneByOrFail({ ticketId });
    assert.equal(note.authorId, null); assert.equal(note.tenantId, tenantId); assert.equal(note.isInternal, true); assert.equal(note.metadata.actorType, 'system');
    await assert.rejects(service.applyEscalationActions(ticket, rule), /System tenant context required/);
    console.log('PASS: real PostgreSQL escalation transaction note/ticket/notification rollback, concurrent max-once recheck, null system actor constraints, tenant scope and active supervisor delivery persistence. No email/socket/provider calls.');
  } finally {
    await source.query('DELETE FROM notifications WHERE tenant_id=$1', [tenantId]);
    await source.query('DELETE FROM ticket_messages WHERE tenant_id=$1', [tenantId]);
    await source.query('DELETE FROM ticket_escalation_rules WHERE tenant_id=$1', [tenantId]);
    await source.query('DELETE FROM tickets WHERE id=$1', [ticketId]);
    await source.query('DELETE FROM users WHERE id=$1', [userId]);
    await source.query('DELETE FROM roles WHERE id=$1', [roleId]);
    await source.destroy();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
