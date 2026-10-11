/* Full Forms -> CRM -> durable Automation acceptance. Isolated Docker network only. */
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');

const appRequire = createRequire('/app/apps/backend/package.json');
const { Client } = appRequire('pg');
const bcrypt = appRequire('bcryptjs');

if (process.env.FORMS_AUTOMATION_ISOLATED !== '1') {
  throw new Error('Isolated Forms/Automation acceptance opt-in required');
}

const db = new Client({
  host: 'postgres-test', port: 5432, user: 'g0_test',
  password: 'g0_ephemeral_local_only', database: 'affexai_g0_ephemeral',
});
const base = 'http://affexai-g1-app-smoke:9006/api';
const fixtures = { users: [], roles: [], organizations: [], tenants: [] };
const password = `Test-${randomBytes(24).toString('hex')}`;

async function api(path, status, { method = 'GET', token, tenant, body, idempotencyKey } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenant ? { 'x-tenant-id': tenant } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  assert.equal(response.status, status, `${method} ${path} returned ${response.status}; expected ${status}`);
  try {
    const parsed = JSON.parse(text);
    return parsed.data ?? parsed;
  } catch {
    return text;
  }
}

async function account(tenant, roleName, permissions, email, existingOrganizationId) {
  fixtures.tenants.push(tenant);
  const organizationId = existingOrganizationId ?? randomUUID();
  const roleId = randomUUID();
  const userId = randomUUID();
  if (!existingOrganizationId) {
    await db.query(
      'INSERT INTO organizations(id,name,slug,"isActive") VALUES($1,$2,$3,true)',
      [organizationId, `${roleName} acceptance`, tenant],
    );
    fixtures.organizations.push(organizationId);
  }
  await db.query(
    'INSERT INTO roles(id,tenant_id,name,"displayName",permissions) VALUES($1,$2,$3,$3,$4)',
    [roleId, tenant, roleName, JSON.stringify(permissions)],
  );
  fixtures.roles.push(roleId);
  await db.query(
    'INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","roleId","organizationId","emailVerified") VALUES($1,$2,$3,$4,$5,$6,$7,$8,true)',
    [userId, tenant, email, await bcrypt.hash(password, 10), 'Acceptance', 'Owner', roleId, organizationId],
  );
  fixtures.users.push(userId);
  await db.query(
    'INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES($1,$2,$3,true)',
    [tenant, userId, roleId],
  );
  return { tenant, email, userId, organizationId };
}

async function login(account) {
  return api('/auth/login', 201, {
    method: 'POST', tenant: account.tenant,
    body: { email: account.email, password },
  });
}

async function waitForApproval(tenant, ruleId, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await db.query(
      'SELECT * FROM automation_approvals WHERE tenant_id=$1 AND rule_id=$2 ORDER BY created_at DESC LIMIT 1',
      [tenant, ruleId],
    );
    if (result.rows[0]) return result.rows[0];
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Automation approval was not created from the durable dispatch');
}

async function cleanup() {
  const tenants = [...new Set(fixtures.tenants)];
  const queries = tenants.length ? [
    ['DELETE FROM automation_action_executions WHERE tenant_id = ANY($1::varchar[])', tenants],
    ['DELETE FROM automation_approvals WHERE tenant_id = ANY($1::varchar[])', tenants],
    ['DELETE FROM automation_dispatch_outbox WHERE tenant_id = ANY($1::varchar[])', tenants],
    ['DELETE FROM cortex_outbox WHERE tenant_id = ANY($1::varchar[])', tenants],
    ['DELETE FROM platform_events WHERE tenant_id = ANY($1::varchar[])', tenants],
    ['DELETE FROM crm_leads WHERE tenant_id = ANY($1::varchar[])', tenants],
    ['DELETE FROM form_submissions WHERE "tenantId" = ANY($1::varchar[])', tenants],
    ['DELETE FROM forms WHERE "tenantId" = ANY($1::varchar[])', tenants],
    ['DELETE FROM email_campaigns WHERE tenant_id = ANY($1::varchar[])', tenants],
    ['DELETE FROM automation_rules WHERE tenant_id = ANY($1::varchar[])', tenants],
  ] : [];
  for (const [sql, values] of queries) await db.query(sql, [values]);
  if (fixtures.users.length) {
    await db.query('DELETE FROM user_roles WHERE "userId" = ANY($1::uuid[])', [fixtures.users]);
    await db.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [fixtures.users]);
  }
  if (fixtures.roles.length) await db.query('DELETE FROM roles WHERE id = ANY($1::uuid[])', [fixtures.roles]);
  if (fixtures.organizations.length) await db.query('DELETE FROM organizations WHERE id = ANY($1::uuid[])', [fixtures.organizations]);
}

async function main() {
  await db.connect();
  try {
    assert.equal((await db.query('SELECT current_database() AS name')).rows[0].name, 'affexai_g0_ephemeral');
    const suffix = randomBytes(5).toString('hex');
    const ownerPermissions = ['forms.view', 'forms.manage', 'forms.submissions.view', 'settings.manage', 'automation.approve'];
    const ownerA = await account(`forms-a-${suffix}`, 'organization_owner', ownerPermissions, `owner-a-${suffix}@example.test`);
    const reviewerA = await account(ownerA.tenant, 'admin', ownerPermissions, `reviewer-${suffix}@example.test`, ownerA.organizationId);
    const ownerB = await account(`forms-b-${suffix}`, 'organization_owner', ownerPermissions, `owner-b-${suffix}@example.test`);
    const [ownerSession, reviewerSession, otherSession] = await Promise.all([
      login(ownerA), login(reviewerA), login(ownerB),
    ]);

    const rule = await api('/automation/rules', 201, {
      method: 'POST', token: ownerSession.access_token,
      body: {
        name: `Form campaign ${suffix}`,
        isActive: true,
        triggerEventType: 'form.submitted',
        triggerConditions: {},
        actions: [{
          type: 'email.create_campaign', order: 0,
          config: { name: `Qualified lead ${suffix}`, subject: 'New qualified lead', content: 'Review the CRM lead.' },
        }],
        requiresApproval: true,
        impactLevel: 'medium',
        authorizedApprovers: [ownerA.userId],
      },
    });

    const structure = {
      rows: [{
        id: 'contact_row', type: 'section', settings: {},
        columns: [{
          id: 'contact_column', width: '100%',
          blocks: [
            { id: 'workEmail', type: 'input', properties: { label: 'Work email', required: true, inputType: 'email' }, styles: {} },
            { id: 'contactName', type: 'input', properties: { label: 'Contact name', required: true, inputType: 'text' }, styles: {} },
          ],
        }],
      }],
      settings: { theme: 'editorial', submitButtonText: 'Send' },
    };
    const form = await api('/forms', 201, {
      method: 'POST', token: ownerSession.access_token,
      body: {
        name: `Lead intake ${suffix}`,
        description: 'Runtime acceptance form',
        structure,
        settings: {
          theme: 'editorial', successMessage: 'Received',
          notificationEmail: 'private-ops@example.test',
          crmLeadCapture: { enabled: true, emailField: 'workEmail', contactNameField: 'contactName' },
        },
      },
    });
    assert.equal(form.status, 'draft');
    await api(`/forms/${form.id}`, 404, { token: otherSession.access_token });
    await api(`/forms/public/${ownerA.tenant}/${form.id}`, 404);
    await api(`/forms/${form.id}/publish`, 201, { method: 'POST', token: ownerSession.access_token });

    const published = await api(`/forms/public/${ownerA.tenant}/${form.id}`, 200);
    assert.equal(published.id, form.id);
    assert.equal(published.settings.successMessage, 'Received');
    assert.equal(Object.hasOwn(published.settings, 'notificationEmail'), false);
    assert.equal(Object.hasOwn(published.settings, 'crmLeadCapture'), false);
    await api(`/forms/public/${ownerB.tenant}/${form.id}`, 404);

    const idempotencyKey = `form_${randomBytes(20).toString('hex')}`;
    const submissionBody = { data: { workEmail: `lead-${suffix}@example.test`, contactName: 'Runtime Lead' } };
    const first = await api(`/forms/public/${ownerA.tenant}/${form.id}/submissions`, 201, {
      method: 'POST', body: submissionBody, idempotencyKey,
    });
    const replay = await api(`/forms/public/${ownerA.tenant}/${form.id}/submissions`, 201, {
      method: 'POST', body: submissionBody, idempotencyKey,
    });
    assert.equal(replay.submissionId, first.submissionId);
    await api(`/forms/public/${ownerA.tenant}/${form.id}/submissions`, 409, {
      method: 'POST', body: { data: { ...submissionBody.data, contactName: 'Changed' } }, idempotencyKey,
    });

    const submissions = await api(`/forms/${form.id}/submissions`, 200, { token: ownerSession.access_token });
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].id, first.submissionId);
    const lead = (await db.query('SELECT * FROM crm_leads WHERE tenant_id=$1 AND source_record_id=$2', [ownerA.tenant, first.submissionId])).rows[0];
    assert.equal(lead.email, submissionBody.data.workEmail);
    assert.equal(lead.contact_name, submissionBody.data.contactName);

    const formEvents = (await db.query(
      `SELECT * FROM platform_events WHERE tenant_id=$1 AND "eventType"='form.submitted' AND payload->>'submissionId'=$2`,
      [ownerA.tenant, first.submissionId],
    )).rows;
    assert.equal(formEvents.length, 1);
    assert.equal(formEvents[0].metadata.containsPii, false);
    assert.equal(JSON.stringify(formEvents[0].payload).includes(submissionBody.data.workEmail), false);

    const approval = await waitForApproval(ownerA.tenant, rule.id);
    const dispatch = (await db.query(
      'SELECT * FROM automation_dispatch_outbox WHERE event_id=$1 AND rule_id=$2',
      [formEvents[0].id, rule.id],
    )).rows[0];
    assert.equal(dispatch.status, 'delivered');
    assert.equal(dispatch.tenant_id, ownerA.tenant);
    await api(`/automation/approvals/${approval.id}/approve`, 403, {
      method: 'POST', token: reviewerSession.access_token, body: { comment: 'Non-owner must fail' },
    });
    await api(`/automation/approvals/${approval.id}/approve`, 404, {
      method: 'POST', token: otherSession.access_token, body: { comment: 'Cross-tenant must fail' },
    });

    const approved = await api(`/automation/approvals/${approval.id}/approve`, 201, {
      method: 'POST', token: ownerSession.access_token, body: { comment: 'Runtime acceptance approved' },
    });
    assert.equal(approved.status, 'approved');
    await api(`/automation/approvals/${approval.id}/approve`, 409, {
      method: 'POST', token: ownerSession.access_token, body: { comment: 'Duplicate must fail' },
    });

    const campaignSlug = `automation-${formEvents[0].id}-${rule.id}-0`;
    const campaigns = (await db.query('SELECT * FROM email_campaigns WHERE slug=$1', [campaignSlug])).rows;
    assert.equal(campaigns.length, 1);
    assert.equal(campaigns[0].tenant_id, ownerA.tenant);
    assert.equal(campaigns[0].status, 'draft');
    const execution = (await db.query(
      'SELECT * FROM automation_action_executions WHERE event_id=$1 AND rule_id=$2 AND action_order=0',
      [formEvents[0].id, rule.id],
    )).rows[0];
    assert.equal(execution.status, 'delivered');
    const storedApproval = (await db.query('SELECT * FROM automation_approvals WHERE id=$1', [approval.id])).rows[0];
    assert.equal(storedApproval.is_executed, true);
    assert.equal(storedApproval.execution_result.success, true);

    await api(`/forms/${form.id}/unpublish`, 201, { method: 'POST', token: ownerSession.access_token });
    await api(`/forms/public/${ownerA.tenant}/${form.id}`, 404);
    await api(`/forms/public/${ownerA.tenant}/${form.id}/submissions`, 404, {
      method: 'POST', body: submissionBody, idempotencyKey: `form_${randomBytes(20).toString('hex')}`,
    });

    console.log('PASS: published form -> idempotent submission -> CRM lead -> PII-free durable event/dispatch -> owner approval -> one tenant-scoped draft campaign');
  } finally {
    await cleanup();
    await db.end();
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
