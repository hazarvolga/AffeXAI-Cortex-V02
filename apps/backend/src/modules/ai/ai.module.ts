import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { CommerceModule } from '../commerce/commerce.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiProviderController } from './ai-provider.controller';
import { AiProviderHealthService } from './ai-provider-health.service';
import { AiRoutingService } from './ai-routing.service';
import { AiEmailService } from './ai-email.service';
import { TokenMeterService } from './token-meter.service';
import { TokenUsage } from './entities/token-usage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenUsage]),
    SettingsModule,
    CommerceModule,
  ],
  controllers: [AiController, AiProviderController],
  providers: [AiService, AiRoutingService, AiEmailService, TokenMeterService, AiProviderHealthService],
  exports: [AiService, AiRoutingService, AiEmailService, TokenMeterService, AiProviderHealthService],
})
export class AiModule { }
