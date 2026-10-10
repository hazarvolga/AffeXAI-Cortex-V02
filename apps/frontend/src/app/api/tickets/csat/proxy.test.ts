import test from 'node:test';
import assert from 'node:assert/strict';
import { forwardCSAT, csatBackendUrl } from './proxy';
const token = 'a'.repeat(64);
test('CSAT backend origin has exactly one API prefix and sane local default', () => {
  assert.equal(csatBackendUrl('http://127.0.0.1:9006'), 'http://127.0.0.1:9006/api');
  assert.equal(csatBackendUrl('http://127.0.0.1:9006/api/'), 'http://127.0.0.1:9006/api');
});
test('CSAT proxy unwraps envelope once and never injects actor metadata into public DTO', async () => {
  const original = global.fetch;
  try {
    global.fetch = async (url, init) => {
      assert.ok(String(url).endsWith(`/api/tickets/csat/survey/${token}/submit`));
      assert.deepEqual(JSON.parse(String(init?.body)), { rating: 5, feedback: null });
      assert.equal(init?.cache, 'no-store');
      return Response.json({ success: true, data: { surveyCompletedAt: 'date' } });
    };
    const result = await forwardCSAT(token, 'POST', { rating: 5, feedback: null });
    assert.deepEqual(await result.json(), { surveyCompletedAt: 'date' });
  } finally { global.fetch = original; }
});
test('CSAT proxy rejects forged actor and malformed bearer without any network', async () => {
  const original = global.fetch;
  try {
    global.fetch = async () => { throw new Error('unexpected network'); };
    assert.equal((await forwardCSAT('bad', 'GET')).status, 404);
    assert.equal((await forwardCSAT(token, 'POST', { rating: 5, customerId: 'foreign' })).status, 400);
  } finally { global.fetch = original; }
});
