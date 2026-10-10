import os
from uuid import UUID
import time
from typing import Any, Dict, Annotated

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from memory_runtime import MemoryRuntime
from service_auth import ServiceAuthenticator, ServiceAuthError

TenantId = Annotated[str, Field(pattern=r'^[A-Za-z0-9_-]{1,128}$')]


class ScopedRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    tenantId: TenantId


class Signal(ScopedRequest):
    source: str = Field(min_length=1, max_length=128)
    type: str = Field(min_length=1, max_length=128)
    data: Dict[str, Any]
    timestamp: AwareDatetime


class DurableSignal(Signal):
    eventId: UUID


class RetrievalRequest(ScopedRequest):
    query: str = Field(min_length=1, max_length=8192)
    limit: int = Field(default=3, ge=1, le=100, strict=True)


class StrategyRequest(ScopedRequest):
    context: str = Field(min_length=1, max_length=8192)
    draftContent: str = Field(default='', max_length=32768)


class BodyLimitMiddleware:
    def __init__(self, app, limit=65536):
        self.app, self.limit = app, limit

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        body = bytearray()
        while True:
            message = await receive()
            if message['type'] == 'http.disconnect':
                return
            chunk = message.get('body', b'')
            if len(body) + len(chunk) > self.limit:
                return await JSONResponse({'detail': 'request-too-large'}, status_code=413)(scope, receive, send)
            body.extend(chunk)
            if not message.get('more_body', False):
                break
        delivered = False

        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {'type': 'http.request', 'body': bytes(body), 'more_body': False}
            return await receive()
        await self.app(scope, replay, send)


def create_app(secret=None, runtime=None, clock=time.time, nonce_limit=10000):
    app = FastAPI(title='AffeXAI Cortex Memory API', version='1.1.0')
    app.add_middleware(BodyLimitMiddleware)
    memory = runtime if runtime is not None else MemoryRuntime()
    auth = ServiceAuthenticator(secret if secret is not None else os.getenv('CORTEX_SERVICE_SECRET'), clock, nonce_limit)

    async def authorize(request: Request):
        try:
            return auth.verify(request.method, request.url.path, request.headers, await request.body())
        except ServiceAuthError as error:
            raise HTTPException(status_code=error.status, detail=error.detail) from None

    def scope_matches(payload, tenant):
        if payload.tenantId != tenant:
            raise HTTPException(status_code=403, detail='tenant-scope-mismatch')

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request, _error):
        # FastAPI's default echoes input values; keep credentials and content out.
        return JSONResponse({'detail': 'invalid-request'}, status_code=422)

    @app.get('/health')
    def health():
        return {'status': 'alive', 'service': 'affexai-cortex-memory'}

    @app.post('/signals/ingest')
    def ingest(signal: Signal, tenant: str = Depends(authorize)):
        scope_matches(signal, tenant)
        try:
            return {'status': 'ingested', 'id': memory.ingest(signal)}
        except Exception:
            raise HTTPException(status_code=503, detail='memory-unavailable') from None

    @app.post('/signals/deliver')
    def deliver(signal: DurableSignal, tenant: str = Depends(authorize)):
        scope_matches(signal, tenant)
        try:
            point_id = memory.ingest(signal)
            return {'status': 'ingested', 'tenantId': signal.tenantId,
                    'eventId': str(signal.eventId), 'pointId': point_id}
        except Exception:
            raise HTTPException(status_code=503, detail='memory-unavailable') from None

    @app.post('/retrieve')
    def retrieve(payload: RetrievalRequest, tenant: str = Depends(authorize)):
        scope_matches(payload, tenant)
        try:
            return {'results': memory.retrieve(payload)}
        except Exception:
            raise HTTPException(status_code=503, detail='memory-unavailable') from None

    @app.post('/strategy/insight')
    def deprecated_insight(payload: StrategyRequest, tenant: str = Depends(authorize)):
        scope_matches(payload, tenant)
        raise HTTPException(status_code=410, detail='use-tenant-strategy-api')

    return app


app = create_app()
