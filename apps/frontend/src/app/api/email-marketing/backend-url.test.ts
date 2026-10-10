import test from 'node:test';
import assert from 'node:assert/strict';
import { emailMarketingBackendApiUrl } from './backend-url';

test('normalizes the internal backend URL to one API prefix', () => {
  assert.equal(emailMarketingBackendApiUrl('http://backend:9006'), 'http://backend:9006/api');
  assert.equal(emailMarketingBackendApiUrl('http://backend:9006/api/'), 'http://backend:9006/api');
});
