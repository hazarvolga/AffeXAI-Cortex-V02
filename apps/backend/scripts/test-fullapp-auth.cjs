/* Runs only inside the isolated Docker acceptance network. Never bootstrap or seed production. */
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const appRequire = createRequire('/app/apps/backend/package.json');
const { Client } = appRequire('pg');
const bcrypt = appRequire('bcryptjs');
if (process.env.G1_FULLAPP_ISOLATED !== '1') throw new Error('Isolated application test opt-in required');
const db = new Client({ host: 'postgres-test', port: 5432, user: 'g0_test', password: 'g0_ephemeral_local_only', database: 'affexai_g0_ephemeral' });
const base = 'http://affexai-g1-app-smoke:9006/api';
const users = [], roles = [], organizations = [];
const password = `Test-${randomBytes(24).toString('hex')}`;
async function api(path, status, { method = 'GET', token, tenant, body } = {}) {
  const response = await fetch(base + path, { method, headers: {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenant ? { 'x-tenant-id': tenant } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, status, `${method} ${path} status`);
  const text = await response.text();
  try { const parsed = JSON.parse(text); return parsed.data ?? parsed; } catch { return text; }
}
async function account(tenant, name, email, id = randomUUID()) {
  const organizationId = randomUUID();
  const roleId = randomUUID();
  await db.query('INSERT INTO organizations(id,name,slug,"isActive") VALUES($1,$2,$3,true)', [organizationId, `${name} acceptance`, tenant]);
  organizations.push(organizationId);
  await db.query('INSERT INTO roles(id,tenant_id,name,"displayName",permissions) VALUES($1,$2,$3,$3,$4)', [roleId, tenant, name, JSON.stringify(['users.view'])]);
  roles.push(roleId);
  await db.query('INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","roleId","organizationId","emailVerified") VALUES($1,$2,$3,$4,$5,$6,$7,$8,true)', [id, tenant, email, await bcrypt.hash(password, 10), 'Acceptance', 'Fixture', roleId, organizationId]);
  users.push(id);
  await db.query('INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES($1,$2,$3,true)', [tenant, id, roleId]);
  return { id, tenant, email, roleId };
}
async function main() {
  await db.connect();
  try {
    assert.equal((await db.query('SELECT current_database() AS name')).rows[0].name, 'affexai_g0_ephemeral');
    await api('/health', 200);
    for (const table of ['products', 'prices', 'subscriptions', 'usage_records']) {
      assert.equal(Number((await db.query(`SELECT count(*) AS n FROM "${table}"`)).rows[0].n), 0, `No bootstrap billing writes: ${table}`);
    }
    const suffix = randomBytes(5).toString('hex');
    const a = await account(`xyz-company-${suffix}`, 'admin', `same-${suffix}@example.test`);
    const b = await account(`other-company-${suffix}`, 'admin', a.email);
    const operator = await account(`platform-${suffix}`, 'viewer', `operator-${suffix}@example.test`, '7f9b2f7c-5ec4-4a67-8424-f0d20e89a693');
    const login = u => api('/auth/login', 201, { method: 'POST', tenant: u.tenant, body: { email: u.email, password } });
    await api('/auth/login', 401, { method: 'POST', body: { email: a.email, password } });
    const sa = await login(a), sb = await login(b), sp = await login(operator);
    assert.equal(sa.user.id, a.id); assert.equal(sb.user.id, b.id);
    assert.equal(sp.user.isPlatformAdmin, true); assert.equal(sa.user.isPlatformAdmin, false);
    assert.equal((await api('/auth/me', 200, { token: sa.access_token })).id, a.id);
    await api('/auth/me', 403, { token: sa.access_token, tenant: b.tenant });
    await api('/auth/me', 401, { token: sa.refresh_token });
    await api(`/users/${b.id}`, 404, { token: sa.access_token });
    const visible = await api(`/users/${a.id}`, 200, { token: sa.access_token });
    for (const field of ['password', 'refreshToken', 'emailVerificationToken']) assert.equal(Object.hasOwn(visible, field), false, `User credential exclusion: ${field}`);
    await api('/roles', 403, { method: 'POST', token: sa.access_token, body: { name: 'super_admin', displayName: 'Reserved', permissions: [] } });
    await api('/backup', 403, { token: sa.access_token });
    await api('/admin/queues', 401);
    await api('/admin/queues', 403, { token: sa.access_token });
    await api('/database-import/execute', 404, { method: 'POST', token: sp.access_token, body: { sql: 'SELECT 1' } });
    const rotated = await api('/auth/refresh', 201, { method: 'POST', body: { refresh_token: sa.refresh_token } });
    await api('/auth/refresh', 401, { method: 'POST', body: { refresh_token: sa.refresh_token } });
    await api('/auth/change-password', 201, { method: 'POST', token: rotated.access_token, body: { currentPassword: password, newPassword: `New-${password}` } });
    await api('/auth/me', 401, { token: rotated.access_token });
    await api('/auth/refresh', 401, { method: 'POST', body: { refresh_token: rotated.refresh_token } });
    await db.query('UPDATE users SET "isActive"=false WHERE id=$1', [b.id]);
    await api('/auth/me', 401, { token: sb.access_token });
    console.log('PASS: full Nest app + migrated PostgreSQL + Redis; no fake billing seed; two-tenant login/ownership, platform boundaries, credential serialization, refresh reuse, password revocation and inactive account rejection');
  } finally {
    if (users.length) { await db.query('DELETE FROM user_roles WHERE "userId" = ANY($1::uuid[])', [users]); await db.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [users]); }
    if (roles.length) await db.query('DELETE FROM roles WHERE id = ANY($1::uuid[])', [roles]);
    if (organizations.length) await db.query('DELETE FROM organizations WHERE id = ANY($1::uuid[])', [organizations]);
    await db.end();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
