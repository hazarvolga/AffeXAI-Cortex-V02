import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { OnEvent } from "@nestjs/event-emitter";
import { lookup } from "node:dns/promises";
import { Agent as HttpsAgent } from "node:https";
import { isIP } from "node:net";
import { Webhook, WebhookAuthType } from "../entities/webhook.entity";
import {
  PlatformEvent,
  PlatformEventType,
} from "../entities/platform-event.entity";
import { isPublicAddress } from "../../../core/network/public-url-fetcher";

export type WebhookWriteInput = {
  name?: unknown;
  url?: unknown;
  subscribedEvents?: unknown;
  authType?: unknown;
  authConfig?: unknown;
  customHeaders?: unknown;
  description?: unknown;
  retryCount?: unknown;
  retryDelay?: unknown;
  timeout?: unknown;
  isActive?: unknown;
};

const BLOCKED_CUSTOM_HEADERS = new Set([
  "authorization",
  "connection",
  "content-length",
  "content-type",
  "cookie",
  "host",
  "idempotency-key",
  "proxy-authorization",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "user-agent",
]);
const WEBHOOK_DELIVERY_BUDGET_MS = 45_000;
const TRANSIENT_WEBHOOK_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  "ETIMEDOUT",
  "EAI_AGAIN",
]);

const SAFE_WEBHOOK_PAYLOAD_FIELDS: Record<
  PlatformEventType,
  readonly string[]
> = {
  [PlatformEventType.TICKET_RESOLVED]: [
    "ticketId",
    "successScore",
    "resolutionTime",
  ],
  [PlatformEventType.CRM_LEAD_CAPTURED]: [
    "schemaVersion",
    "leadId",
    "customerId",
    "formId",
    "submissionId",
  ],
  [PlatformEventType.FORM_SUBMITTED]: [
    "schemaVersion",
    "formId",
    "submissionId",
  ],
  [PlatformEventType.EVENT_CREATED]: ["eventId", "status"],
  [PlatformEventType.EVENT_UPDATED]: ["eventId", "status"],
  [PlatformEventType.EVENT_PUBLISHED]: ["eventId", "status"],
  [PlatformEventType.EVENT_CANCELLED]: ["eventId", "status", "reason"],
  [PlatformEventType.CAMPAIGN_CREATED]: ["campaignId"],
  [PlatformEventType.CAMPAIGN_SENT]: ["campaignId", "recipientCount"],
  [PlatformEventType.CAMPAIGN_COMPLETED]: ["campaignId", "recipientCount"],
  [PlatformEventType.SUBSCRIBER_ADDED]: ["subscriberId", "source"],
  [PlatformEventType.SUBSCRIBER_UNSUBSCRIBED]: ["subscriberId", "source"],
  [PlatformEventType.CERTIFICATE_ISSUED]: ["certificateId", "eventId"],
  [PlatformEventType.CERTIFICATE_SENT]: ["certificateId", "eventId"],
  [PlatformEventType.CERTIFICATE_DOWNLOADED]: ["certificateId", "eventId"],
  [PlatformEventType.PAGE_CREATED]: ["pageId", "slug"],
  [PlatformEventType.PAGE_PUBLISHED]: ["pageId", "slug"],
  [PlatformEventType.PAGE_UPDATED]: ["pageId", "slug"],
  [PlatformEventType.PAGE_ARCHIVED]: ["pageId", "slug"],
  [PlatformEventType.MEDIA_UPLOADED]: ["mediaId", "fileSize"],
  [PlatformEventType.MEDIA_DELETED]: ["mediaId"],
};

export type RedactedWebhook = Omit<Webhook, "authConfig" | "customHeaders"> & {
  authConfig?: { configured: true; headerName?: string };
  customHeaders?: Record<string, "[REDACTED]">;
};

/**
 * Webhook Service
 *
 * Manages webhook subscriptions and deliveries.
 * Sends platform events to external systems via HTTP.
 *
 * Features:
 * - Event-based webhook triggering
 * - Multiple authentication methods (Bearer, API Key, Basic)
 * - Automatic retry with exponential backoff
 * - Success/failure tracking
 * - Webhook health monitoring
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Listen to platform events and trigger webhooks
   */
  @OnEvent("platform.event")
  async handlePlatformEvent(data: {
    event: PlatformEvent;
    payload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { event } = data;

    try {
      // Find all active webhooks subscribed to this event type for this tenant
      const webhooks = await this.findSubscribedWebhooks(
        event.eventType,
        event.tenantId,
      );

      if (webhooks.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${webhooks.length} webhooks subscribed to ${event.eventType}`,
      );

      // Trigger webhooks in parallel
      await Promise.all(
        webhooks.map((webhook) => this.triggerWebhook(webhook, event)),
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle platform event for webhooks: ${event.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Find webhooks subscribed to an event type
   */
  private async findSubscribedWebhooks(
    eventType: PlatformEventType,
    tenantId: string,
  ): Promise<Webhook[]> {
    return this.webhookRepository
      .createQueryBuilder("webhook")
      .where("webhook.is_active = :isActive", { isActive: true })
      .andWhere("webhook.tenantId = :tenantId", { tenantId })
      .andWhere(":eventType = ANY(webhook.subscribed_events)", { eventType })
      .getMany();
  }

  /**
   * Trigger a webhook with an event
   */
  async triggerWebhook(
    webhook: Webhook,
    event: PlatformEvent,
    idempotencyKey = event.id,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      this.assertAllowedDestination(webhook.url);
      const safeIdempotencyKey = this.validateIdempotencyKey(idempotencyKey);
      this.logger.log(`Triggering webhook: ${webhook.name} (${webhook.id})`, {
        eventType: event.eventType,
      });

      const payload = {
        event: {
          schemaVersion: 2,
          id: event.id,
          type: event.eventType,
          source: event.source,
          timestamp: event.createdAt,
        },
        data: this.projectPayload(event),
      };

      // Send HTTP request with retry logic
      await this.sendWithRetry(
        webhook,
        payload,
        safeIdempotencyKey,
        Date.now() + WEBHOOK_DELIVERY_BUDGET_MS,
      );

      const duration = Date.now() - startTime;

      this.logger.log(`Webhook triggered successfully: ${webhook.name}`, {
        duration: `${duration}ms`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to trigger webhook: ${webhook.name}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Send HTTP request with retry logic
   */
  private async sendWithRetry(
    webhook: Webhook,
    payload: unknown,
    idempotencyKey: string,
    deadline: number,
    attempt = 1,
  ): Promise<void> {
    let httpsAgent: HttpsAgent | undefined;
    let responseStatus: number;
    try {
      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "AffeXAI-Cortex-Webhook/1.0",
        "Idempotency-Key": idempotencyKey,
        ...this.getAuthenticationHeaders(webhook),
        ...this.sanitizeCustomHeaders(webhook.customHeaders),
      };

      if (deadline - Date.now() <= 0)
        throw new Error("Webhook delivery budget exhausted");
      httpsAgent = await this.createPinnedHttpsAgent(webhook.url, deadline);
      const requestRemainingMs = deadline - Date.now();
      if (requestRemainingMs <= 0)
        throw new Error(
          "Webhook delivery budget exhausted after DNS resolution",
        );
      const response = await firstValueFrom(
        this.httpService.post<unknown>(webhook.url, payload, {
          headers,
          timeout: Math.min(webhook.timeout, requestRemainingMs),
          maxRedirects: 0,
          maxBodyLength: 64 * 1024,
          maxContentLength: 64 * 1024,
          proxy: false,
          httpsAgent,
        }),
      );
      responseStatus = response?.status || 200;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const status = this.getHttpStatus(error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown webhook error";
      const retryable =
        status === 408 ||
        status === 425 ||
        status === 429 ||
        (status !== undefined && status >= 500) ||
        (status === undefined && this.isRetryableTransportError(error));

      this.logger.warn(
        `Webhook call failed (attempt ${attempt}/${webhook.retryCount + 1}): ${webhook.name}`,
        { status, error: errorMessage },
      );

      // Check if we should retry
      if (retryable && attempt <= webhook.retryCount) {
        // Calculate retry delay with exponential backoff
        const delay = Math.max(
          webhook.retryDelay * Math.pow(2, attempt - 1),
          this.getRetryAfterMs(error) ?? 0,
        );

        if (delay >= deadline - Date.now()) {
          const budgetError = "Webhook delivery budget exhausted before retry";
          webhook.recordCall(false, status, budgetError);
          await this.webhookRepository.save(webhook);
          throw new Error(budgetError);
        }

        this.logger.log(`Retrying webhook in ${delay}ms: ${webhook.name}`);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry
        return this.sendWithRetry(
          webhook,
          payload,
          idempotencyKey,
          deadline,
          attempt + 1,
        );
      } else {
        // All retries exhausted, record failure
        webhook.recordCall(false, status, errorMessage);
        await this.webhookRepository.save(webhook);

        throw new Error(
          `Webhook failed after ${attempt} attempt${attempt === 1 ? "" : "s"}: ${errorMessage}`,
        );
      }
    } finally {
      httpsAgent?.destroy();
    }

    // Keep bookkeeping outside the transport retry block. A database failure
    // after a 2xx response must never cause the external POST to be repeated.
    webhook.recordCall(true, responseStatus);
    try {
      await this.webhookRepository.save(webhook);
    } catch (error) {
      this.logger.error(
        `Webhook delivered but success metrics could not be persisted: ${webhook.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
    this.logger.debug(`Webhook call successful: ${webhook.name}`, {
      status: responseStatus,
    });
  }

  /**
   * Create a new webhook
   */
  async create(data: WebhookWriteInput, tenantId: string): Promise<Webhook> {
    const sanitized = this.sanitizeWriteInput(data, false);
    const authType = sanitized.authType || WebhookAuthType.NONE;
    this.validateAuthConfiguration(authType, sanitized.authConfig);
    const webhook = this.webhookRepository.create({
      ...sanitized,
      isActive: true,
      authType,
      tenantId,
    });

    return this.webhookRepository.save(webhook);
  }

  /**
   * Update webhook
   */
  async update(
    id: string,
    data: WebhookWriteInput,
    tenantId: string,
  ): Promise<Webhook> {
    const current = await this.webhookRepository.findOne({
      where: { id, tenantId },
    });
    if (!current) throw new NotFoundException(`Webhook not found: ${id}`);

    const sanitized = this.sanitizeWriteInput(data, true);
    if (this.isRedactedAuthPlaceholder(data.authConfig)) {
      delete sanitized.authConfig;
    }
    if (data.customHeaders !== undefined) {
      sanitized.customHeaders = this.restoreRedactedHeaders(
        sanitized.customHeaders ?? {},
        current.customHeaders ?? {},
      );
    }
    const destination = sanitized.url ?? current.url;
    this.assertAllowedDestination(destination);
    const effectiveAuthType = sanitized.authType ?? current.authType;
    const clearsAuth =
      effectiveAuthType === WebhookAuthType.NONE || data.authConfig === null;
    const effectiveAuthConfig = clearsAuth
      ? undefined
      : (sanitized.authConfig ?? current.authConfig);
    this.validateAuthConfiguration(effectiveAuthType, effectiveAuthConfig);

    const updateValues: QueryDeepPartialEntity<Webhook> = { ...sanitized };
    if (clearsAuth) updateValues.authConfig = null;
    await this.webhookRepository.update({ id, tenantId }, updateValues);

    return {
      ...current,
      ...sanitized,
      ...(clearsAuth ? { authConfig: undefined } : {}),
    } as Webhook;
  }

  /**
   * Delete webhook (soft delete)
   */
  async delete(id: string, tenantId: string): Promise<void> {
    await this.webhookRepository.softDelete({ id, tenantId });
  }

  /**
   * Get all webhooks
   */
  async findAll(tenantId: string): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get active webhooks
   */
  async findActive(tenantId: string): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { isActive: true, tenantId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get webhook by ID
   */
  async findOne(id: string, tenantId: string): Promise<Webhook | null> {
    return this.webhookRepository.findOne({ where: { id, tenantId } });
  }

  redactForResponse(webhook: Webhook): RedactedWebhook {
    const { authConfig, customHeaders, ...safe } = webhook;
    const redactedHeaders = customHeaders
      ? Object.fromEntries(
          Object.keys(customHeaders).map((name) => [
            name,
            "[REDACTED]" as const,
          ]),
        )
      : undefined;
    return {
      ...safe,
      ...(authConfig
        ? {
            authConfig: {
              configured: true as const,
              ...(authConfig.headerName
                ? { headerName: authConfig.headerName }
                : {}),
            },
          }
        : {}),
      ...(redactedHeaders ? { customHeaders: redactedHeaders } : {}),
    } as RedactedWebhook;
  }

  /**
   * Test webhook connection
   */
  async testWebhook(
    id: string,
    tenantId: string,
  ): Promise<{
    success: boolean;
    status?: number;
    error?: string;
    duration: number;
  }> {
    const webhook = await this.findOne(id, tenantId);
    if (!webhook) {
      throw new NotFoundException(`Webhook not found: ${id}`);
    }

    this.assertAllowedDestination(webhook.url);

    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "AffeXAI-Cortex-Webhook/1.0",
        "Idempotency-Key": `test-${webhook.id}`,
        ...this.getAuthenticationHeaders(webhook),
        ...this.sanitizeCustomHeaders(webhook.customHeaders),
      };

      const testPayload = {
        event: {
          type: "test",
          timestamp: new Date(),
        },
        data: {
          message: "This is a test webhook call from AffeXAI Cortex",
        },
      };

      const deadline = Date.now() + WEBHOOK_DELIVERY_BUDGET_MS;
      const httpsAgent = await this.createPinnedHttpsAgent(
        webhook.url,
        deadline,
      );
      let response: { status: number };
      try {
        const requestRemainingMs = deadline - Date.now();
        if (requestRemainingMs <= 0) {
          throw new Error(
            "Webhook delivery budget exhausted after DNS resolution",
          );
        }
        response = await firstValueFrom(
          this.httpService.post<unknown>(webhook.url, testPayload, {
            headers,
            timeout: Math.min(webhook.timeout, requestRemainingMs),
            maxRedirects: 0,
            maxBodyLength: 64 * 1024,
            maxContentLength: 64 * 1024,
            proxy: false,
            httpsAgent,
          }),
        );
      } finally {
        httpsAgent.destroy();
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        status: response?.status || 200,
        duration,
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        status: this.getHttpStatus(error),
        error: error instanceof Error ? error.message : "Unknown webhook error",
        duration,
      };
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(
    id: string,
    tenantId: string,
  ): Promise<{
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    successRate: number;
    lastCalledAt?: Date;
    lastStatus?: number;
  }> {
    const webhook = await this.findOne(id, tenantId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${id}`);
    }

    return {
      totalCalls: webhook.totalCalls,
      successfulCalls: webhook.successfulCalls,
      failedCalls: webhook.failedCalls,
      successRate: webhook.getSuccessRate(),
      lastCalledAt: webhook.lastCalledAt,
      lastStatus: webhook.lastStatus,
    };
  }

  /**
   * Get overall webhook statistics
   */
  async getOverallStats(tenantId: string): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalCalls: number;
    successfulCalls: number;
    averageSuccessRate: number;
  }> {
    const webhooks = await this.findAll(tenantId);

    const totalWebhooks = webhooks.length;
    const activeWebhooks = webhooks.filter((w) => w.isActive).length;

    const totalCalls = webhooks.reduce((sum, w) => sum + w.totalCalls, 0);
    const successfulCalls = webhooks.reduce(
      (sum, w) => sum + w.successfulCalls,
      0,
    );

    const averageSuccessRate =
      webhooks.length > 0
        ? webhooks.reduce((sum, w) => sum + w.getSuccessRate(), 0) /
          webhooks.length
        : 0;

    return {
      totalWebhooks,
      activeWebhooks,
      totalCalls,
      successfulCalls,
      averageSuccessRate,
    };
  }

  private sanitizeWriteInput(
    data: WebhookWriteInput,
    partial: boolean,
  ): Partial<Webhook> {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new BadRequestException("Webhook payload must be an object");
    }

    const result: Partial<Webhook> = {};
    if (!partial || data.name !== undefined)
      result.name = this.requiredText(data.name, "name", 255);
    if (!partial || data.url !== undefined) {
      result.url = this.requiredText(data.url, "url", 500);
      this.assertAllowedDestination(result.url);
    }
    if (!partial || data.subscribedEvents !== undefined) {
      result.subscribedEvents = this.validateSubscribedEvents(
        data.subscribedEvents,
      );
    }
    if (data.description !== undefined) {
      result.description = this.optionalText(
        data.description,
        "description",
        2000,
      );
    }
    if (data.authType !== undefined) {
      if (
        !Object.values(WebhookAuthType).includes(
          data.authType as WebhookAuthType,
        )
      ) {
        throw new BadRequestException("Invalid webhook authType");
      }
      result.authType = data.authType as WebhookAuthType;
    }
    if (data.authConfig !== undefined)
      result.authConfig = this.sanitizeAuthConfig(data.authConfig);
    if (data.customHeaders !== undefined)
      result.customHeaders = this.sanitizeCustomHeaders(data.customHeaders);
    if (data.retryCount !== undefined)
      result.retryCount = this.boundedInteger(
        data.retryCount,
        "retryCount",
        0,
        10,
      );
    if (data.retryDelay !== undefined)
      result.retryDelay = this.boundedInteger(
        data.retryDelay,
        "retryDelay",
        0,
        300_000,
      );
    if (data.timeout !== undefined)
      result.timeout = this.boundedInteger(
        data.timeout,
        "timeout",
        100,
        60_000,
      );
    if (partial && data.isActive !== undefined) {
      if (typeof data.isActive !== "boolean")
        throw new BadRequestException("isActive must be a boolean");
      result.isActive = data.isActive;
    }
    return result;
  }

  private assertAllowedDestination(value: string): void {
    let destination: URL;
    try {
      destination = new URL(value);
    } catch {
      throw new BadRequestException("Webhook URL is invalid");
    }
    if (
      destination.protocol !== "https:" ||
      destination.username ||
      destination.password ||
      (destination.port && destination.port !== "443")
    ) {
      throw new BadRequestException(
        "Webhook URL must use credential-free HTTPS on port 443",
      );
    }

    const hostname = destination.hostname.toLowerCase().replace(/\.$/, "");
    const allowlist = (process.env.WEBHOOK_ALLOWED_HOSTS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase().replace(/\.$/, ""))
      .filter(Boolean);
    const allowed = allowlist.some((entry) =>
      entry.startsWith("*.")
        ? hostname.endsWith(entry.slice(1)) && hostname !== entry.slice(2)
        : hostname === entry,
    );
    if (!allowed)
      throw new BadRequestException("Webhook destination is not allowlisted");
  }

  private async createPinnedHttpsAgent(
    value: string,
    deadline: number,
  ): Promise<HttpsAgent> {
    this.assertAllowedDestination(value);
    const destination = new URL(value);
    const hostname = destination.hostname.replace(/^\[|\]$/g, "");
    const addresses = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await this.resolveWithDeadline(hostname, deadline);
    if (
      addresses.length === 0 ||
      addresses.some(
        (result) =>
          !isPublicAddress(result.address) ||
          isIP(result.address) !== result.family,
      )
    ) {
      throw new BadRequestException(
        "Webhook DNS contains a private or reserved destination",
      );
    }
    const selected = addresses[0];
    return new HttpsAgent({
      keepAlive: false,
      lookup: (_host, options, callback) => {
        if (typeof options === "object" && options.all) {
          // Node's overloaded lookup callback type does not model the all=true branch here.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          (callback as any)(null, [selected]);
          return;
        }
        callback(null, selected.address, selected.family);
      },
    });
  }

  private async resolveWithDeadline(
    hostname: string,
    deadline: number,
  ): Promise<Array<{ address: string; family: number }>> {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0)
      throw new Error(
        "Webhook delivery budget exhausted during DNS resolution",
      );
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        lookup(hostname, { all: true, verbatim: true }),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  "Webhook delivery budget exhausted during DNS resolution",
                ),
              ),
            remainingMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private projectPayload(
    event: PlatformEvent,
  ): Record<string, string | number | boolean | null> {
    const allowedFields = SAFE_WEBHOOK_PAYLOAD_FIELDS[event.eventType] ?? [];
    const source = event.payload as Record<string, unknown>;
    return allowedFields.reduce<
      Record<string, string | number | boolean | null>
    >((projected, field) => {
      const value = source[field];
      if (this.isSafePayloadScalar(value)) {
        return { ...projected, [field]: value };
      }
      return projected;
    }, {});
  }

  private isSafePayloadScalar(
    value: unknown,
  ): value is string | number | boolean | null {
    return (
      value === null ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value)) ||
      (typeof value === "string" && value.length <= 512)
    );
  }

  private getHttpStatus(error: unknown): number | undefined {
    if (!error || typeof error !== "object" || !("response" in error)) {
      return undefined;
    }
    const response = (error as { response?: unknown }).response;
    if (!response || typeof response !== "object" || !("status" in response)) {
      return undefined;
    }
    const status = (response as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }

  private isRetryableTransportError(error: unknown): boolean {
    if (!error || typeof error !== "object" || !("code" in error)) return false;
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" && TRANSIENT_WEBHOOK_ERROR_CODES.has(code);
  }

  private getRetryAfterMs(error: unknown): number | undefined {
    if (!error || typeof error !== "object" || !("response" in error)) {
      return undefined;
    }
    const response = (error as { response?: unknown }).response;
    if (!response || typeof response !== "object" || !("headers" in response)) {
      return undefined;
    }
    const headers = (response as { headers?: unknown }).headers;
    if (!headers || typeof headers !== "object") return undefined;
    const value = (headers as Record<string, unknown>)["retry-after"];
    if (typeof value !== "string" && typeof value !== "number")
      return undefined;
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    if (typeof value !== "string") return undefined;
    const date = Date.parse(value);
    return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined;
  }

  private isRedactedAuthPlaceholder(value: unknown): boolean {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return false;
    const source = value as Record<string, unknown>;
    const keys = Object.keys(source);
    return (
      source.configured === true &&
      keys.every((key) => key === "configured" || key === "headerName")
    );
  }

  private restoreRedactedHeaders(
    requested: Record<string, string>,
    current: Record<string, string>,
  ): Record<string, string> {
    const currentByName = new Map(
      Object.entries(current).map(([name, value]) => [
        name.toLowerCase(),
        value,
      ]),
    );
    return Object.fromEntries(
      Object.entries(requested).map(([name, value]) => {
        if (value !== "[REDACTED]") return [name, value];
        const stored = currentByName.get(name.toLowerCase());
        if (stored === undefined) {
          throw new BadRequestException(
            `Cannot preserve unknown redacted custom header: ${name}`,
          );
        }
        return [name, stored];
      }),
    );
  }

  private sanitizeCustomHeaders(value: unknown): Record<string, string> {
    if (value === undefined || value === null) return {};
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new BadRequestException("customHeaders must be an object");
    }
    const entries = Object.entries(value);
    if (entries.length > 20)
      throw new BadRequestException("customHeaders cannot exceed 20 entries");
    return Object.fromEntries(
      entries.map(([name, rawValue]) => {
        const normalized = name.toLowerCase();
        if (
          !/^[A-Za-z0-9-]{1,64}$/.test(name) ||
          BLOCKED_CUSTOM_HEADERS.has(normalized) ||
          normalized.startsWith("x-forwarded-")
        ) {
          throw new BadRequestException(`Unsafe custom header: ${name}`);
        }
        if (
          typeof rawValue !== "string" ||
          rawValue.length > 2048 ||
          /[\r\n]/.test(rawValue)
        ) {
          throw new BadRequestException(`Invalid custom header value: ${name}`);
        }
        return [name, rawValue];
      }),
    );
  }

  private sanitizeAuthConfig(value: unknown): Webhook["authConfig"] {
    if (value === null) return undefined;
    if (typeof value !== "object" || Array.isArray(value))
      throw new BadRequestException("authConfig must be an object");
    const source = value as Record<string, unknown>;
    const result: NonNullable<Webhook["authConfig"]> = {};
    for (const field of ["token", "apiKey", "username", "password"] as const) {
      if (source[field] !== undefined)
        result[field] = this.requiredText(
          source[field],
          `authConfig.${field}`,
          2048,
        );
    }
    if (source.headerName !== undefined) {
      const headerName = this.requiredText(
        source.headerName,
        "authConfig.headerName",
        64,
      );
      if (
        !/^[A-Za-z0-9-]+$/.test(headerName) ||
        BLOCKED_CUSTOM_HEADERS.has(headerName.toLowerCase())
      ) {
        throw new BadRequestException("Invalid API key header name");
      }
      result.headerName = headerName;
    }
    return result;
  }

  private getAuthenticationHeaders(webhook: Webhook): Record<string, string> {
    const config = webhook.authConfig;
    if (webhook.authType === WebhookAuthType.BEARER && config?.token)
      return { Authorization: `Bearer ${config.token}` };
    if (
      webhook.authType === WebhookAuthType.BASIC &&
      config?.username &&
      config?.password
    ) {
      return {
        Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`,
      };
    }
    if (webhook.authType === WebhookAuthType.API_KEY && config?.apiKey) {
      const name = config.headerName || "X-API-Key";
      if (
        !/^[A-Za-z0-9-]{1,64}$/.test(name) ||
        BLOCKED_CUSTOM_HEADERS.has(name.toLowerCase())
      ) {
        throw new BadRequestException("Invalid API key header name");
      }
      return { [name]: config.apiKey };
    }
    return {};
  }

  private validateAuthConfiguration(
    authType: WebhookAuthType,
    config?: Webhook["authConfig"],
  ): void {
    if (authType === WebhookAuthType.NONE) return;
    if (authType === WebhookAuthType.BEARER && !config?.token) {
      throw new BadRequestException(
        "Bearer webhook authentication requires a token",
      );
    }
    if (authType === WebhookAuthType.API_KEY && !config?.apiKey) {
      throw new BadRequestException(
        "API key webhook authentication requires an apiKey",
      );
    }
    if (
      authType === WebhookAuthType.BASIC &&
      (!config?.username || !config.password)
    ) {
      throw new BadRequestException(
        "Basic webhook authentication requires username and password",
      );
    }
  }

  private validateSubscribedEvents(value: unknown): PlatformEventType[] {
    if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
      throw new BadRequestException(
        "subscribedEvents must contain 1 to 100 events",
      );
    }
    const allowed = new Set(Object.values(PlatformEventType));
    const events = [...new Set(value)];
    if (
      events.some(
        (item) =>
          typeof item !== "string" || !allowed.has(item as PlatformEventType),
      )
    ) {
      throw new BadRequestException(
        "subscribedEvents contains an invalid event type",
      );
    }
    return events as PlatformEventType[];
  }

  private validateIdempotencyKey(value: string): string {
    if (typeof value !== "string" || !/^[A-Za-z0-9._:-]{1,200}$/.test(value)) {
      throw new BadRequestException("Invalid webhook idempotency key");
    }
    return value;
  }

  private requiredText(value: unknown, field: string, max: number): string {
    if (typeof value !== "string" || !value.trim() || value.length > max) {
      throw new BadRequestException(
        `${field} must be a non-empty string with at most ${max} characters`,
      );
    }
    return value.trim();
  }

  private optionalText(
    value: unknown,
    field: string,
    max: number,
  ): string | undefined {
    if (value === null || value === "") return undefined;
    return this.requiredText(value, field, max);
  }

  private boundedInteger(
    value: unknown,
    field: string,
    min: number,
    max: number,
  ): number {
    if (
      !Number.isInteger(value) ||
      (value as number) < min ||
      (value as number) > max
    ) {
      throw new BadRequestException(
        `${field} must be an integer between ${min} and ${max}`,
      );
    }
    return value as number;
  }
}
