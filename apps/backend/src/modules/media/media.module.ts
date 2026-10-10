import { Module, forwardRef } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { S3Service } from './s3.service';
import { SettingsModule } from '../settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { MulterModule } from '@nestjs/platform-express';
import { PlatformIntegrationModule } from '../platform-integration/platform-integration.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../../core/auth/auth.module';
import { TenantModule } from '../../core/tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    MulterModule.register({
      dest: './uploads',
    }),
    forwardRef(() => PlatformIntegrationModule),
    forwardRef(() => SettingsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    TenantModule,
  ],
  providers: [MediaService, S3Service],
  controllers: [MediaController],
  exports: [S3Service, MediaService],
})
export class MediaModule { }