import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authService } from '../api/authService';
import { httpClient } from '../api/http-client';

test('login forwards only credentials in body and explicit workspace in header', async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.equal(new Headers(options?.headers).get('x-tenant-id'), 'xyz-company');
    assert.deepEqual(JSON.parse(String(options?.body)), { email: 'demo@xyz.example', password: 'not-a-real-password' });
    return Response.json({ error: 'expected-test-rejection' }, { status: 401 });
  };
  try {
    await assert.rejects(authService.login({ email: 'demo@xyz.example', password: 'not-a-real-password', tenantId: 'xyz-company' }), /expected-test-rejection/);
    await assert.rejects(authService.login({ email: 'demo@xyz.example', password: 'not-a-real-password' }), /çalışma alanı/);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = previous; }
});

test('registration and duplicate checks carry explicit tenant headers', async () => {
  const previous = httpClient.postWrapped;
  const seen: string[] = [];
  httpClient.postWrapped = async (url, _body, config) => {
    assert.equal(config?.headers?.['x-tenant-id'], 'xyz-company');
    seen.push(url);
    throw new Error('captured-test-request');
  };
  try {
    await assert.rejects(authService.checkEmailExists('demo@xyz.example', 'xyz-company'), /captured-test-request/);
    await assert.rejects(authService.register({ firstName: 'Demo', lastName: 'User', email: 'demo@xyz.example', password: 'not-a-real-password' }, 'xyz-company'), /captured-test-request/);
    await assert.rejects(authService.checkEmailExists('demo@xyz.example'), /çalışma alanı/);
    assert.deepEqual(seen, ['/auth/check-email', '/auth/register']);
  } finally { httpClient.postWrapped = previous; }
});

test('login BFF validates and forwards selector without trusting body tenant', async () => {
  const { POST } = await import('../../app/api/auth/login/route');
  const { NextRequest } = await import('next/server');
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.equal(new Headers(options?.headers).get('x-tenant-id'), 'xyz-company');
    assert.deepEqual(JSON.parse(String(options?.body)), { email: 'demo@xyz.example', password: 'not-a-real-password' });
    return Response.json({ message: 'expected-test-rejection' }, { status: 401 });
  };
  try {
    const missing = await POST(new NextRequest('http://localhost/api/auth/login', { method: 'POST', body: JSON.stringify({ tenantId: 'body-is-not-authority' }) }));
    assert.equal(missing.status, 400);
    assert.equal(calls, 0);
    const response = await POST(new NextRequest('http://localhost/api/auth/login', { method: 'POST', headers: { 'x-tenant-id': 'xyz-company' }, body: JSON.stringify({ email: 'demo@xyz.example', password: 'not-a-real-password', tenantId: 'ignored-body-tenant' }) }));
    assert.equal(response.status, 401);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = previous; }
});
