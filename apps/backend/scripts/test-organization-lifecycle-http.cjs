const assert = require('node:assert/strict');
const { Client } = require('pg');
const { JwtService } = require('@nestjs/jwt');

if (process.env.ORGANIZATION_LIFECYCLE_ISOLATED !== '1') throw new Error('Isolated acceptance marker required');

const api = 'http://affexai-g1-app-smoke:9006/api/organizations';
const secret = 'isolated-local-acceptance-secret-never-for-deployment';
const platformId = '7f9b2f7c-5ec4-4a67-8424-f0d20e89a693';
const adminOne = '11111111-1111-4111-8111-111111111111';
const adminTwo = '22222222-2222-4222-8222-222222222222';
const adminThree = '44444444-4444-4444-8444-444444444444';
const roleId = '33333333-3333-4333-8333-333333333333';
const slug = 'xyz-company-acceptance';
const otherSlug = 'other-company-acceptance';
const db = new Client({ host: 'postgres-test', port: 5432, user: 'g0_test', password: 'g0_ephemeral_local_only', database: 'affexai_g0_ephemeral' });
const jwt = new JwtService({ secret });

async function request(path, token, options = {}, expected = 200) {
  const response = await fetch(`${api}${path}`, {
    ...options,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  assert.equal(response.status, expected, `${options.method || 'GET'} ${path}: ${response.status} ${JSON.stringify(body)}`);
  return body?.data ?? body;
}

async function requestStatus(path, token, options = {}) {
  return (await fetch(`${api}${path}`, {
    ...options,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(options.headers || {}) },
  })).status;
}

async function cleanup() {
  await db.query('DELETE FROM organization_audit_logs WHERE tenant_id = ANY($1)', [[slug, otherSlug]]);
  await db.query('DELETE FROM user_roles WHERE "userId" = ANY($1::uuid[])', [[adminOne, adminTwo, adminThree]]);
  await db.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[platformId, adminOne, adminTwo, adminThree]]);
  await db.query('DELETE FROM roles WHERE id=$1', [roleId]);
  await db.query('DELETE FROM organizations WHERE slug = ANY($1)', [[slug, otherSlug]]);
}

(async () => {
  await db.connect();
  try {
    await cleanup();
    await db.query(`INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter")
      VALUES($1,'platform','platform.acceptance@example.test','fixture','Platform','Admin',true,true,1,false)`, [platformId]);
    const platformToken = await jwt.signAsync({ sub: platformId, type: 'access', tokenVersion: 1 }, { expiresIn: '5m' });
    const created = await request('', platformToken, { method: 'POST', body: JSON.stringify({ name: 'XYZ Company', slug }) }, 201);
    assert.equal(created.slug, slug);

    await db.query(`INSERT INTO roles(id,tenant_id,name,"displayName",description,permissions,is_active,is_custom)
      VALUES($1,$2,'organization_admin','Organization Admin','Acceptance role','["*"]'::jsonb,true,false)`, [roleId, slug]);
    for (const [id, email] of [[adminOne, 'admin.one@example.test'], [adminTwo, 'admin.two@example.test'], [adminThree, 'admin.three@example.test']]) {
      await db.query(`INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter","organizationId")
        VALUES($1,$2,$3,'fixture','Acceptance','Admin',true,true,1,false,$4)`, [id, slug, email, id === adminOne ? created.id : null]);
      await db.query(`INSERT INTO user_roles(tenant_id,"userId","roleId","isPrimary") VALUES($1,$2,$3,true)`, [slug, id, roleId]);
    }
    const firstToken = await jwt.signAsync({ sub: adminOne, type: 'access', tokenVersion: 1 }, { expiresIn: '5m' });
    const current = await request('/current', firstToken);
    assert.equal(current.id, created.id);
    await request(`/current/members/${adminOne}`, firstToken, { method: 'DELETE' }, 400);
    await request(`/current/members/${adminTwo}`, firstToken, { method: 'POST' }, 201);
    await request(`/current/members/${adminOne}`, firstToken, { method: 'DELETE' });

    const removed = await db.query('SELECT "isActive","tokenVersion","refreshToken" FROM users WHERE id=$1', [adminOne]);
    assert.equal(removed.rows[0].isActive, false);
    assert.equal(removed.rows[0].tokenVersion, 2);
    assert.equal(removed.rows[0].refreshToken, null);

    await request('', platformToken, { method: 'POST', body: JSON.stringify({ name: 'Other Company', slug: otherSlug }) }, 201);
    const other = await db.query('SELECT id FROM organizations WHERE slug=$1', [otherSlug]);
    await assert.rejects(db.query('UPDATE users SET "organizationId"=$1 WHERE id=$2', [other.rows[0].id, adminTwo]), error => error.code === '23503');
    await assert.rejects(db.query('UPDATE user_roles SET tenant_id=$1 WHERE "userId"=$2', [otherSlug, adminTwo]), error => error.code === '23503');

    const secondToken = await jwt.signAsync({ sub: adminTwo, type: 'access', tokenVersion: 1 }, { expiresIn: '5m' });
    await request(`/current/members/${adminThree}`, secondToken, { method: 'POST' }, 201);
    const thirdToken = await jwt.signAsync({ sub: adminThree, type: 'access', tokenVersion: 1 }, { expiresIn: '5m' });
    const concurrentStatuses = await Promise.all([
      requestStatus(`/current/members/${adminTwo}`, secondToken, { method: 'DELETE' }),
      requestStatus(`/current/members/${adminThree}`, thirdToken, { method: 'DELETE' }),
    ]);
    assert.deepEqual([...concurrentStatuses].sort(), [200, 400]);
    const activeAdmin = concurrentStatuses[0] === 400 ? { id: adminTwo, token: secondToken } : { id: adminThree, token: thirdToken };
    await request(`/${created.id}/status`, platformToken, { method: 'PATCH', body: JSON.stringify({ isActive: false }) });
    await request('/current', activeAdmin.token, {}, 401);
    await request(`/${created.id}/status`, platformToken, { method: 'PATCH', body: JSON.stringify({ isActive: true }) });
    const state = await db.query('SELECT "isActive","tokenVersion" FROM users WHERE id=$1', [activeAdmin.id]);
    assert.equal(state.rows[0].isActive, true);
    assert.equal(state.rows[0].tokenVersion, 2);

    const audits = await db.query(`SELECT action,count(*)::int AS count FROM organization_audit_logs WHERE tenant_id=$1 GROUP BY action`, [slug]);
    const actions = Object.fromEntries(audits.rows.map(row => [row.action, row.count]));
    for (const action of ['organization.created', 'organization.deactivated', 'organization.activated']) assert.equal(actions[action], 1, `missing audit ${action}`);
    assert.equal(actions['organization.member_linked'], 2);
    assert.equal(actions['organization.member_removed'], 2);
    console.log('PASS: platform create/status; tenant membership; last-admin protection; token revocation; cross-tenant FK; persistent audit');
  } finally {
    await cleanup();
    await db.end();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
