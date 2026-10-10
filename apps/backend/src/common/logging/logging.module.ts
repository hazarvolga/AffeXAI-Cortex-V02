import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemLog } from '../entities/system-log.entity';
import { AppLoggerService } from './app-logger.service';

@Global() // Make it globally available
@Module({
  imports: [TypeOrmModule.forFeature([SystemLog])],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggingModule {}
