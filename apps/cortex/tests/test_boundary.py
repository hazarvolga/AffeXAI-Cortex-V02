import hashlib
import hmac
import json
import uuid

import pytest
from fastapi.testclient import TestClient
from main import create_app

SECRET = 'isolated-cortex-service-secret-at-least-32-chars'
NOW = 1800000000


def signed(path, body, tenant='tenant-a', timestamp=NOW, nonce=None, secret=SECRET):
    raw = json.dumps(body, separators=(',', ':')).encode()
    nonce = nonce or str(uuid.uuid4())
    content = '\n'.join(['v1', 'POST', path, tenant, str(timestamp), nonce, hashlib.sha256(raw).hexdigest()])
    signature = hmac.new(secret.encode(), content.encode(), hashlib.sha256).hexdigest()
    return raw, {'content-type': 'application/json', 'x-cortex-tenant': tenant,
                 'x-cortex-timestamp': str(timestamp), 'x-cortex-nonce': nonce, 'x-cortex-signature': signature}


class Runtime:
    def __init__(self):
        self.writes = []
        self.reads = []
        self.failed = False

    def ingest(self, signal):
        if self.failed:
            raise RuntimeError('private-storage-url-and-key')
        self.writes.append(signal)
        return 'saved-id'

    def retrieve(self, request):
        if self.failed:
            raise RuntimeError('private-storage-url-and-key')
        self.reads.append(request)
        return [{'content': 'tenant memory', 'score': .9, 'type': 'test'}]


@pytest.fixture
def boundary():
    runtime = Runtime()
    with TestClient(create_app(secret=SECRET, runtime=runtime, clock=lambda: NOW)) as client:
        yield client, runtime


def query(tenant='tenant-a'):
    return {'tenantId': tenant, 'query': 'customer context', 'limit': 3}


def signal(tenant='tenant-a'):
    return {'tenantId': tenant, 'source': 'test', 'type': 'created', 'data': {'content': 'hello'},
            'timestamp': '2026-10-07T12:00:00Z'}


def test_requires_service_signature(boundary):
    client, runtime = boundary
    assert client.post('/retrieve', json=query()).status_code == 401
    assert runtime.reads == []


@pytest.mark.parametrize('change', ['signature', 'body', 'tenant', 'path', 'expired', 'future'])
def test_rejects_tampering_and_stale_requests(boundary, change):
    client, runtime = boundary
    raw, headers = signed('/retrieve', query(), timestamp=NOW - 61 if change == 'expired' else NOW + 6 if change == 'future' else NOW)
    path = '/retrieve'
    if change == 'signature': headers['x-cortex-signature'] = '0' * 64
    if change == 'body': raw = raw.replace(b'customer', b'changed')
    if change == 'tenant': headers['x-cortex-tenant'] = 'tenant-b'
    if change == 'path': path = '/signals/ingest'
    assert client.post(path, content=raw, headers=headers).status_code == 401
    assert runtime.reads == runtime.writes == []


def test_body_tenant_must_match_signed_tenant(boundary):
    client, runtime = boundary
    raw, headers = signed('/retrieve', query('tenant-b'))
    assert client.post('/retrieve', content=raw, headers=headers).status_code == 403
    assert runtime.reads == []


def test_signature_is_single_use(boundary):
    client, runtime = boundary
    raw, headers = signed('/retrieve', query())
    assert client.post('/retrieve', content=raw, headers=headers).status_code == 200
    assert client.post('/retrieve', content=raw, headers=headers).status_code == 401
    assert len(runtime.reads) == 1


def test_replay_cache_full_fails_closed():
    runtime = Runtime()
    with TestClient(create_app(secret=SECRET, runtime=runtime, clock=lambda: NOW, nonce_limit=1)) as client:
        raw, headers = signed('/retrieve', query())
        assert client.post('/retrieve', content=raw, headers=headers).status_code == 200
        raw2, headers2 = signed('/retrieve', query())
        assert client.post('/retrieve', content=raw2, headers=headers2).status_code == 503
        assert client.post('/retrieve', content=raw, headers=headers).status_code == 401
        assert len(runtime.reads) == 1


@pytest.mark.parametrize('path,body', [('/retrieve', query()), ('/signals/ingest', signal())])
def test_storage_failure_is_not_a_success(boundary, path, body):
    client, runtime = boundary
    runtime.failed = True
    raw, headers = signed(path, body)
    response = client.post(path, content=raw, headers=headers)
    assert response.status_code == 503
    assert 'private-storage' not in response.text
    assert 'results' not in response.json()
    assert response.json().get('status') != 'ingested'


@pytest.mark.parametrize('body', [query() | {'limit': 0}, query() | {'limit': 101}, query() | {'query': ''},
                                 query() | {'query': 'x' * 8193}, query() | {'unknown': True}])
def test_bounded_schema(boundary, body):
    client, runtime = boundary
    raw, headers = signed('/retrieve', body)
    assert client.post('/retrieve', content=raw, headers=headers).status_code == 422
    assert runtime.reads == []


def test_body_limit_applies_before_storage(boundary):
    client, runtime = boundary
    raw, headers = signed('/signals/ingest', signal() | {'data': {'content': 'x' * 70000}})
    assert client.post('/signals/ingest', content=raw, headers=headers).status_code == 413
    assert runtime.writes == []


def test_success_and_deprecated_strategy_contract(boundary):
    client, runtime = boundary
    raw, headers = signed('/signals/ingest', signal())
    assert client.post('/signals/ingest', content=raw, headers=headers).json() == {'status': 'ingested', 'id': 'saved-id'}
    raw, headers = signed('/strategy/insight', {'tenantId': 'tenant-a', 'context': 'email'})
    response = client.post('/strategy/insight', content=raw, headers=headers)
    assert response.status_code == 410
    assert response.json()['detail'] == 'use-tenant-strategy-api'


def test_health_does_not_claim_model_or_storage_readiness(boundary):
    client, runtime = boundary
    assert client.get('/health').json() == {'status': 'alive', 'service': 'affexai-cortex-memory'}
    assert runtime.reads == runtime.writes == []


def test_non_ascii_signature_rejected_without_internal_error():
    from service_auth import ServiceAuthenticator, ServiceAuthError
    raw, headers = signed('/retrieve', query())
    headers['x-cortex-signature'] = 'é' * 64
    with pytest.raises(ServiceAuthError):
        ServiceAuthenticator(SECRET, clock=lambda: NOW).verify('POST', '/retrieve', headers, raw)

def test_naive_signal_time_rejected(boundary):
    client, runtime = boundary
    raw, headers = signed('/signals/ingest', signal() | {'timestamp': '2026-10-07T12:00:00'})
    assert client.post('/signals/ingest', content=raw, headers=headers).status_code == 422
    assert runtime.writes == []


def test_node_python_shared_signature_fixture():
    from service_auth import ServiceAuthenticator
    raw = b'{"tenantId":"tenant-a","query":"context","limit":3}'
    headers = {'x-cortex-tenant': 'tenant-a', 'x-cortex-timestamp': '1800000000',
               'x-cortex-nonce': 'fixed-test-nonce-1234', 'x-cortex-signature': '491c199a1ffbc8194ff2f2706628c5425163845eddee8039327ffe844452105b'}
    assert ServiceAuthenticator(SECRET, clock=lambda: NOW).verify('POST', '/retrieve', headers, raw) == 'tenant-a'
