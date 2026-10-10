import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CortexOutboxService } from './cortex-outbox.service';
import { CortexOutboxWorker } from './cortex-outbox.worker';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [CortexOutboxService, CortexOutboxWorker],
  exports: [CortexOutboxService],
})
export class CortexOutboxModule {}
