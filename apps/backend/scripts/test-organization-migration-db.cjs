const assert = require('node:assert/strict');
const source = require('./dist/core/database/data-source').default;

if (process.env.ORGANIZATION_MIGRATION_ISOLATED !== '1') throw new Error('Isolated migration marker required');
const org = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const role = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const user = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const assignment = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

async function cleanup() {
  if (await source.query(`SELECT to_regclass('organization_audit_logs') IS NOT NULL AS present`).then(rows => rows[0].present)) {
    await source.query('DELETE FROM organization_audit_logs WHERE organization_id=$1', [org]);
  }
  await source.query('DELETE FROM user_roles WHERE id=$1', [assignment]);
  await source.query('DELETE FROM users WHERE id=$1', [user]);
  await source.query('DELETE FROM roles WHERE id=$1', [role]);
  await source.query(`DELETE FROM settings WHERE category='legacy-migration-acceptance'`);
  await source.query('DELETE FROM organizations WHERE id=$1', [org]);
}

(async () => {
  await source.initialize();
  try {
    const history = await source.query('SELECT name FROM migrations ORDER BY id DESC LIMIT 1');
    if (history[0]?.name === 'OrganizationLifecycle1791406800000') await source.undoLastMigration({ transaction: 'all' });
    await cleanup();
    await source.query(`INSERT INTO organizations(id,name,slug,"isActive",settings) VALUES($1,'Legacy Company','Legacy-Company',true,'{}')`, [org]);
    await source.query(`INSERT INTO roles(id,tenant_id,name,"displayName",permissions,is_active,is_custom) VALUES($1,$2,'organization_owner','Owner','["*"]',true,false)`, [role, org]);
    await source.query(`INSERT INTO users(id,tenant_id,email,password,"firstName","lastName","isActive","emailVerified","tokenVersion","isSubscribedToNewsletter","organizationId","roleId")
      VALUES($1,$2::varchar,'legacy.migration@example.test','fixture','Legacy','Owner',true,true,1,false,$2::uuid,$3)`, [user, org, role]);
    await source.query(`INSERT INTO user_roles(id,tenant_id,"userId","roleId","isPrimary") VALUES($1,$2,$3,$4,true)`, [assignment, org, user, role]);
    await source.query(`INSERT INTO settings(tenant_id,category,key,value) VALUES($1,'legacy-migration-acceptance','fixture','yes')`, [org]);

    const applied = await source.runMigrations({ transaction: 'all' });
    assert.deepEqual(applied.map(item => item.name), ['OrganizationLifecycle1791406800000']);
    const [state] = await source.query(`SELECT o.slug,u.tenant_id AS user_tenant,r.tenant_id AS role_tenant,ur.tenant_id AS assignment_tenant,s.tenant_id AS setting_tenant
      FROM organizations o JOIN users u ON u."organizationId"=o.id JOIN roles r ON r.id=$2
      JOIN user_roles ur ON ur."userId"=u.id JOIN settings s ON s.category='legacy-migration-acceptance' WHERE o.id=$1`, [org, role]);
    assert.deepEqual(Object.values(state), Array(5).fill('legacy-company'));
    await assert.rejects(source.query('UPDATE user_roles SET tenant_id=$1 WHERE id=$2', ['foreign-tenant', assignment]), error => error.code === '23503');
    assert.equal((await source.runMigrations({ transaction: 'all' })).length, 0);
    console.log('PASS: legacy UUID tenant remap; lowercase slug; user/role assignment composite FKs; repeat=0');
  } finally {
    await cleanup();
    await source.destroy();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
