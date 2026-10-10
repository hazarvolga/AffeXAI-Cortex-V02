import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NeuralCrawlerService } from './services/neural-crawler.service';
import { CrawlQueueService } from './services/crawl-queue.service';
import { IntelSearchService } from './services/intel-search.service';

import { NeuralCrawlerController } from './neural-crawler.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([Organization]),
        SettingsModule,
    ],
    controllers: [NeuralCrawlerController],
    providers: [NeuralCrawlerService, CrawlQueueService, IntelSearchService],
    exports: [NeuralCrawlerService],
})
export class NeuralCrawlerModule { }
