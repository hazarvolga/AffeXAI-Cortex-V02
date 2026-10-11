import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { DataSource } from "typeorm";
import { AutomationRule } from "../entities/automation-rule.entity";
import { PlatformEvent } from "../entities/platform-event.entity";
import { AutomationExecutorService } from "./automation-executor.service";

type DispatchRow = {
  event_id: string;
  rule_id: string;
  tenant_id: string;
  lease_token: string;
  attempts: number;
};

const DISPATCH_LEASE_SECONDS = 90;
const DISPATCH_HEARTBEAT_MS = 30_000;

@Injectable()
export class AutomationDispatchWorker {
  private readonly logger = new Logger(AutomationDispatchWorker.name);
  private running = false;

  constructor(
    private readonly db: DataSource,
    private readonly executor: AutomationExecutorService,
  ) {}

  @Interval(5000)
  async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const rows: DispatchRow[] = await this.db.query(`WITH due AS (
        SELECT event_id, rule_id FROM automation_dispatch_outbox
        WHERE (status = 'pending' AND available_at <= now())
           OR (status = 'processing' AND leased_until < now())
        ORDER BY available_at, created_at LIMIT 10 FOR UPDATE SKIP LOCKED
      ), claimed AS (
        UPDATE automation_dispatch_outbox o
        SET status = 'processing', attempts = attempts + 1,
            lease_token = gen_random_uuid(),
            leased_until = now() + interval '${DISPATCH_LEASE_SECONDS} seconds'
        FROM due WHERE o.event_id = due.event_id AND o.rule_id = due.rule_id
        RETURNING o.*
      ) SELECT * FROM claimed`);
      for (const row of rows) await this.deliver(row);
    } catch {
      this.logger.error(
        "Automation dispatch polling failed; persisted work remains available",
      );
    } finally {
      this.running = false;
    }
  }

  private async deliver(row: DispatchRow): Promise<void> {
    const heartbeat = setInterval(() => {
      void this.renewLease(row).catch(() => {
        this.logger.warn("Automation dispatch lease heartbeat failed");
      });
    }, DISPATCH_HEARTBEAT_MS);
    heartbeat.unref();
    try {
      const [event, rule] = await Promise.all([
        this.db.getRepository(PlatformEvent).findOne({
          where: { id: row.event_id, tenantId: row.tenant_id },
        }),
        this.db.getRepository(AutomationRule).findOne({
          where: { id: row.rule_id, tenantId: row.tenant_id },
        }),
      ]);

      if (!event || !rule || !rule.isActive || !rule.shouldTrigger(event)) {
        await this.ack(row, "skipped");
        return;
      }

      await this.executor.dispatch(rule, event);
      await this.ack(row, "delivered");
    } catch {
      const status = row.attempts >= 10 ? "dead" : "pending";
      const delay = Math.min(3600, 5 * 2 ** Math.min(row.attempts, 10));
      await this.db.query(
        `UPDATE automation_dispatch_outbox
        SET status = $5, available_at = now() + ($6 * interval '1 second'),
            last_error_code = $7, lease_token = NULL, leased_until = NULL
        WHERE event_id = $1 AND rule_id = $2 AND tenant_id = $3
          AND lease_token = $4 AND status = 'processing'`,
        [
          row.event_id,
          row.rule_id,
          row.tenant_id,
          row.lease_token,
          status,
          delay,
          "execution_failed",
        ],
      );
      if (status === "dead") {
        this.logger.error(
          "Automation dispatch exhausted retries; inspect dead dispatches",
        );
      }
    } finally {
      clearInterval(heartbeat);
    }
  }

  private async renewLease(row: DispatchRow): Promise<void> {
    await this.db.query(
      `UPDATE automation_dispatch_outbox
      SET leased_until = now() + interval '${DISPATCH_LEASE_SECONDS} seconds'
      WHERE event_id = $1 AND rule_id = $2 AND tenant_id = $3
        AND lease_token = $4 AND status = 'processing'`,
      [row.event_id, row.rule_id, row.tenant_id, row.lease_token],
    );
  }

  private async ack(
    row: DispatchRow,
    status: "delivered" | "skipped",
  ): Promise<void> {
    await this.db.query(
      `WITH acknowledged AS (
      UPDATE automation_dispatch_outbox
        SET status = $5, delivered_at = now(), lease_token = NULL,
            leased_until = NULL, last_error_code = NULL
        WHERE event_id = $1 AND rule_id = $2 AND tenant_id = $3
          AND lease_token = $4 AND status = 'processing'
        RETURNING event_id, rule_id, tenant_id
      )
      UPDATE platform_events event
        SET "triggeredRules" = CASE
          WHEN acknowledged.rule_id = ANY(event."triggeredRules") THEN event."triggeredRules"
          ELSE array_append(event."triggeredRules", acknowledged.rule_id)
        END,
        updated_at = now()
      FROM acknowledged
      WHERE event.id = acknowledged.event_id
        AND event.tenant_id = acknowledged.tenant_id
        AND $5 = 'delivered'`,
      [row.event_id, row.rule_id, row.tenant_id, row.lease_token, status],
    );
  }
}
