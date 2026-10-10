import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBackendRewriteBase } from '../../next.config';

test('normalizes backend rewrite bases with or without the API prefix', () => {
  assert.equal(
    normalizeBackendRewriteBase('http://backend:9006'),
    'http://backend:9006',
  );
  assert.equal(
    normalizeBackendRewriteBase('http://backend:9006/api/'),
    'http://backend:9006',
  );
});
