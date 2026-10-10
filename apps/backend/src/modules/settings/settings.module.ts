import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { Setting } from './entities/setting.entity';
import { SettingAuditLog } from './entities/setting-audit-log.entity';
import { SettingRevision } from './entities/setting-revision.entity';
import { DNSVerificationService } from './dns-verification.service';
import { KeyManagementService } from '../../core/shared/services/key-management.service';
import { TenantModule } from '../../core/tenant/tenant.module';
import { CommerceModule } from '../commerce/commerce.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setting, SettingAuditLog, SettingRevision]),
    TenantModule,
    forwardRef(() => CommerceModule),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, DNSVerificationService, KeyManagementService],
  exports: [SettingsService, DNSVerificationService, KeyManagementService],
})
export class SettingsModule { }
