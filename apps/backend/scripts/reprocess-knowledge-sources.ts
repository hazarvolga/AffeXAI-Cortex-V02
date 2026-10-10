import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KnowledgeSourcesService } from '../src/modules/knowledge-sources/services/knowledge-sources.service';
import { KnowledgeSourceStatus } from '../src/modules/knowledge-sources/entities/enums/knowledge-source-status.enum';
import { DataSource } from 'typeorm';
import { CompanyKnowledgeSource } from '../src/modules/knowledge-sources/entities/company-knowledge-source.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(KnowledgeSourcesService);
    const dataSource = app.get(DataSource);

    console.log('Searching for PENDING knowledge sources...');

    const pendingSources = await dataSource.getRepository(CompanyKnowledgeSource).find({
        where: { status: KnowledgeSourceStatus.PENDING }
    });

    console.log(`Found ${pendingSources.length} pending sources.`);

    for (const source of pendingSources) {
        console.log(`Processing: ${source.title} (${source.id})...`);
        try {
            await service.processKnowledgeSource(source.id);
            console.log('Done.');
        } catch (e) {
            console.error(`Error processing ${source.id}:`, e);
        }
    }

    await app.close();
    process.exit(0);
}

bootstrap();
