"""Lazy memory dependencies. Importing this module performs no I/O or downloads."""
import math
import os
import threading
import uuid
from pathlib import Path


class MemoryRuntime:
    def __init__(self):
        self.client = None
        self.embedder = None
        self.models = None
        self.lock = threading.Lock()

    def _dependencies(self):
        with self.lock:
            if self.client is not None and self.embedder is not None:
                return
            model_path = os.getenv('CORTEX_EMBEDDING_MODEL_PATH', '')
            qdrant_url = os.getenv('QDRANT_URL', '')
            if not model_path or not Path(model_path).is_absolute() or not Path(model_path).is_dir():
                raise RuntimeError('An explicitly provisioned local embedding model is required')
            if not qdrant_url:
                raise RuntimeError('Qdrant configuration is required')
            from sentence_transformers import SentenceTransformer
            from qdrant_client import QdrantClient, models
            embedder = SentenceTransformer(model_path, local_files_only=True, trust_remote_code=False)
            client = QdrantClient(url=qdrant_url, api_key=os.getenv('QDRANT_API_KEY') or None, timeout=5)
            dimension = embedder.get_sentence_embedding_dimension()
            if not isinstance(dimension, int) or dimension <= 0:
                raise RuntimeError('Invalid embedding dimension')
            if not client.collection_exists('memory'):
                client.create_collection('memory', vectors_config=models.VectorParams(size=dimension, distance=models.Distance.COSINE))
            config = client.get_collection('memory').config.params.vectors
            if not isinstance(config, models.VectorParams) or config.size != dimension or config.distance != models.Distance.COSINE:
                raise RuntimeError('Existing memory vector schema does not match the configured model')
            self.embedder, self.client, self.models = embedder, client, models

    def _vector(self, text):
        self._dependencies()
        vector = self.embedder.encode(text).tolist()
        if len(vector) != self.embedder.get_sentence_embedding_dimension() or not all(math.isfinite(value) for value in vector):
            raise RuntimeError('Invalid embedding vector')
        return vector

    def ingest(self, signal):
        import json
        text = f'{signal.type} from {signal.source}: {json.dumps(signal.data, ensure_ascii=False)}'
        vector = self._vector(text)
        event_id = getattr(signal, 'eventId', None)
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f'affexai-cortex:memory:v1:{signal.tenantId}:{event_id}')) if event_id is not None else str(uuid.uuid4())
        result = self.client.upsert(collection_name='memory', wait=True, points=[self.models.PointStruct(
            id=point_id, vector=vector, payload={**signal.model_dump(mode='json'), 'content': text},
        )])
        if result.status != self.models.UpdateStatus.COMPLETED:
            raise RuntimeError('Memory write was not acknowledged')
        return point_id

    def retrieve(self, request):
        vector = self._vector(request.query)
        results = self.client.query_points(collection_name='memory', query=vector, limit=request.limit,
            query_filter=self.models.Filter(must=[self.models.FieldCondition(key='tenantId',
                match=self.models.MatchValue(value=request.tenantId))]), with_payload=True).points
        # Verify returned payload scope too: never expose foreign data if storage is misconfigured.
        if any((hit.payload or {}).get('tenantId') != request.tenantId for hit in results):
            raise RuntimeError('Memory isolation check failed')
        return [{'content': (hit.payload or {}).get('content', ''), 'score': hit.score,
                 'type': (hit.payload or {}).get('type', 'unknown'),
                 'metadata': {'successScore': self._reward(hit.payload or {})}} for hit in results]

    @staticmethod
    def _reward(payload):
        data = payload.get('data')
        if not isinstance(data, dict):
            return 0
        value = data.get('successScore', data.get('score', 0))
        return value if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) else 0
