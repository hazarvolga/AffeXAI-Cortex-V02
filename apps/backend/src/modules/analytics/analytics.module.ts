import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { TenantModule } from '../../core/tenant/tenant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AnalyticsEvent,
  AnalyticsSession,
  AnalyticsHeatmap,
  ABTest,
  ABTestVariant,
  ComponentPerformance,
} from './entities';
import {
  AnalyticsTrackingService,
  AnalyticsDashboardService,
  ABTestingService,
  HeatmapService,
} from './services';
import {
  AnalyticsController,
  ABTestController,
} from './controllers';
import { UsersModule } from '../users/users.module';
import { SocialMediaModule } from '../social-media/social-media.module';
import { EmailMarketingModule } from '../email-marketing/email-marketing.module';
import { StrategyModule } from '../strategy/strategy.module';
import { CommerceModule } from '../commerce/commerce.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InsightGeneratorService } from './services/insight-generator.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalyticsEvent,
      AnalyticsSession,
      AnalyticsHeatmap,
      ABTest,
      ABTestVariant,
      ComponentPerformance,
    ]),
    forwardRef(() => UsersModule),
    AuthModule,
    TenantModule,
    SocialMediaModule,
    EmailMarketingModule,
    StrategyModule,
    CommerceModule,
    NotificationsModule,
    OrganizationsModule,
  ],
  controllers: [
    AnalyticsController,
    ABTestController,
  ],
  providers: [
    AnalyticsTrackingService,
    AnalyticsDashboardService,
    ABTestingService,
    HeatmapService,
    InsightGeneratorService,
  ],
  exports: [
    AnalyticsTrackingService,
    AnalyticsDashboardService,
    ABTestingService,
    HeatmapService,
  ],
})
export class AnalyticsModule { }
