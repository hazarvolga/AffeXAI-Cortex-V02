import { Module } from '@nestjs/common';
import { DatabaseImportService } from './database-import.service';

@Module({
  // Maintenance services are intentionally not exposed through HTTP.
  controllers: [],
  providers: [DatabaseImportService],
})
export class DatabaseImportModule { }
