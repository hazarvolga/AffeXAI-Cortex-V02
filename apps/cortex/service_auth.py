"""Versioned body-bound service signatures; replay protection is process-local."""
import hashlib
import hmac
import re
import threading
import time

TENANT = re.compile(r'^[A-Za-z0-9_-]{1,128}$')
NONCE = re.compile(r'^[A-Za-z0-9_-]{16,128}$')


class ServiceAuthError(Exception):
    def __init__(self, status=401, detail='invalid-service-authorization'):
        self.status = status
        self.detail = detail


class ServiceAuthenticator:
    def __init__(self, secret, clock=time.time, nonce_limit=10000):
        self.secret = secret
        self.clock = clock
        self.nonce_limit = nonce_limit
        self.nonces = {}
        self.lock = threading.Lock()

    def verify(self, method, path, headers, body):
        if not self.secret or len(self.secret.encode()) < 32:
            raise ServiceAuthError(503, 'service-authorization-unconfigured')
        tenant = headers.get('x-cortex-tenant', '')
        timestamp = headers.get('x-cortex-timestamp', '')
        nonce = headers.get('x-cortex-nonce', '')
        signature = headers.get('x-cortex-signature', '')
        if not re.fullmatch(r'[0-9a-f]{64}', signature) or not TENANT.fullmatch(tenant) or not NONCE.fullmatch(nonce) or not re.fullmatch(r'[0-9]{1,12}', timestamp):
            raise ServiceAuthError()
        now = self.clock()
        issued_at = int(timestamp)
        if issued_at < now - 60 or issued_at > now + 5:
            raise ServiceAuthError()
        signed = '\n'.join(['v1', method.upper(), path, tenant, timestamp, nonce, hashlib.sha256(body).hexdigest()])
        expected = hmac.new(self.secret.encode(), signed.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise ServiceAuthError()
        with self.lock:
            self.nonces = {key: expiry for key, expiry in self.nonces.items() if expiry >= now}
            if nonce in self.nonces:
                raise ServiceAuthError()
            # Never evict a still-live nonce to make room: that would enable replay.
            if len(self.nonces) >= self.nonce_limit:
                raise ServiceAuthError(503, 'service-authorization-capacity')
            self.nonces[nonce] = issued_at + 65
        return tenant
