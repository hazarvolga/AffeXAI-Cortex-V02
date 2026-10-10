import test from 'node:test';
import assert from 'node:assert/strict';
import { validMutationOrigin, validTaxonomyBody } from './taxonomy-proxy';

test('accepts same-host mutations behind a local proxy and rejects cross-site requests', () => {
  assert.equal(validMutationOrigin(new Request('http://localhost/internal', { headers: { host: '127.0.0.1:9003', origin: 'http://127.0.0.1:9003', 'sec-fetch-site': 'same-origin' } })), true);
  assert.equal(validMutationOrigin(new Request('http://localhost/internal', { headers: { host: '127.0.0.1:9003', origin: 'https://attacker.example', 'sec-fetch-site': 'cross-site' } })), false);
});

test('accepts only bounded category mapping fields', () => {
  assert.equal(validTaxonomyBody({ name: 'Guides', ticketCategoryId: null }, true), true);
  assert.equal(validTaxonomyBody({ ticketCategoryId: '54000000-0000-4000-8000-000000000001' }, false), true);
  assert.equal(validTaxonomyBody({ tenantId: 'forged' }, false), false);
  assert.equal(validTaxonomyBody({ name: ' ' }, true), false);
});
