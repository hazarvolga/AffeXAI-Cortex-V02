import { Module } from '@nestjs/common';
import { AuthUtilsService } from './auth-utils.service';
import { CacheService } from './services/cache.service';
import { KeyManagementService } from './services/key-management.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register()],
  providers: [AuthUtilsService, CacheService, KeyManagementService],
  exports: [AuthUtilsService, CacheService, KeyManagementService],
})
export class SharedModule { }