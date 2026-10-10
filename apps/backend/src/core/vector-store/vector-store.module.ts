import { Module, Global } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import { ConfigModule } from '../config/config.module';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [VectorStoreService],
    exports: [VectorStoreService],
})
export class VectorStoreModule { }
