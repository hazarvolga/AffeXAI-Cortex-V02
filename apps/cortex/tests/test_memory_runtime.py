from types import SimpleNamespace
from unittest.mock import Mock
import importlib
import sys

import pytest
from qdrant_client import models
from main import Signal, RetrievalRequest
from memory_runtime import MemoryRuntime


def runtime():
    value = MemoryRuntime()
    value.models = models
    value.embedder = Mock()
    value.embedder.get_sentence_embedding_dimension.return_value = 2
    value.embedder.encode.return_value.tolist.return_value = [0.5, 0.5]
    value.client = Mock()
    return value


def signal():
    return Signal(tenantId='tenant-a', source='test', type='created', data={'text': 'hello'}, timestamp='2026-10-07T12:00:00Z')


def test_acknowledged_write_contains_tenant_and_waits():
    value = runtime()
    value.client.upsert.return_value.status = models.UpdateStatus.COMPLETED
    point_id = value.ingest(signal())
    kwargs = value.client.upsert.call_args.kwargs
    assert kwargs['wait'] is True
    assert kwargs['points'][0].id == point_id
    assert kwargs['points'][0].payload['tenantId'] == 'tenant-a'


def test_readiness_initializes_and_verifies_memory_collection():
    value = runtime()
    value.client.collection_exists.return_value = True
    assert value.ready() is True
    value.client.collection_exists.assert_called_once_with('memory')


@pytest.mark.parametrize('status', [models.UpdateStatus.ACKNOWLEDGED, None])
def test_unfinished_write_never_reports_persistence(status):
    value = runtime()
    value.client.upsert.return_value.status = status
    with pytest.raises(RuntimeError):
        value.ingest(signal())


def test_write_failure_propagates():
    value = runtime()
    value.client.upsert.side_effect = RuntimeError('offline')
    with pytest.raises(RuntimeError):
        value.ingest(signal())


@pytest.mark.parametrize('tenant', ['tenant-a', 'tenant-b', None])
def test_retrieval_filters_and_rechecks_tenant(tenant):
    value = runtime()
    value.client.query_points.return_value.points = [SimpleNamespace(payload={'tenantId': tenant, 'content': 'hello'}, score=.8)]
    request = RetrievalRequest(tenantId='tenant-a', query='hello', limit=2)
    if tenant == 'tenant-a':
        assert value.retrieve(request)[0]['content'] == 'hello'
    else:
        with pytest.raises(RuntimeError):
            value.retrieve(request)
    kwargs = value.client.query_points.call_args.kwargs
    assert kwargs['query_filter'].must[0].match.value == 'tenant-a'
    assert kwargs['limit'] == 2


@pytest.mark.parametrize('vector', [[float('nan'), 0], [float('inf'), 0], [1]])
def test_invalid_embedding_never_writes(vector):
    value = runtime()
    value.embedder.encode.return_value.tolist.return_value = vector
    with pytest.raises(RuntimeError):
        value.ingest(signal())
    value.client.upsert.assert_not_called()


def test_import_and_missing_model_do_not_load_model_or_connect(monkeypatch):
    monkeypatch.delenv('CORTEX_EMBEDDING_MODEL_PATH', raising=False)
    monkeypatch.delenv('QDRANT_URL', raising=False)
    sys.modules.pop('sentence_transformers', None)
    import main
    importlib.reload(main)
    assert 'sentence_transformers' not in sys.modules
    with pytest.raises(RuntimeError):
        MemoryRuntime().ingest(signal())
    assert 'sentence_transformers' not in sys.modules

@pytest.mark.parametrize('existing,size,distance,dimension,expected', [
    (False, 2, models.Distance.COSINE, 2, True),
    (True, 2, models.Distance.COSINE, 2, True),
    (True, 3, models.Distance.COSINE, 2, False),
    (True, 2, models.Distance.DOT, 2, False),
    (True, 2, models.Distance.COSINE, 0, False),
])
def test_lazy_initialization_validates_existing_schema_without_deleting(monkeypatch, tmp_path, existing, size, distance, dimension, expected):
    monkeypatch.setenv('CORTEX_EMBEDDING_MODEL_PATH', str(tmp_path))
    monkeypatch.setenv('QDRANT_URL', 'http://isolated-test:6333')
    embedder = Mock()
    embedder.get_sentence_embedding_dimension.return_value = dimension
    factory = Mock(return_value=embedder)
    monkeypatch.setitem(sys.modules, 'sentence_transformers', SimpleNamespace(SentenceTransformer=factory))
    client = Mock()
    client.collection_exists.return_value = existing
    client.get_collection.return_value.config.params.vectors = models.VectorParams(size=size, distance=distance)
    import qdrant_client
    monkeypatch.setattr(qdrant_client, 'QdrantClient', Mock(return_value=client))
    value = MemoryRuntime()
    if expected:
        value._dependencies()
        assert value.client is client
    else:
        with pytest.raises(RuntimeError):
            value._dependencies()
        assert value.client is None
    factory.assert_called_once_with(str(tmp_path), local_files_only=True, trust_remote_code=False)
    client.delete_collection.assert_not_called()
    assert client.create_collection.call_count == int(not existing and dimension > 0)


def test_retrieval_preserves_only_numeric_reward_metadata():
    value = runtime()
    value.client.query_points.return_value.points = [SimpleNamespace(payload={'tenantId': 'tenant-a', 'content': 'hello', 'data': {'successScore': 7, 'private': 'not-returned'}}, score=.8)]
    result = value.retrieve(RetrievalRequest(tenantId='tenant-a', query='hello'))
    assert result[0]['metadata'] == {'successScore': 7}
    assert 'private' not in str(result)

@pytest.mark.parametrize('data,expected', [(None, 0), ({'score': -1}, -1), ({'successScore': True}, 0), ({'successScore': float('nan')}, 0), ({'successScore': '7'}, 0)])
def test_reward_contract_rejects_non_numeric_or_non_finite_values(data, expected):
    assert MemoryRuntime._reward({'data': data}) == expected
