# AffeXAI Cortex memory service

Python owns tenant-scoped vector memory. Strategy generation stays in Nest StrategyService and uses the selected tenant's configured AI provider. Python `/strategy/insight` now requires authentication and returns HTTP 410 with `use-tenant-strategy-api`; callers must use the existing authenticated Nest strategy API. No shared Ollama reasoning model is initialized.

## Configuration and startup

- `CORTEX_SERVICE_SECRET`: same server-only secret in Nest and Python; at least 32 UTF-8 bytes. Missing/weak configuration fails protected requests with 503. Never send this secret to browsers.
- `QDRANT_URL`, optional `QDRANT_API_KEY`: explicitly selected memory storage.
- `CORTEX_EMBEDDING_MODEL_PATH`: absolute path to an independently provisioned, trusted local SentenceTransformer model directory. Loading is local-only and remote code is disabled; requests do not download models. Provision and validate a fixed embedding model separately before use.
- Nest `CORTEX_URL`: configured Python service origin.

Importing the app opens no connections and loads no models. Dependencies initialize lazily on the first memory request. Missing model/configuration, incompatible vector dimensions, storage failures and incomplete writes return 503; no empty-success fallback. Existing collections are never deleted. Embedding model identity/migration beyond dimension compatibility still needs an explicit operational gate.

`GET /health` reports process liveness only, not model/storage readiness. Run one Uvicorn worker for the current process-local replay boundary. Multi-worker/multi-replica deployment requires a shared atomic nonce store; HMAC replay protection itself is not restart-durable; business-event retry identity is handled separately below.

## Service authentication

Every POST requires `x-cortex-tenant`, `x-cortex-timestamp` (Unix seconds), `x-cortex-nonce` (unique 16–128 ASCII identifier characters), and `x-cortex-signature` (lowercase hex HMAC-SHA256). Sign the UTF-8 string formed by joining these values with newline:

```
v1
POST
/request/path
TENANT
TIMESTAMP
NONCE
SHA256_HEX_OF_EXACT_RAW_BODY
```

The body tenant must match the signed tenant. Allowed clock window is 60 seconds past and 5 seconds future. Nonces are single-use inside this process; a full bounded cache rejects new requests with 503 instead of evicting live nonces. A retry must use a fresh nonce. The signature is authentication/integrity, not encryption; use a private authenticated network or TLS between hosts.

Request bodies are capped at 64 KiB, retrieval limits at 100, and query text at 8192 characters. Every storage query filters tenant and validates returned tenant payloads. Ingest succeeds only after Qdrant acknowledges completed persistence.

## Durable business-event delivery

Nest `deliverCortexSignal` sends signed `POST /signals/deliver` requests with the stable envelope `{eventId, tenantId, source, type, data, timestamp}`. Persist the complete envelope once in the producer transaction. `eventId` is a UUID and `timestamp` is timezone-aware. Each retry signs the same persisted envelope with a new transport nonce.

The Qdrant point ID is UUIDv5 with the standard URL namespace and UTF-8 name `affexai-cortex:memory:v1:<tenantId>:<canonical-lowercase-eventId>`. Retrying an event upserts the same tenant-scoped point, including when a previous write completed but its response was lost. A 200 acknowledgement contains `status: ingested`, `tenantId`, `eventId` and `pointId`; Nest validates every identity field. Only Qdrant `COMPLETED` with `wait=True` permits this acknowledgement. This is repeatable event delivery, not an exactly-once network guarantee. Producers must never reuse an event ID with changed business data.

Legacy `/signals/ingest` remains available for existing best-effort callers and uses a new random point ID per request; it must not be used by a durable retry worker. Existing embedding model identity limitations still apply to both paths.

## Local verification

Install runtime requirements in an isolated Python environment; test tooling additionally requires `pytest` and `httpx`. Run `python -m pytest tests -q` from this directory. Tests use fake storage/embeddings and no model/provider downloads. They do not establish real embedding or Qdrant acceptance.

`test_ingest.py` is an explicit manual persistence-writing CLI only. Set `CORTEX_SMOKE_URL`, `CORTEX_SMOKE_TENANT`, and `CORTEX_SERVICE_SECRET` for a disposable isolated target before invoking it. Pytest/import does not execute it.

The repository-root `scripts/test-cortex-qdrant.sh` runs a separate real Qdrant 1.16.1 acceptance harness. It builds a minimal Python runner (no SentenceTransformer), creates an internal Docker network without published ports and disposable tmpfs storage, and cleans its own containers/network on exit. It checks a completed real write followed by simulated response loss, retry to one point, separate tenant identity, persisted metadata, and tenant-filtered retrieval. This validates Qdrant storage integration with deterministic test vectors; it does not validate a production embedding model or storage survival across container restart. Image/package acquisition occurs during initial setup.
