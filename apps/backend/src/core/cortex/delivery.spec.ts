import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { of, throwError } from "rxjs";
import {
  deliverCortexSignal,
  cortexPointId,
  CortexDeliverySignal,
} from "./delivery";
const signal: CortexDeliverySignal = {
  eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  tenantId: "tenant-a",
  source: "tickets",
  type: "ticket.resolved",
  data: { successScore: 5, ticketId: "ticket-a" },
  timestamp: "2026-10-07T12:00:00.000Z",
};
const secret = "isolated-cortex-service-secret-at-least-32-chars";
const config = {
  get: (key: string) =>
    key === "cortex.serviceSecret" ? secret : "http://isolated-cortex:8000",
} as ConfigService;
describe("durable Cortex delivery identity boundary", () => {
  const ack = () => ({
    status: "ingested",
    tenantId: signal.tenantId,
    eventId: signal.eventId,
    pointId: cortexPointId(signal.tenantId, signal.eventId),
  });
  it("retries fixed event bytes with a fresh service nonce and same expected point", async () => {
    const post = jest.fn().mockReturnValue(of({ data: ack() }));
    const http = { post } as unknown as HttpService;
    await deliverCortexSignal(http, config, signal);
    await deliverCortexSignal(http, config, signal);
    expect(post.mock.calls[0][0]).toBe(
      "http://isolated-cortex:8000/signals/deliver",
    );
    expect(post.mock.calls[0][1]).toBe(post.mock.calls[1][1]);
    expect(JSON.parse(post.mock.calls[0][1]).timestamp).toBe(signal.timestamp);
    expect(post.mock.calls[0][2].headers["x-cortex-nonce"]).not.toBe(
      post.mock.calls[1][2].headers["x-cortex-nonce"],
    );
  });
  it.each(["tenantId", "eventId", "pointId", "status"])(
    "rejects wrong %s acknowledgement",
    async (field) => {
      const post = jest
        .fn()
        .mockReturnValue(of({ data: { ...ack(), [field]: "wrong" } }));
      await expect(
        deliverCortexSignal({ post } as unknown as HttpService, config, signal),
      ).rejects.toMatchObject({ status: 503 });
    },
  );
  it("does not acknowledge transport timeout or malformed body", async () => {
    const post = jest
      .fn()
      .mockReturnValue(throwError(() => new Error("private-provider-address")));
    await expect(
      deliverCortexSignal({ post } as unknown as HttpService, config, signal),
    ).rejects.toMatchObject({ status: 503 });
    post.mockReturnValue(of({ data: null }));
    await expect(
      deliverCortexSignal({ post } as unknown as HttpService, config, signal),
    ).rejects.toMatchObject({ status: 503 });
  });
  it.each([
    { eventId: "not-uuid" },
    { timestamp: "yesterday" },
    { data: [] },
    { tenantId: "" },
    { source: "" },
  ])(
    "rejects malformed stable signal before transport %j",
    async (override) => {
      const post = jest.fn();
      await expect(
        deliverCortexSignal({ post } as unknown as HttpService, config, {
          ...signal,
          ...override,
        } as CortexDeliverySignal),
      ).rejects.toMatchObject({ status: 400 });
      expect(post).not.toHaveBeenCalled();
    },
  );
  it("scopes deterministic point identity by tenant", () => {
    expect(cortexPointId("tenant-a", signal.eventId)).toBe(
      "a838fcb8-797a-5369-822b-af4aaf8e77fe",
    );
    expect(cortexPointId("tenant-b", signal.eventId)).not.toBe(
      cortexPointId("tenant-a", signal.eventId),
    );
  });
});
