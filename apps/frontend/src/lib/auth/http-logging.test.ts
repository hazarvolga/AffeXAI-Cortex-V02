import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AxiosError } from 'axios';
import { HttpClient } from '../api/http-client';

test('HTTP diagnostic logs exclude auth credentials, response tokens and URL tokens', async () => {
  const logs: unknown[][] = [];
  const oldLog = console.log, oldError = console.error;
  console.log = (...args) => { logs.push(args); };
  console.error = (...args) => { logs.push(args); };
  try {
    const client = new HttpClient({ enableLogging: true });
    const secret = 'sensitive-test-sentinel';
    await client.post('/auth/register', { password: secret }, {
      adapter: async config => ({ config, data: { access_token: secret }, status: 200, statusText: 'OK', headers: {} }),
    });
    await assert.rejects(client.getWrapped(`/auth/verify-email/${secret}?token=${secret}`, {
      adapter: async config => { throw new AxiosError(secret, 'ERR_BAD_REQUEST', config, undefined, {
        config, data: { message: secret, refresh_token: secret }, status: 400, statusText: 'Bad Request', headers: {},
      }); },
    }));
    await client.get(`/survey/${secret}`, {
      adapter: async config => ({ config, data: {}, status: 200, statusText: 'OK', headers: {} }),
    });
    assert.ok(!JSON.stringify(logs).includes(secret));
    assert.ok(logs.some(args => String(args[0]).includes('400')));
  } finally { console.log = oldLog; console.error = oldError; }
});
