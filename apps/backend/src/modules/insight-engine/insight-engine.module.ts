import { Module, Global } from '@nestjs/common';
import { InsightEngineService } from './services/insight-engine.service';
import { InsightEngineController } from './insight-engine.controller';
import { StrategyModule } from '../strategy/strategy.module';

@Global()
@Module({
    imports: [StrategyModule],
    controllers: [InsightEngineController],
    providers: [InsightEngineService],
    exports: [InsightEngineService],
})
export class InsightEngineModule { }
