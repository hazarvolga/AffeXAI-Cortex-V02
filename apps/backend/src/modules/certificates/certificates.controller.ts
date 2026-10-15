import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CertificatesService } from "./certificates.service";
import { CertificatesServiceV2 } from "./certificates-v2.service";
import { CreateCertificateDto } from "./dto/create-certificate.dto";
import { UpdateCertificateDto } from "./dto/update-certificate.dto";
import { BulkImportCertificateDto } from "./dto/bulk-import.dto";
import { CreateCertificateTemplateDto } from "./dto/create-template.dto";
import { UpdateCertificateTemplateDto } from "./dto/update-template.dto";
import { GenerateCertificateDto } from "./dto/generate-certificate.dto";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../../core/auth/guards/platform-admin.guard";
import { PermissionsGuard } from "../../core/auth/guards/permissions.guard";
import { RequirePermissions } from "../../core/auth/decorators/permissions.decorator";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";
import type { Multer } from "multer";

@Controller("certificates")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly certificatesServiceV2: CertificatesServiceV2,
  ) {}

  // ============ CERTIFICATE ENDPOINTS (V2) ============

  @Post("v2")
  @RequirePermissions("certificates.create")
  createV2(@CurrentUser() user: User, @Body() dto: CreateCertificateDto) {
    return this.certificatesServiceV2.createCertificate(dto, user.tenantId);
  }

  @Get("v2")
  @RequirePermissions("certificates.view")
  findAllV2(@CurrentUser() user: User, @Query("userId") userId?: string) {
    return this.certificatesServiceV2.findAllCertificates(
      user.tenantId,
      userId,
    );
  }

  @Get("v2/statistics")
  @RequirePermissions("certificates.view")
  getStatistics(@CurrentUser() user: User, @Query("userId") userId?: string) {
    return this.certificatesServiceV2.getStatistics(user.tenantId, userId);
  }

  @Get("v2/:id")
  @RequirePermissions("certificates.view")
  findOneV2(@CurrentUser() user: User, @Param("id") id: string) {
    return this.certificatesServiceV2.findOneCertificate(id, user.tenantId);
  }

  @Patch("v2/:id")
  @RequirePermissions("certificates.update")
  updateV2(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateCertificateDto,
  ) {
    return this.certificatesServiceV2.updateCertificate(id, user.tenantId, dto);
  }

  @Delete("v2/:id")
  @RequirePermissions("certificates.revoke")
  removeV2(@CurrentUser() user: User, @Param("id") id: string) {
    return this.certificatesServiceV2.deleteCertificate(id, user.tenantId);
  }

  @Post("v2/:id/generate-pdf")
  @RequirePermissions("certificates.update")
  async generatePdfV2(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: { regenerate?: boolean } = {},
  ) {
    const pdfUrl = await this.certificatesServiceV2.generatePdf(
      id,
      user.tenantId,
      dto.regenerate,
    );
    return { pdfUrl };
  }

  @Post("v2/:id/send-email")
  @RequirePermissions("certificates.update")
  async sendEmailV2(@CurrentUser() user: User, @Param("id") id: string) {
    await this.certificatesServiceV2.sendEmail(id, user.tenantId);
    return { message: "Email sent successfully" };
  }

  @Post("v2/:id/generate-and-send")
  @RequirePermissions("certificates.update")
  async generateAndSendV2(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: GenerateCertificateDto,
  ) {
    const result = await this.certificatesServiceV2.generateAndSendCertificate(
      id,
      user.tenantId,
      {
        sendEmail: dto.sendEmail,
        regenerate: dto.regenerate,
      },
    );
    return result;
  }

  // ============ TEMPLATE ENDPOINTS ============
  // Templates are shared by every tenant (no tenant column), so only platform admins change them.

  @Post("templates")
  @UseGuards(PlatformAdminGuard)
  createTemplate(@Body() dto: CreateCertificateTemplateDto) {
    return this.certificatesServiceV2.createTemplate(dto);
  }

  @Get("templates")
  @RequirePermissions("certificates.view")
  findAllTemplates() {
    return this.certificatesServiceV2.findAllTemplates();
  }

  @Get("templates/:id")
  @RequirePermissions("certificates.view")
  findOneTemplate(@Param("id") id: string) {
    return this.certificatesServiceV2.findOneTemplate(id);
  }

  // The admin screen saves with PUT; PATCH stays for existing callers.
  @Put("templates/:id")
  @UseGuards(PlatformAdminGuard)
  replaceTemplate(
    @Param("id") id: string,
    @Body() dto: UpdateCertificateTemplateDto,
  ) {
    return this.certificatesServiceV2.updateTemplate(id, dto);
  }

  @Patch("templates/:id")
  @UseGuards(PlatformAdminGuard)
  updateTemplate(
    @Param("id") id: string,
    @Body() dto: UpdateCertificateTemplateDto,
  ) {
    return this.certificatesServiceV2.updateTemplate(id, dto);
  }

  @Delete("templates/:id")
  @UseGuards(PlatformAdminGuard)
  removeTemplate(@Param("id") id: string) {
    return this.certificatesServiceV2.deleteTemplate(id);
  }

  // ============ OLD ENDPOINTS (Backward Compatibility) ============
  // These read and write certificates without any tenant scope; no screen uses them.
  // Platform admins only until they are removed (Sprint 4).

  @Post()
  @UseGuards(PlatformAdminGuard)
  @UseInterceptors(FileInterceptor("file"))
  create(
    @UploadedFile() file: any,
    @Body() createCertificateDto: CreateCertificateDto,
  ) {
    return this.certificatesService.create(file, createCertificateDto);
  }

  @Get()
  @UseGuards(PlatformAdminGuard)
  findAll(@Query("userId") userId?: string) {
    return this.certificatesService.findAll(userId);
  }

  @Get(":id")
  @UseGuards(PlatformAdminGuard)
  findOne(@Param("id") id: string) {
    return this.certificatesService.findOne(id);
  }

  @Get(":id/pdf")
  @UseGuards(PlatformAdminGuard)
  async generatePdf(@Param("id") id: string): Promise<{ fileUrl: string }> {
    try {
      const fileUrl = await this.certificatesService.generateCertificatePdf(id);
      return { fileUrl };
    } catch (error) {
      throw error;
    }
  }

  @Patch(":id")
  @UseGuards(PlatformAdminGuard)
  @UseInterceptors(FileInterceptor("file"))
  update(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @Body() updateCertificateDto: UpdateCertificateDto,
  ) {
    return this.certificatesService.update(id, file, updateCertificateDto);
  }

  @Delete(":id")
  @UseGuards(PlatformAdminGuard)
  remove(@Param("id") id: string) {
    return this.certificatesService.remove(id);
  }

  @Post("bulk-import")
  @UseGuards(PlatformAdminGuard)
  async bulkImport(@Body() certificates: BulkImportCertificateDto[]) {
    return this.certificatesService.bulkImport(certificates);
  }
}
