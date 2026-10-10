import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';

type CortexPath = '/retrieve' | '/signals/ingest' | '/signals/deliver';
interface ScopedPayload { tenantId: string; [key: string]: unknown }

export function signCortexRequest(secret: string, path: CortexPath, payload: ScopedPayload,
  timestamp = Math.floor(Date.now() / 1000), nonce: string = randomUUID()) {
  if (!secret || Buffer.byteLength(secret) < 32) throw new ServiceUnavailableException('Cortex service authorization is not configured');
  if (typeof payload.tenantId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(payload.tenantId)) throw new BadRequestException('Invalid tenant identifier');
  const body = JSON.stringify(payload);
  if (Buffer.byteLength(body) > 65536) throw new BadRequestException('Cortex payload is too large');
  const canonical = ['v1', 'POST', path, payload.tenantId, String(timestamp), nonce,
    createHash('sha256').update(body).digest('hex')].join('\n');
  return { body, headers: {
    'content-type': 'application/json',
    'x-cortex-tenant': payload.tenantId,
    'x-cortex-timestamp': String(timestamp),
    'x-cortex-nonce': nonce,
    'x-cortex-signature': createHmac('sha256', secret).update(canonical).digest('hex'),
  } };
}

export async function postToCortex<T>(http: HttpService, config: ConfigService, path: CortexPath, payload: ScopedPayload): Promise<T> {
  const signed = signCortexRequest(config.get<string>('cortex.serviceSecret', ''), path, payload);
  try {
    const base = new URL(config.get<string>('cortex.url', 'http://localhost:8000'));
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password ||
      base.pathname !== '/' || base.search || base.hash) throw new Error('Invalid Cortex origin');
    const response = await firstValueFrom(http.post<T>(`${base.origin}${path}`, signed.body, {
      headers: signed.headers, timeout: 5000, maxRedirects: 0,
      transformRequest: [(body: string) => body],
    }));
    return response.data;
  } catch {
    throw new ServiceUnavailableException('Cortex memory is unavailable');
  }
}
