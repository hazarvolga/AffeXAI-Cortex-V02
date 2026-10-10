import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requireTenantSlug, tenantFromPath, tenantHeaders } from './tenant-selection';

test('explicit tenant selection validates backend-compatible slug without defaults', () => {
  assert.equal(requireTenantSlug('xyz_company-1'), 'xyz_company-1');
  for (const value of ['', undefined, 'a b', '../other', 'a'.repeat(129)]) {
    assert.throws(() => requireTenantSlug(value));
  }
  assert.deepEqual(tenantHeaders('xyz-company'), { 'x-tenant-id': 'xyz-company' });
});
test('only supported tenant-prefixed paths supply a selector, never reserved routes', () => {
  assert.equal(tenantFromPath('/xyz-company/login'), 'xyz-company');
  assert.equal(tenantFromPath('/a/admin/support'), 'a');
  for (const path of ['/login', '/signup', '/admin/login', '/portal/login', '/verify-email/token', '/cms-demo/login', '/privacy/login', '/pricing/admin', '/help/article', '/api/auth/login']) {
    assert.equal(tenantFromPath(path), undefined, path);
  }
});
