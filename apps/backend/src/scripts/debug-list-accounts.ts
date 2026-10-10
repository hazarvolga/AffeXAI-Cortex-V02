
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { SocialAccount } from '../modules/social-media/entities/social-account.entity';

async function listAccounts() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const repo = dataSource.getRepository(SocialAccount);

    console.log('🔍 Querying Social Accounts...');
    const accounts = await repo.find();

    console.log(`Found ${accounts.length} accounts.`);
    accounts.forEach(acc => {
        console.log(`- ID: ${acc.id}, Provider: ${acc.provider}, User: ${acc.userId}, Tenant: ${acc.tenantId}, Username: ${acc.username}`);
    });

    await app.close();
}

listAccounts().catch(console.error);
