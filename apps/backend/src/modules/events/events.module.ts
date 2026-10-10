import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { SharedModule } from '../../core/shared/shared.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { PlatformIntegrationModule } from '../platform-integration/platform-integration.module';
import { AuthModule } from '../../core/auth/auth.module';
import { UsersModule } from '../users/users.module';
import { forwardRef } from '@nestjs/common';
import { TenantModule } from '../../core/tenant/tenant.module';
import { StrategyModule } from '../strategy/strategy.module';
import { CommerceModule } from '../commerce/commerce.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventRegistration]),
    SharedModule,
    CertificatesModule, // Import to use BulkCertificateService
    PlatformIntegrationModule, // Import to use EventBusService
    AuthModule,
    forwardRef(() => UsersModule),
    TenantModule,
    StrategyModule,
    CommerceModule,

  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule { }