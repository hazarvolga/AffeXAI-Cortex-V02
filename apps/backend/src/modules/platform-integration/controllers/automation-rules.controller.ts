import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../core/auth/guards/permissions.guard";
import { RequirePermissions } from "../../../core/auth/decorators/permissions.decorator";
import { CurrentUser } from "../../../core/auth/decorators/current-user.decorator";
import { PERMISSIONS } from "../../../lib/permissions";
import { User } from "../../users/entities/user.entity";
import {
  AutomationAction,
  AutomationActionType,
  AutomationRule,
} from "../entities/automation-rule.entity";
import { ActionImpactLevel } from "../entities/automation-approval.entity";
import { PlatformEventType } from "../entities/platform-event.entity";

const MAX_JSON_BYTES = 32_768;
const FORBIDDEN_JSON_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const ENABLED_ACTION_TYPES = new Set<AutomationActionType>([
  AutomationActionType.CREATE_CAMPAIGN,
  AutomationActionType.TRIGGER_WEBHOOK,
]);

class AutomationActionDto {
  @IsEnum(AutomationActionType)
  type: AutomationActionType;

  @IsObject()
  config: Record<string, unknown>;

  @IsInt()
  @Min(0)
  @Max(1000)
  order: number;
}

export class CreateAutomationRuleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsEnum(PlatformEventType)
  triggerEventType: PlatformEventType;

  @IsOptional()
  @IsObject()
  triggerConditions?: Record<string, unknown>;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AutomationActionDto)
  actions: AutomationActionDto[];

  @IsOptional()
  @IsInt()
  @Min(-1000)
  @Max(1000)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsEnum(ActionImpactLevel)
  impactLevel?: ActionImpactLevel;

  @IsOptional()
  @IsObject()
  autoApprovalConditions?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  authorizedApprovers?: string[];
}

export class UpdateAutomationRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PlatformEventType)
  triggerEventType?: PlatformEventType;

  @IsOptional()
  @IsObject()
  triggerConditions?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AutomationActionDto)
  actions?: AutomationActionDto[];

  @IsOptional()
  @IsInt()
  @Min(-1000)
  @Max(1000)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsEnum(ActionImpactLevel)
  impactLevel?: ActionImpactLevel;

  @IsOptional()
  @IsObject()
  autoApprovalConditions?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  authorizedApprovers?: string[];
}

type RuleInput = CreateAutomationRuleDto | UpdateAutomationRuleDto;
type SafeRuleChanges = Pick<
  AutomationRule,
  | "name"
  | "description"
  | "isActive"
  | "triggerEventType"
  | "triggerConditions"
  | "actions"
  | "priority"
  | "requiresApproval"
  | "impactLevel"
  | "autoApprovalConditions"
  | "authorizedApprovers"
>;

function assertSafeJson(value: unknown, label: string, depth = 0): void {
  if (depth > 8)
    throw new BadRequestException(`${label} exceeds maximum nesting depth`);
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    if (value.length > 100)
      throw new BadRequestException(`${label} contains too many items`);
    value.forEach((entry) => assertSafeJson(entry, label, depth + 1));
    return;
  }
  if (
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new BadRequestException(`${label} must contain plain JSON values`);
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 100)
    throw new BadRequestException(`${label} contains too many keys`);
  for (const [key, entry] of entries) {
    if (!key || key.length > 128 || FORBIDDEN_JSON_KEYS.has(key)) {
      throw new BadRequestException(`${label} contains an unsafe key`);
    }
    assertSafeJson(entry, label, depth + 1);
  }
}

function safeRuleChanges(
  input: RuleInput,
  creating: boolean,
): Partial<SafeRuleChanges> {
  if (
    creating &&
    (!input.name?.trim() || !input.triggerEventType || !input.actions?.length)
  ) {
    throw new BadRequestException(
      "name, triggerEventType and actions are required",
    );
  }
  if (
    input.triggerEventType !== undefined &&
    !Object.values(PlatformEventType).includes(input.triggerEventType)
  ) {
    throw new BadRequestException("Unsupported trigger event type");
  }
  if (
    input.impactLevel !== undefined &&
    !Object.values(ActionImpactLevel).includes(input.impactLevel)
  ) {
    throw new BadRequestException("Unsupported impact level");
  }
  if (input.triggerConditions !== undefined)
    assertSafeJson(input.triggerConditions, "triggerConditions");
  if (input.autoApprovalConditions !== undefined)
    assertSafeJson(input.autoApprovalConditions, "autoApprovalConditions");
  if (input.actions !== undefined) {
    if (
      !Array.isArray(input.actions) ||
      input.actions.length < 1 ||
      input.actions.length > 50
    ) {
      throw new BadRequestException(
        "actions must contain between 1 and 50 items",
      );
    }
    const orders = new Set<number>();
    for (const action of input.actions) {
      if (
        !action ||
        !Object.values(AutomationActionType).includes(action.type)
      ) {
        throw new BadRequestException("Unsupported automation action type");
      }
      if (action.type === AutomationActionType.SEND_EMAIL) {
        throw new BadRequestException(
          "email.send is unavailable until crash-safe idempotency is enabled",
        );
      }
      if (!ENABLED_ACTION_TYPES.has(action.type)) {
        throw new BadRequestException(
          `${action.type} is unavailable until its durable executor is implemented`,
        );
      }
      if (
        !Number.isInteger(action.order) ||
        action.order < 0 ||
        action.order > 1000 ||
        orders.has(action.order)
      ) {
        throw new BadRequestException(
          "Action order must be unique and between 0 and 1000",
        );
      }
      orders.add(action.order);
      assertSafeJson(action.config, "action config");
    }
  }
  if (Buffer.byteLength(JSON.stringify(input), "utf8") > MAX_JSON_BYTES) {
    throw new BadRequestException("Automation rule payload is too large");
  }
  if (input.requiresApproval === false) {
    throw new BadRequestException(
      "Every enabled automation action requires approval",
    );
  }
  if (input.impactLevel === ActionImpactLevel.LOW) {
    throw new BadRequestException(
      "Enabled automation actions require at least medium impact",
    );
  }
  if (input.impactLevel === ActionImpactLevel.CRITICAL) {
    throw new BadRequestException(
      "Critical automation is unavailable until fresh MFA approval is implemented",
    );
  }
  if (input.autoApprovalConditions !== undefined) {
    throw new BadRequestException(
      "Auto-approval is unavailable for enabled automation actions",
    );
  }

  const changes: Partial<SafeRuleChanges> = {};
  if (input.name !== undefined) changes.name = input.name.trim();
  if (input.description !== undefined)
    changes.description = input.description.trim();
  if (input.isActive !== undefined) changes.isActive = input.isActive;
  if (input.triggerEventType !== undefined)
    changes.triggerEventType = input.triggerEventType;
  if (input.triggerConditions !== undefined)
    changes.triggerConditions = input.triggerConditions;
  if (input.actions !== undefined)
    changes.actions = input.actions as AutomationAction[];
  if (input.priority !== undefined) changes.priority = input.priority;
  if (creating || input.requiresApproval !== undefined)
    changes.requiresApproval = true;
  if (creating || input.impactLevel !== undefined)
    changes.impactLevel = input.impactLevel ?? ActionImpactLevel.MEDIUM;
  if (input.authorizedApprovers !== undefined)
    changes.authorizedApprovers = [...new Set(input.authorizedApprovers)];
  return changes;
}

@Controller("automation/rules")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
export class AutomationRulesController {
  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepository: Repository<AutomationRule>,
  ) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.ruleRepository.find({
      where: { tenantId: user.tenantId } as any,
      order: { createdAt: "DESC" },
    });
  }

  @Get("active")
  findActive(@CurrentUser() user: User) {
    return this.ruleRepository.find({
      where: { isActive: true, tenantId: user.tenantId } as any,
      order: { priority: "DESC" },
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.ruleRepository.findOne({
      where: { id, tenantId: user.tenantId } as any,
    });
  }

  @Post()
  create(@Body() data: CreateAutomationRuleDto, @CurrentUser() user: User) {
    const rule = this.ruleRepository.create({
      ...safeRuleChanges(data, true),
      tenantId: user.tenantId,
    });
    return this.ruleRepository.save(rule);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() data: UpdateAutomationRuleDto,
    @CurrentUser() user: User,
  ) {
    await this.ruleRepository.update(
      { id, tenantId: user.tenantId } as any,
      safeRuleChanges(data, false),
    );
    return this.ruleRepository.findOne({
      where: { id, tenantId: user.tenantId } as any,
    });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @CurrentUser() user: User) {
    await this.ruleRepository.softDelete({
      id,
      tenantId: user.tenantId,
    } as any);
    return { success: true };
  }

  @Put(":id/toggle")
  async toggle(@Param("id") id: string, @CurrentUser() user: User) {
    const rule = await this.ruleRepository.findOne({
      where: { id, tenantId: user.tenantId } as any,
    });
    if (!rule) throw new NotFoundException(`Rule not found: ${id}`);
    return this.ruleRepository.save({ ...rule, isActive: !rule.isActive });
  }
}
