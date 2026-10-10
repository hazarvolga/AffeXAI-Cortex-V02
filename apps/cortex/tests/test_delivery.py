import uuid
from types import SimpleNamespace
import pytest
from fastapi.testclient import TestClient
from qdrant_client import models
from main import create_app, DurableSignal
from test_boundary import signed, SECRET, NOW, signal
from test_memory_runtime import runtime

EVENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
def payload(tenant='tenant-a'):
    return signal(tenant) | {'eventId': EVENT}

def test_retry_after_write_response_loss_updates_same_point():
    memory = runtime()
    points = {}
    attempts = []
    def upsert(**kwargs):
        point = kwargs['points'][0]
        points[point.id] = point
        attempts.append(point.id)
        if len(attempts) == 1:
            raise RuntimeError('response lost after persisted write')
        return SimpleNamespace(status=models.UpdateStatus.COMPLETED)
    memory.client.upsert.side_effect = upsert
    with TestClient(create_app(secret=SECRET, runtime=memory, clock=lambda: NOW)) as client:
        raw, headers = signed('/signals/deliver', payload())
        assert client.post('/signals/deliver', content=raw, headers=headers).status_code == 503
        raw, headers = signed('/signals/deliver', payload())
        response = client.post('/signals/deliver', content=raw, headers=headers)
        assert response.status_code == 200
        expected = str(uuid.uuid5(uuid.NAMESPACE_URL, f'affexai-cortex:memory:v1:tenant-a:{EVENT}'))
        assert expected == 'a838fcb8-797a-5369-822b-af4aaf8e77fe'
        assert response.json() == {'status': 'ingested', 'tenantId': 'tenant-a', 'eventId': EVENT, 'pointId': expected}
        assert attempts == [expected, expected]
        assert len(points) == 1
        assert points[expected].payload['eventId'] == EVENT

def test_same_event_different_tenant_has_distinct_point():
    memory = runtime()
    memory.client.upsert.return_value.status = models.UpdateStatus.COMPLETED
    a = memory.ingest(DurableSignal(**payload('tenant-a')))
    b = memory.ingest(DurableSignal(**payload('tenant-b')))
    assert a != b

@pytest.mark.parametrize('event', [None, 'bad-uuid'])
def test_delivery_requires_valid_event_identity(event):
    memory = runtime()
    body = payload()
    if event is None: body.pop('eventId')
    else: body['eventId'] = event
    with TestClient(create_app(secret=SECRET, runtime=memory, clock=lambda: NOW)) as client:
        raw, headers = signed('/signals/deliver', body)
        assert client.post('/signals/deliver', content=raw, headers=headers).status_code == 422
    memory.client.upsert.assert_not_called()

def test_delivery_requires_matching_signed_tenant():
    memory = runtime()
    with TestClient(create_app(secret=SECRET, runtime=memory, clock=lambda: NOW)) as client:
        raw, headers = signed('/signals/deliver', payload('tenant-b'))
        assert client.post('/signals/deliver', content=raw, headers=headers).status_code == 403
    memory.client.upsert.assert_not_called()


def test_durable_delivery_rejects_unsigned_and_replayed_requests():
    memory = runtime()
    memory.client.upsert.return_value.status = models.UpdateStatus.COMPLETED
    with TestClient(create_app(secret=SECRET, runtime=memory, clock=lambda: NOW)) as client:
        assert client.post('/signals/deliver', json=payload()).status_code == 401
        raw, headers = signed('/signals/deliver', payload())
        assert client.post('/signals/deliver', content=raw, headers=headers).status_code == 200
        assert client.post('/signals/deliver', content=raw, headers=headers).status_code == 401
    assert memory.client.upsert.call_count == 1


def test_pending_storage_write_never_acknowledges_durable_delivery():
    memory = runtime()
    memory.client.upsert.return_value.status = models.UpdateStatus.ACKNOWLEDGED
    with TestClient(create_app(secret=SECRET, runtime=memory, clock=lambda: NOW)) as client:
        raw, headers = signed('/signals/deliver', payload())
        assert client.post('/signals/deliver', content=raw, headers=headers).status_code == 503
