import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { CompanyKnowledgeSource } from './entities/company-knowledge-source.entity';

// External entities (dependencies)
import { User } from '../users/entities/user.entity';

// External modules
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';

// Services
import { KnowledgeSourcesService } from './services/knowledge-sources.service';
import { FileProcessingService } from './services/file-processing.service';
import { UrlProcessingService } from './services/url-processing.service';

// Controllers
import { KnowledgeSourcesController } from './controllers/knowledge-sources.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyKnowledgeSource,
      User,
    ]),
    UsersModule,
    MediaModule,
  ],
  controllers: [
    KnowledgeSourcesController,
  ],
  providers: [
    KnowledgeSourcesService,
    FileProcessingService,
    UrlProcessingService,
  ],
  exports: [
    KnowledgeSourcesService,
    FileProcessingService,
    UrlProcessingService,
  ],
})
export class KnowledgeSourcesModule { }
