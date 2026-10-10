import assert from 'node:assert/strict';
import test from 'node:test';
import { filterForms, resolveSafeFormRedirect } from './forms.logic';
import type { FormRecord } from '@/services/forms.service';

const form = (overrides: Partial<FormRecord>): FormRecord => ({
  id: 'form-1',
  tenantId: 'acme',
  name: 'Contact',
  description: 'Sales enquiries',
  structure: { rows: [], settings: {} },
  status: 'draft',
  submissionCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

test('filterForms combines case-insensitive text search and status', () => {
  const forms = [
    form({ id: '1', name: 'Contact', status: 'published' }),
    form({ id: '2', name: 'NPS', description: 'Customer Feedback', status: 'draft' }),
  ];

  assert.deepEqual(filterForms(forms, 'feedback', 'draft').map(({ id }) => id), ['2']);
  assert.deepEqual(filterForms(forms, 'CONTACT', 'published').map(({ id }) => id), ['1']);
  assert.deepEqual(filterForms(forms, '', 'all').map(({ id }) => id), ['1', '2']);
});

test('resolveSafeFormRedirect accepts published HTTP paths and rejects executable URLs', () => {
  assert.equal(resolveSafeFormRedirect('/thanks'), '/thanks');
  assert.equal(resolveSafeFormRedirect('https://example.test/thanks'), 'https://example.test/thanks');
  assert.equal(resolveSafeFormRedirect('//evil.test/redirect'), null);
  assert.equal(resolveSafeFormRedirect('javascript:alert(1)'), null);
  assert.equal(resolveSafeFormRedirect('data:text/html,unsafe'), null);
});
