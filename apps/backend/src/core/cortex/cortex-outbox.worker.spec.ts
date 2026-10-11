import { CortexOutboxWorker } from "./cortex-outbox.worker";
import { deliverCortexSignal } from "./delivery";
jest.mock("./delivery", () => ({ deliverCortexSignal: jest.fn() }));
describe("Cortex leased delivery worker", () => {
  const row = {
    event_id: "event-a",
    tenant_id: "tenant-a",
    lease_token: "lease-a",
    attempts: 1,
    payload: { eventId: "event-a" },
  };
  function setup() {
    const db = {
      query: jest.fn().mockResolvedValueOnce([row]).mockResolvedValue([]),
    };
    return {
      db,
      worker: new CortexOutboxWorker(db as any, {} as any, {} as any),
    };
  }
  beforeEach(() => {
    jest.resetAllMocks();
    (deliverCortexSignal as jest.Mock).mockResolvedValue({});
  });
  it("acknowledges only the lease that delivered the event", async () => {
    (deliverCortexSignal as jest.Mock).mockResolvedValue({});
    const { db, worker } = setup();
    await worker.drain();
    expect(deliverCortexSignal).toHaveBeenCalledWith({}, {}, row.payload);
    expect(db.query.mock.calls[1][0]).toContain("lease_token = $3");
    expect(db.query.mock.calls[1][1]).toEqual([
      "event-a",
      "tenant-a",
      "lease-a",
    ]);
  });
  it("retains failed delivery for retry without leaking provider errors", async () => {
    (deliverCortexSignal as jest.Mock).mockRejectedValue(
      new Error("secret provider details"),
    );
    const { db, worker } = setup();
    await worker.drain();
    const [sql, params] = db.query.mock.calls[1];
    expect(sql).toContain("lease_token = $3");
    expect(params).toEqual([
      "event-a",
      "tenant-a",
      "lease-a",
      "pending",
      10,
      "delivery_unavailable",
    ]);
    expect(JSON.stringify(params)).not.toContain("secret");
  });
  it("moves repeatedly failing delivery to a visible dead state", async () => {
    (deliverCortexSignal as jest.Mock).mockRejectedValue(new Error("offline"));
    const { db, worker } = setup();
    db.query
      .mockReset()
      .mockResolvedValueOnce([{ ...row, attempts: 10 }])
      .mockResolvedValue([]);
    await worker.drain();
    expect(db.query.mock.calls[1][1][3]).toBe("dead");
  });
  it("claims rows atomically with skip locked and recovers expired leases", async () => {
    const { db, worker } = setup();
    await worker.drain();
    expect(db.query.mock.calls[0][0]).toContain("FOR UPDATE SKIP LOCKED");
    expect(db.query.mock.calls[0][0]).toContain("leased_until < now()");
  });
  it("returns claimed rows through a top-level select for the TypeORM postgres driver", async () => {
    const db = {
      query: jest
        .fn()
        .mockImplementation((sql: string) =>
          Promise.resolve(
            sql.trimEnd().endsWith("SELECT * FROM claimed") ? [row] : [],
          ),
        ),
    };
    await new CortexOutboxWorker(db as any, {} as any, {} as any).drain();
    const claimSql = db.query.mock.calls[0][0] as string;
    expect(claimSql).toContain("claimed AS");
    expect(claimSql).toMatch(/SELECT \* FROM claimed\s*$/);
    expect(deliverCortexSignal).toHaveBeenCalledWith({}, {}, row.payload);
  });
  it("does not deliver when no rows are due", async () => {
    const db = { query: jest.fn().mockResolvedValue([]) };
    await new CortexOutboxWorker(db as any, {} as any, {} as any).drain();
    expect(deliverCortexSignal).not.toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledTimes(1);
  });
  it("prevents overlapping polls in one worker and releases its local gate after DB failure", async () => {
    let rejectClaim: (error: Error) => void;
    const db = {
      query: jest
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve, reject) => {
              rejectClaim = reject;
            }),
        )
        .mockResolvedValue([]),
    };
    const worker = new CortexOutboxWorker(db as any, {} as any, {} as any);
    const active = worker.drain();
    await worker.drain();
    expect(db.query).toHaveBeenCalledTimes(1);
    rejectClaim!(new Error("db unavailable"));
    await active;
    await worker.drain();
    expect(db.query).toHaveBeenCalledTimes(2);
  });
  it("reschedules an unrecorded ACK using the same business event after database failure", async () => {
    (deliverCortexSignal as jest.Mock).mockResolvedValue({});
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce([row])
        .mockRejectedValueOnce(new Error("ack lost"))
        .mockResolvedValue([]),
    };
    await new CortexOutboxWorker(db as any, {} as any, {} as any).drain();
    expect(deliverCortexSignal).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[2][1]).toEqual([
      "event-a",
      "tenant-a",
      "lease-a",
      "pending",
      10,
      "delivery_unavailable",
    ]);
  });
});
