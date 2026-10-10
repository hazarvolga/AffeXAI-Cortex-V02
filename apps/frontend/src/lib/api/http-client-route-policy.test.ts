import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresAuthenticatedRoute } from './http-client';

test('protects admin and portal routes with and without tenant prefix', () => {
  assert.equal(requiresAuthenticatedRoute('/admin/support'), true);
  assert.equal(requiresAuthenticatedRoute('/portal/dashboard'), true);
  assert.equal(requiresAuthenticatedRoute('/xyz-company/admin/support'), true);
  assert.equal(requiresAuthenticatedRoute('/xyz-company/portal/dashboard'), true);
});

test('keeps public help and authentication routes available after stale session cleanup', () => {
  assert.equal(requiresAuthenticatedRoute('/help'), false);
  assert.equal(requiresAuthenticatedRoute('/xyz-company/help'), false);
  assert.equal(requiresAuthenticatedRoute('/login'), false);
  assert.equal(requiresAuthenticatedRoute('/xyz-company/login'), false);
  assert.equal(requiresAuthenticatedRoute('/admin/login'), false);
});
