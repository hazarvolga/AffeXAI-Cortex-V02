import { Module, forwardRef } from '@nestjs/common';
import { TrustService } from './trust.service';
import { TrustController } from './trust.controller';
import { PredictionEngine } from './prediction.engine';
import { BrandModule } from '../brand/brand.module';
import { AuthModule } from '../../core/auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        BrandModule,
        forwardRef(() => AuthModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [TrustController],
    providers: [TrustService, PredictionEngine],
    exports: [TrustService],
})
export class TrustDynamicsModule { }
