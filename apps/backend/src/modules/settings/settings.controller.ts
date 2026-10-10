import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { Setting } from './entities/setting.entity';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../core/auth/guards/platform-admin.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { TenantService } from '../../core/tenant/tenant.service';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SiteSettingsDto } from './dto/site-settings.dto';
import { EmailSettingsDto, EmailSettingsMaskedDto } from './dto/email-settings.dto';
import { StorageSettingsDto, StorageSettingsMaskedDto } from './dto/storage-settings.dto';
import { AiSettingsDto, AiSettingsMaskedDto, AiConnectionTestDto } from './dto/ai-settings.dto';
import { DNSVerificationService, DomainVerificationResult } from './dns-verification.service';
import { ApiKeyDetector } from './utils/api-key-detector';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly dnsVerificationService: DNSVerificationService,
    private readonly tenantService: TenantService,
  ) { }

  private authenticatedTenant(user: { tenantId?: string }): string {
    if (!user?.tenantId) throw new UnauthorizedException('Verified tenant required');
    return user.tenantId;
  }

  private redactSetting(setting: Setting) {
    const { encryptedDek: _encryptedDek, ...safe } = setting;
    const sensitive = setting.isEncrypted || /password|secret|token|apikey|accesskey/i.test(setting.key);
    return { ...safe, value: sensitive && setting.value ? '***' : setting.value };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async create(@Body() createSettingDto: CreateSettingDto, @CurrentUser() user: any) {
    void createSettingDto;
    this.authenticatedTenant(user);
    throw new BadRequestException('Generic setting writes are disabled; use a typed settings endpoint');
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async findAll(@CurrentUser() user: any) {
    const tenantId = this.authenticatedTenant(user);
    return (await this.settingsService.findAll(tenantId)).map(setting => this.redactSetting(setting));
  }

  @Get('revision')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async getRevision(@CurrentUser() user: { tenantId: string }) {
    return { revision: await this.settingsService.getRevision(this.authenticatedTenant(user)) };
  }

  @Get('platform')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async findAllPlatform() {
    return (await this.settingsService.findAllPlatform()).map(setting => this.redactSetting(setting));
  }

  @Get('platform/revision')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async getPlatformRevision() {
    return { revision: await this.settingsService.getPlatformRevision() };
  }

  @Put('platform')
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  async updatePlatformSetting(@Body() dto: CreateSettingDto, @CurrentUser() user: { id: string }) {
    void dto;
    void user;
    throw new BadRequestException('Platform setting writes are disabled until an effective consumer registry exists');
  }

  @Get('individual/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const tenantId = this.authenticatedTenant(user);
    return this.redactSetting(await this.settingsService.findOne(id, tenantId));
  }

  @Put('individual/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async update(@Param('id') id: string, @Body() updateSettingDto: UpdateSettingDto, @CurrentUser() user: any) {
    void id;
    void updateSettingDto;
    this.authenticatedTenant(user);
    throw new BadRequestException('Generic setting writes are disabled; use a typed settings endpoint');
  }

  @Delete('individual/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    void id;
    this.authenticatedTenant(user);
    throw new BadRequestException('Generic setting writes are disabled; use a typed settings endpoint');
  }

  // Site settings specific endpoints - Public read, Authenticated write
  @Get('site')
  async getSiteSettings() {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new BadRequestException('Explicit tenant selector required');
    const settings = await this.settingsService.getSiteSettings(tenantId);
    const { companyName, showPoweredBy, domain, logoUrl, logoDarkUrl, contact, socialMedia, seo } = settings;
    return { companyName, showPoweredBy, domain, logoUrl, logoDarkUrl, contact, socialMedia, seo };
  }

  @Get('site/admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  getAdministrativeSiteSettings(@CurrentUser() user: { tenantId: string }) {
    return this.settingsService.getSiteSettings(this.authenticatedTenant(user));
  }

  @Put('site')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  updateSiteSettings(
    @Body() siteSettingsDto: SiteSettingsDto,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    const tenantId = this.authenticatedTenant(user);
    return this.settingsService.updateSiteSettings(siteSettingsDto, tenantId, user.id);
  }

  // Email settings endpoints - Protected
  @Get('email')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async getEmailSettings(@CurrentUser() user: any): Promise<EmailSettingsMaskedDto> {
    const tenantId = this.authenticatedTenant(user);
    return this.settingsService.getEmailSettingsMasked(tenantId);
  }

  @Get('email/masked')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async getEmailSettingsMasked(@CurrentUser() user: any): Promise<EmailSettingsMaskedDto> {
    const tenantId = this.authenticatedTenant(user);
    return this.settingsService.getEmailSettingsMasked(tenantId);
  }

  @Put('email')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async updateEmailSettings(@Body() emailSettingsDto: EmailSettingsDto, @CurrentUser() user: { id: string; tenantId: string }): Promise<EmailSettingsMaskedDto> {
    const tenantId = this.authenticatedTenant(user);
    return EmailSettingsMaskedDto.mask(await this.settingsService.updateEmailSettings(emailSettingsDto, tenantId, user.id));
  }

  // Storage settings endpoints - Protected
  @Get('storage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async getStorageSettings(@CurrentUser() user: any): Promise<StorageSettingsMaskedDto> {
    const tenantId = this.authenticatedTenant(user);
    return this.settingsService.getStorageSettingsMasked(tenantId);
  }

  @Put('storage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async updateStorageSettings(@Body() storageSettingsDto: StorageSettingsDto, @CurrentUser() user: { id: string; tenantId: string }): Promise<StorageSettingsMaskedDto> {
    const tenantId = this.authenticatedTenant(user);
    return StorageSettingsMaskedDto.mask(await this.settingsService.updateStorageSettings(storageSettingsDto, tenantId, user.id));
  }

  // AI settings endpoints - Protected
  @Get('ai')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async getAiSettings(@CurrentUser() user: any): Promise<AiSettingsMaskedDto> {
    const tenantId = this.authenticatedTenant(user);
    return this.settingsService.getAiSettingsMasked(tenantId);
  }

  @Patch('ai')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async updateAiSettings(@Body() aiSettingsDto: AiSettingsDto, @CurrentUser() user: { id: string; tenantId: string }): Promise<AiSettingsMaskedDto> {
    const tenantId = this.authenticatedTenant(user);
    return AiSettingsMaskedDto.mask(await this.settingsService.updateAiSettings(aiSettingsDto, tenantId, user.id));
  }

  @Post('ai/test/:module')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async testAiConnection(
    @Param('module') module: 'emailMarketing' | 'social' | 'support' | 'analytics',
    @CurrentUser() user: any,
  ): Promise<AiConnectionTestDto> {
    const tenantId = this.authenticatedTenant(user);
    const { apiKey, model } = await this.settingsService.getAiModuleConfiguration(module, tenantId);

    if (!apiKey) {
      return {
        success: false,
        message: `No API key configured for ${module}`,
      };
    }

    return {
      success: false,
      message: 'API key is configured; provider connectivity has not been verified',
      model,
    };
  }

  @Post('ai/detect-provider')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async detectProvider(@Body() body: { apiKey: string }) {
    const detection = ApiKeyDetector.detect(body.apiKey);
    const availableModels = ApiKeyDetector.getAvailableModels(detection.provider);

    return {
      provider: detection.provider,
      providerName: ApiKeyDetector.getProviderDisplayName(detection.provider),
      defaultModel: detection.defaultModel,
      isValid: detection.isValid,
      detectionMethod: detection.detectionMethod,
      availableModels,
    };
  }

  // DNS Verification endpoints
  @Get('email/verify-dns')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async verifyDNS(
    @Query('domain') domain: string,
    @Query('provider') provider: string,
  ): Promise<DomainVerificationResult> {
    if (!domain || !provider) {
      throw new Error('Domain and provider parameters are required');
    }

    return this.dnsVerificationService.verifyDomain(domain, provider);
  }

  @Get('email/quick-check-dns')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.manage')
  async quickCheckDNS(@Query('domain') domain: string) {
    if (!domain) {
      throw new Error('Domain parameter is required');
    }

    return this.dnsVerificationService.quickCheck(domain);
  }
}
