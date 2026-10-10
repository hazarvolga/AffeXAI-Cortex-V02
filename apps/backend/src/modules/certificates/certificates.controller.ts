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
  ParseUUIDPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CertificatesService } from './certificates.service';
import { CertificatesServiceV2 } from './certificates-v2.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { BulkImportCertificateDto } from './dto/bulk-import.dto';
import { CreateCertificateTemplateDto } from './dto/create-template.dto';
import { UpdateCertificateTemplateDto } from './dto/update-template.dto';
import { GenerateCertificateDto } from './dto/generate-certificate.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import type { Multer } from 'multer';

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly certificatesServiceV2: CertificatesServiceV2,
  ) { }

  // ============ CERTIFICATE ENDPOINTS (V2) ============

  @Post('v2')
  createV2(@CurrentUser() user: User, @Body() dto: CreateCertificateDto) {
    return this.certificatesServiceV2.createCertificate(dto, user.tenantId);
  }

  @Get('v2')
  findAllV2(@CurrentUser() user: User, @Query('userId') userId?: string) {
    return this.certificatesServiceV2.findAllCertificates(user.tenantId, userId);
  }

  @Get('v2/statistics')
  getStatistics(@Query('userId') userId?: string) {
    return this.certificatesServiceV2.getStatistics(userId);
  }

  @Get('v2/:id')
  findOneV2(@CurrentUser() user: User, @Param('id') id: string) {
    return this.certificatesServiceV2.findOneCertificate(id, user.tenantId);
  }

  @Patch('v2/:id')
  updateV2(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateCertificateDto) {
    return this.certificatesServiceV2.updateCertificate(id, user.tenantId, dto);
  }

  @Delete('v2/:id')
  removeV2(@CurrentUser() user: User, @Param('id') id: string) {
    return this.certificatesServiceV2.deleteCertificate(id, user.tenantId);
  }

  @Post('v2/:id/generate-pdf')
  async generatePdfV2(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: { regenerate?: boolean } = {},
  ) {
    const pdfUrl = await this.certificatesServiceV2.generatePdf(id, user.tenantId, dto.regenerate);
    return { pdfUrl };
  }

  @Post('v2/:id/send-email')
  async sendEmailV2(@CurrentUser() user: User, @Param('id') id: string) {
    await this.certificatesServiceV2.sendEmail(id, user.tenantId);
    return { message: 'Email sent successfully' };
  }

  @Post('v2/:id/generate-and-send')
  async generateAndSendV2(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: GenerateCertificateDto,
  ) {
    const result = await this.certificatesServiceV2.generateAndSendCertificate(id, user.tenantId, {
      sendEmail: dto.sendEmail,
      regenerate: dto.regenerate,
    });
    return result;
  }

  // ============ TEMPLATE ENDPOINTS ============

  @Post('templates')
  createTemplate(@Body() dto: CreateCertificateTemplateDto) {
    return this.certificatesServiceV2.createTemplate(dto);
  }

  @Get('templates')
  findAllTemplates() {
    return this.certificatesServiceV2.findAllTemplates();
  }

  @Get('templates/:id')
  findOneTemplate(@Param('id') id: string) {
    return this.certificatesServiceV2.findOneTemplate(id);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateCertificateTemplateDto) {
    return this.certificatesServiceV2.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  removeTemplate(@Param('id') id: string) {
    return this.certificatesServiceV2.deleteTemplate(id);
  }

  // ============ OLD ENDPOINTS (Backward Compatibility) ============

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: any,
    @Body() createCertificateDto: CreateCertificateDto,
  ) {
    return this.certificatesService.create(file, createCertificateDto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.certificatesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string): Promise<{ fileUrl: string }> {
    try {
      const fileUrl = await this.certificatesService.generateCertificatePdf(id);
      return { fileUrl };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() updateCertificateDto: UpdateCertificateDto,
  ) {
    return this.certificatesService.update(id, file, updateCertificateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.certificatesService.remove(id);
  }

  @Post('bulk-import')
  async bulkImport(@Body() certificates: BulkImportCertificateDto[]) {
    return this.certificatesService.bulkImport(certificates);
  }
}