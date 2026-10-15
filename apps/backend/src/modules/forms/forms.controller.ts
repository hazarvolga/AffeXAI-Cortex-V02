import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  ParseUUIDPipe,
} from "@nestjs/common";
import { FormsService } from "./forms.service";
import { CreateFormDto, UpdateFormDto, SubmitFormDto } from "./dto/form.dto";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { Request } from "express";
import { PermissionsGuard } from "../../core/auth/guards/permissions.guard";
import { RequirePermissions } from "../../core/auth/decorators/permissions.decorator";
import { PERMISSIONS } from "../../core/auth/permissions";
import { Throttle } from "@nestjs/throttler";
import { TenantSlugPipe } from "./tenant-slug.pipe";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    id: string;
  };
}

@Controller("forms")
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.FORMS_VIEW)
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.formsService.findAll(tenantId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.FORMS_VIEW)
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    return this.formsService.findOne(id, tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.FORMS_MANAGE)
  async create(
    @Body() createFormDto: CreateFormDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    return this.formsService.create(tenantId, createFormDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.FORMS_MANAGE)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateFormDto: UpdateFormDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    return this.formsService.update(id, tenantId, updateFormDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.FORMS_MANAGE)
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    await this.formsService.remove(id, tenantId);
    return { message: "Form archived successfully" };
  }

  @Get(":id/submissions")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.FORMS_SUBMISSIONS_VIEW)
  async getSubmissions(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    return this.formsService.findSubmissions(id, tenantId);
  }

  @Post(":id/publish")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.FORMS_MANAGE)
  async publish(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.formsService.publish(id, req.user.tenantId);
  }

  @Post(":id/unpublish")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.FORMS_MANAGE)
  async unpublish(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.formsService.unpublish(id, req.user.tenantId);
  }

  @Get("public/:tenantId/:id")
  async findPublished(
    @Param("tenantId", TenantSlugPipe) tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.formsService.findPublished(id, tenantId);
  }

  @Post("public/:tenantId/:id/submissions")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async submit(
    @Param("tenantId", TenantSlugPipe) tenantId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() submitFormDto: SubmitFormDto,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || "unknown";

    const submission = await this.formsService.submit(
      id,
      tenantId,
      submitFormDto,
      ipAddress,
      idempotencyKey,
    );
    return { submissionId: submission.id };
  }
}
