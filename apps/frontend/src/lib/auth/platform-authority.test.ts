import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasPlatformAuthority } from './platform-authority';
test('platform UI requires the server authority bit, never role-shaped data', () => {
  assert.equal(hasPlatformAuthority({ isPlatformAdmin: true }), true);
  for (const user of [null, {}, { roleId: 'super_admin' }, { roleNames: ['super_admin'] }, { primaryRole: { name: 'superadmin' } }, { roles: [{ name: 'super_admin' }] }, { isPlatformAdmin: 'true' }]) {
    assert.equal(hasPlatformAuthority(user), false);
  }
});
