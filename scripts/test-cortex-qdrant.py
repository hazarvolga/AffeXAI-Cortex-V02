"""Disposable Qdrant acceptance only; deterministic test vectors, no ML model."""
import hashlib
import hmac
import json
import time
import uuid

from fastapi.testclient import TestClient
from qdrant_client import QdrantClient, models
from main import create_app
from memory_runtime import MemoryRuntime

SECRET = 'isolated-acceptance-secret-never-use-in-production'
EVENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'


class TestVector(list):
    def tolist(self):
        return list(self)


class TestEmbedder:
    def get_sentence_embedding_dimension(self):
        return 3

    def encode(self, _text):
        return TestVector([1.0, 0.0, 0.0])


class LoseFirstResponse:
    def __init__(self, client):
        self.client = client
        self.lost = False

    def upsert(self, **kwargs):
        result = self.client.upsert(**kwargs)
        if not self.lost:
            self.lost = True
            raise RuntimeError('simulated response loss after actual completed write')
        return result

    def query_points(self, **kwargs):
        return self.client.query_points(**kwargs)


def request(client, path, body):
    raw = json.dumps(body, separators=(',', ':')).encode()
    stamp, nonce = str(int(time.time())), str(uuid.uuid4())
    tenant = body['tenantId']
    canonical = '\n'.join(['v1', 'POST', path, tenant, stamp, nonce, hashlib.sha256(raw).hexdigest()])
    signature = hmac.new(SECRET.encode(), canonical.encode(), hashlib.sha256).hexdigest()
    return client.post(path, content=raw, headers={'content-type': 'application/json',
        'x-cortex-tenant': tenant, 'x-cortex-timestamp': stamp,
        'x-cortex-nonce': nonce, 'x-cortex-signature': signature})


def main():
    storage = QdrantClient(url='http://qdrant:6333', timeout=5)
    for attempt in range(30):
        try:
            storage.get_collections()
            break
        except Exception:
            if attempt == 29:
                raise
            time.sleep(0.2)
    assert not storage.collection_exists('memory'), 'Acceptance requires an empty disposable target'
    storage.create_collection('memory', vectors_config=models.VectorParams(size=3, distance=models.Distance.COSINE))
    memory = MemoryRuntime()
    memory.client, memory.models, memory.embedder = LoseFirstResponse(storage), models, TestEmbedder()
    body = {'eventId': EVENT, 'tenantId': 'tenant-a', 'source': 'tickets', 'type': 'ticket.resolved',
            'data': {'successScore': 5, 'context': 'isolated acceptance', 'ticketId': 'ticket-a', 'resolutionTime': 7},
            'timestamp': '2026-10-07T12:00:00.000Z'}
    with TestClient(create_app(secret=SECRET, runtime=memory)) as client:
        assert request(client, '/signals/deliver', body).status_code == 503
        assert storage.count('memory', exact=True).count == 1
        response = request(client, '/signals/deliver', body)
        assert response.status_code == 200, response.text
        ack = response.json()
        assert ack == {'status': 'ingested', 'tenantId': 'tenant-a', 'eventId': EVENT,
                       'pointId': 'a838fcb8-797a-5369-822b-af4aaf8e77fe'}
        assert storage.count('memory', exact=True).count == 1
        stored = storage.retrieve('memory', ids=[ack['pointId']], with_payload=True)[0]
        assert stored.payload['data'] == body['data']
        assert stored.payload['eventId'] == EVENT
        second = request(client, '/signals/deliver', {**body, 'tenantId': 'tenant-b', 'data': {'context': 'foreign', 'successScore': 1}})
        assert second.status_code == 200
        assert second.json()['pointId'] != ack['pointId']
        assert storage.count('memory', exact=True).count == 2
        results = request(client, '/retrieve', {'tenantId': 'tenant-a', 'query': 'context', 'limit': 10}).json()['results']
        assert len(results) == 1
        assert results[0]['metadata']['successScore'] == 5
        assert 'foreign' not in results[0]['content']
    storage.close()
    print('PASS: real Qdrant completed writes, lost-response retry one point, exact ACK, tenant isolation and stored metadata. Test embedder only; no model acceptance.')


if __name__ == '__main__':
    main()
