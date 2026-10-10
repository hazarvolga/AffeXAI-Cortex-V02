import { SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor } from '../../core/auth/socket/socket-identity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { User } from '../users/entities/user.entity';
import { TenantModule } from '../../core/tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    TenantModule,
  ],
  providers: [SocketIdentityService, SocketAuthGuard, SocketTenantInterceptor,NotificationsGateway, NotificationsService],
  exports: [NotificationsService, NotificationsGateway],
  controllers: [NotificationsController],
})
export class NotificationsModule { }
