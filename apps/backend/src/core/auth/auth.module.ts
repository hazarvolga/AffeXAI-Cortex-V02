import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../../modules/users/users.module';
import { MailModule } from '../../modules/mail/mail.module';
import { SettingsModule } from '../../modules/settings/settings.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwtConfiguration } from './jwt-configuration';
import { SharedModule } from '../../core/shared/shared.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../modules/roles/entities/role.entity';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => MailModule),
    SettingsModule,
    ConfigModule,
    SharedModule,
    TypeOrmModule.forFeature([Role]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => jwtConfiguration(
        config.get<string>('JWT_SECRET'),
        config.get<string>('PLATFORM_ADMIN_USER_IDS'),
      ),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule { }