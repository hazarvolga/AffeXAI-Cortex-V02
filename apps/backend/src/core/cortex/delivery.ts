import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { v5 as uuidv5, validate as validUuid } from "uuid";
import { postToCortex } from "./signed-request";

/** Persist this complete envelope once; retries must reuse its event identity, time and data. */
export interface CortexDeliverySignal {
  eventId: string;
  tenantId: string;
  source: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}
export interface CortexDeliveryAck {
  status: "ingested";
  tenantId: string;
  eventId: string;
  pointId: string;
}

export function cortexPointId(tenantId: string, eventId: string): string {
  if (
    typeof tenantId !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId) ||
    typeof eventId !== "string" ||
    !validUuid(eventId)
  )
    throw new BadRequestException("Invalid Cortex event identity");
  return uuidv5(
    `affexai-cortex:memory:v1:${tenantId}:${eventId.toLowerCase()}`,
    uuidv5.URL,
  );
}

function validateSignal(signal: CortexDeliverySignal): void {
  const fields = ["eventId", "tenantId", "source", "type", "data", "timestamp"];
  if (
    !signal ||
    typeof signal !== "object" ||
    Object.keys(signal).some((key) => !fields.includes(key))
  )
    throw new BadRequestException("Invalid Cortex delivery envelope");
  cortexPointId(signal.tenantId, signal.eventId);
  if (
    [signal.source, signal.type].some(
      (value) =>
        typeof value !== "string" || !value.trim() || value.length > 128,
    ) ||
    !signal.data ||
    typeof signal.data !== "object" ||
    Array.isArray(signal.data) ||
    typeof signal.timestamp !== "string" ||
    !/T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      signal.timestamp,
    ) ||
    !Number.isFinite(Date.parse(signal.timestamp))
  ) {
    throw new BadRequestException("Invalid Cortex delivery payload");
  }
}

/** A successful return means the exact tenant/event point was acknowledged by Cortex. */
export async function deliverCortexSignal(
  http: HttpService,
  config: ConfigService,
  signal: CortexDeliverySignal,
): Promise<CortexDeliveryAck> {
  validateSignal(signal);
  const pointId = cortexPointId(signal.tenantId, signal.eventId);
  const ack = await postToCortex<Partial<CortexDeliveryAck> | null>(
    http,
    config,
    "/signals/deliver",
    { ...signal },
  );
  if (
    ack?.status !== "ingested" ||
    ack.tenantId !== signal.tenantId ||
    ack.eventId !== signal.eventId.toLowerCase() ||
    ack.pointId !== pointId
  ) {
    throw new ServiceUnavailableException(
      "Cortex delivery acknowledgement does not match event identity",
    );
  }
  return {
    status: "ingested",
    tenantId: signal.tenantId,
    eventId: signal.eventId.toLowerCase(),
    pointId,
  };
}
