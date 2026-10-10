"""Explicit manual smoke CLI; importing/pytest collection never sends requests."""
import hashlib
import hmac
import json
import os
import time
import uuid
from datetime import datetime, timezone
from urllib.request import Request, urlopen


def main():
    origin = os.environ['CORTEX_SMOKE_URL'].rstrip('/')
    tenant = os.environ['CORTEX_SMOKE_TENANT']
    secret = os.environ['CORTEX_SERVICE_SECRET']
    body = json.dumps({'tenantId': tenant, 'source': 'manual-smoke', 'type': 'test',
                      'data': {'content': 'Explicit memory persistence smoke'},
                      'timestamp': datetime.now(timezone.utc).isoformat()}, separators=(',', ':')).encode()
    timestamp, nonce = str(int(time.time())), str(uuid.uuid4())
    canonical = '\n'.join(['v1', 'POST', '/signals/ingest', tenant, timestamp, nonce, hashlib.sha256(body).hexdigest()])
    request = Request(origin + '/signals/ingest', data=body, headers={
        'Content-Type': 'application/json', 'x-cortex-tenant': tenant,
        'x-cortex-timestamp': timestamp, 'x-cortex-nonce': nonce,
        'x-cortex-signature': hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()})
    with urlopen(request, timeout=10) as response:
        result = json.load(response)
    if result.get('status') != 'ingested' or not result.get('id'):
        raise RuntimeError('Persistence not confirmed')
    print('Memory persistence acknowledged')


if __name__ == '__main__':
    main()
