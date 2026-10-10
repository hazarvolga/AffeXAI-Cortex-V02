import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { WebhookService, WebhookWriteInput } from "../services/webhook.service";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../core/auth/guards/permissions.guard";
import { RequirePermissions } from "../../../core/auth/decorators/permissions.decorator";
import { CurrentUser } from "../../../core/auth/decorators/current-user.decorator";
import { User } from "../../users/entities/user.entity";
import { PERMISSIONS } from "../../../lib/permissions";

/**
 * Webhooks Controller
 *
 * CRUD operations for webhooks and webhook testing.
 */
@Controller("automation/webhooks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
export class WebhooksController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Get all webhooks
   */
  @Get()
  async findAll(@CurrentUser() user: User) {
    return (await this.webhookService.findAll(user.tenantId)).map((webhook) =>
      this.webhookService.redactForResponse(webhook),
    );
  }

  /**
   * Get active webhooks
   */
  @Get("active")
  async findActive(@CurrentUser() user: User) {
    return (await this.webhookService.findActive(user.tenantId)).map(
      (webhook) => this.webhookService.redactForResponse(webhook),
    );
  }

  /**
   * Get webhook by ID
   */
  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: User) {
    const webhook = await this.webhookService.findOne(id, user.tenantId);
    return webhook ? this.webhookService.redactForResponse(webhook) : null;
  }

  /**
   * Create new webhook
   */
  @Post()
  async create(@Body() data: WebhookWriteInput, @CurrentUser() user: User) {
    return this.webhookService.redactForResponse(
      await this.webhookService.create(data, user.tenantId),
    );
  }

  /**
   * Update webhook
   */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() data: WebhookWriteInput,
    @CurrentUser() user: User,
  ) {
    return this.webhookService.redactForResponse(
      await this.webhookService.update(id, data, user.tenantId),
    );
  }

  /**
   * Delete webhook (soft delete)
   */
  @Delete(":id")
  async delete(@Param("id") id: string, @CurrentUser() user: User) {
    await this.webhookService.delete(id, user.tenantId);
    return { success: true };
  }

  /**
   * Test webhook connection
   */
  @Post(":id/test")
  async test(@Param("id") id: string, @CurrentUser() user: User) {
    return this.webhookService.testWebhook(id, user.tenantId);
  }

  /**
   * Get webhook statistics
   */
  @Get(":id/stats")
  async getStats(@Param("id") id: string, @CurrentUser() user: User) {
    return this.webhookService.getWebhookStats(id, user.tenantId);
  }

  /**
   * Get overall webhook statistics
   */
  @Get("stats/overall")
  async getOverallStats(@CurrentUser() user: User) {
    return this.webhookService.getOverallStats(user.tenantId);
  }
}
