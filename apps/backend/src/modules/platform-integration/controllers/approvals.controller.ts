import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  AutomationApproval,
  ApprovalStatus,
} from "../entities/automation-approval.entity";
import { AutomationRule } from "../entities/automation-rule.entity";
import { AutomationExecutorService } from "../services/automation-executor.service";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../core/auth/guards/permissions.guard";
import { RequirePermissions } from "../../../core/auth/decorators/permissions.decorator";
import { CurrentUser } from "../../../core/auth/decorators/current-user.decorator";
import { PERMISSIONS } from "../../../lib/permissions";
import { User } from "../../users/entities/user.entity";

class ApprovalDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

@Controller("automation/approvals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.AUTOMATION_APPROVE)
export class ApprovalsController {
  constructor(
    @InjectRepository(AutomationApproval)
    private readonly approvalRepository: Repository<AutomationApproval>,
    private readonly executorService: AutomationExecutorService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.approvalRepository.find({
      where: { tenantId: user.tenantId } as any,
      order: { createdAt: "DESC" },
      relations: ["rule"],
    });
  }

  @Get("pending")
  findPending(@CurrentUser() user: User) {
    return this.approvalRepository.find({
      where: { status: ApprovalStatus.PENDING, tenantId: user.tenantId } as any,
      order: { priority: "ASC", createdAt: "ASC" },
      relations: ["rule"],
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.approvalRepository.findOne({
      where: { id, tenantId: user.tenantId } as any,
      relations: ["rule", "event"],
    });
  }

  @Post(":id/approve")
  async approve(
    @Param("id") id: string,
    @Body() body: ApprovalDecisionDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.recordDecision(
      id,
      user,
      "approved",
      body.comment,
    );
    if (result.shouldExecute) {
      await this.executorService.executeApprovedAutomation(id, user.tenantId);
    }
    return result.approval;
  }

  @Post(":id/reject")
  async reject(
    @Param("id") id: string,
    @Body() body: ApprovalDecisionDto,
    @CurrentUser() user: User,
  ) {
    return (await this.recordDecision(id, user, "rejected", body.comment))
      .approval;
  }

  @Get("stats/overview")
  async getStats(@CurrentUser() user: User) {
    const all = await this.approvalRepository.find({
      where: { tenantId: user.tenantId } as any,
    });
    return {
      total: all.length,
      pending: all.filter(
        (approval) => approval.status === ApprovalStatus.PENDING,
      ).length,
      approved: all.filter(
        (approval) => approval.status === ApprovalStatus.APPROVED,
      ).length,
      rejected: all.filter(
        (approval) => approval.status === ApprovalStatus.REJECTED,
      ).length,
      expired: all.filter(
        (approval) => approval.status === ApprovalStatus.EXPIRED,
      ).length,
    };
  }

  private async recordDecision(
    id: string,
    user: User,
    action: "approved" | "rejected",
    comment?: string,
  ): Promise<{ approval: AutomationApproval; shouldExecute: boolean }> {
    const actor = user as User & { isPlatformAdmin?: boolean };
    const isTenantOwner = user.roleNames?.some(
      (name) => name.trim().toLowerCase() === "organization_owner",
    );
    if (actor.isPlatformAdmin !== true && !isTenantOwner) {
      throw new ForbiddenException(
        "Only the tenant owner can approve automation actions",
      );
    }
    const actorName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email ||
      user.id;

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(AutomationApproval);
      const approval = await repository.findOne({
        where: { id, tenantId: user.tenantId },
        lock: { mode: "pessimistic_write" },
      });
      if (!approval) throw new NotFoundException(`Approval not found: ${id}`);

      const rule = await manager.getRepository(AutomationRule).findOne({
        where: { id: approval.ruleId, tenantId: user.tenantId },
      });
      if (!rule)
        throw new NotFoundException(
          `Automation rule not found: ${approval.ruleId}`,
        );
      approval.rule = rule;

      const snapshottedApprovers = approval.requestContext?.authorizedApprovers;
      const authorizedApprovers = Array.isArray(snapshottedApprovers)
        ? snapshottedApprovers.filter(
            (candidate): candidate is string => typeof candidate === "string",
          )
        : [];
      if (
        authorizedApprovers.length > 0 &&
        !authorizedApprovers.includes(user.id)
      ) {
        throw new ForbiddenException(
          "User is not authorized to decide this automation",
        );
      }
      if (approval.requestedBy === user.id) {
        throw new ForbiddenException(
          "The automation requester cannot approve their own action",
        );
      }

      if (
        approval.status === ApprovalStatus.PENDING &&
        approval.expiresAt &&
        approval.expiresAt.getTime() <= Date.now()
      ) {
        throw new ConflictException("Approval has expired");
      }

      // A provider/process failure after the approval commit must be retryable.
      // The executor action ledger supplies per-action idempotency.
      if (
        action === "approved" &&
        approval.status === ApprovalStatus.APPROVED &&
        !approval.isExecuted
      ) {
        return { approval, shouldExecute: true };
      }
      if (!approval.canApprove()) {
        throw new ConflictException(
          `Approval cannot be ${action}: ${approval.status}`,
        );
      }
      if (approval.approvalChain?.some((entry) => entry.userId === user.id)) {
        throw new ConflictException("User has already decided this approval");
      }

      approval.addApproval(
        user.id,
        actorName,
        action,
        comment?.trim() || undefined,
        undefined,
      );
      const saved = await repository.save(approval);
      return {
        approval: saved,
        shouldExecute:
          action === "approved" && saved.status === ApprovalStatus.APPROVED,
      };
    });
  }
}
