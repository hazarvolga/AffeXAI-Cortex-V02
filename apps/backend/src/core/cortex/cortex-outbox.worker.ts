import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { DataSource } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { deliverCortexSignal } from "./delivery";

type DeliveryRow = {
  event_id: string;
  tenant_id: string;
  lease_token: string;
  attempts: number;
  payload: Parameters<typeof deliverCortexSignal>[2];
};

@Injectable()
export class CortexOutboxWorker {
  private readonly logger = new Logger(CortexOutboxWorker.name);
  private running = false;
  constructor(
    private readonly db: DataSource,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  @Interval(5000)
  async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      // One SQL statement claims and commits before any network operation. Multiple
      // instances can claim disjoint rows; fencing prevents a stale worker's ACK.
      const rows: DeliveryRow[] = await this.db.query(`WITH due AS (
        SELECT event_id FROM cortex_outbox
        WHERE (status = 'pending' AND available_at <= now())
           OR (status = 'processing' AND leased_until < now())
        ORDER BY available_at, created_at LIMIT 5 FOR UPDATE SKIP LOCKED
      ), claimed AS (
        UPDATE cortex_outbox o SET status = 'processing', attempts = attempts + 1,
          lease_token = gen_random_uuid(), leased_until = now() + interval '60 seconds'
        FROM due WHERE o.event_id = due.event_id RETURNING o.*
      ) SELECT * FROM claimed`);
      for (const row of rows) await this.deliver(row);
    } catch {
      this.logger.error(
        "Cortex outbox polling failed; persisted events remain available",
      );
    } finally {
      this.running = false;
    }
  }

  private async deliver(row: DeliveryRow): Promise<void> {
    try {
      await deliverCortexSignal(this.http, this.config, row.payload);
      await this.db.query(
        `UPDATE cortex_outbox SET status = 'delivered', delivered_at = now(),
        lease_token = NULL, leased_until = NULL, last_error_code = NULL
        WHERE event_id = $1 AND tenant_id = $2 AND lease_token = $3 AND status = 'processing'`,
        [row.event_id, row.tenant_id, row.lease_token],
      );
    } catch {
      const status = row.attempts >= 10 ? "dead" : "pending";
      const delay = Math.min(3600, 5 * 2 ** Math.min(row.attempts, 10));
      await this.db.query(
        `UPDATE cortex_outbox SET status = $4,
        available_at = now() + ($5 * interval '1 second'), last_error_code = $6,
        lease_token = NULL, leased_until = NULL
        WHERE event_id = $1 AND tenant_id = $2 AND lease_token = $3 AND status = 'processing'`,
        [
          row.event_id,
          row.tenant_id,
          row.lease_token,
          status,
          delay,
          "delivery_unavailable",
        ],
      );
      if (status === "dead")
        this.logger.error(
          "Cortex delivery exhausted retries; inspect dead outbox events",
        );
    }
  }
}
