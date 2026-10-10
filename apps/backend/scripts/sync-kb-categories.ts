import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KnowledgeBaseCategoryService } from '../src/modules/tickets/services/knowledge-base-category.service';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { TicketCategory } from '../src/modules/tickets/entities/ticket-category.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(KnowledgeBaseCategoryService);
    const dataSource = app.get(DataSource);

    // Get admin user
    const adminUser = await dataSource.getRepository(User).findOne({
        where: { email: 'hazar@affexai.com' }
    }) || await dataSource.getRepository(User).findOne({});

    if (!adminUser) {
        console.error('No users found.');
        process.exit(1);
    }

    // Get Ticket Categories
    console.log('Fetching Ticket Categories...');
    const ticketCategories = await dataSource.getRepository(TicketCategory).find({
        where: { isActive: true }
    });
    console.log(`Found ${ticketCategories.length} ticket categories.`);

    console.log('Syncing to Knowledge Base Categories...');

    for (const tCat of ticketCategories) {
        // Check if exists in KB by name
        const existing = await service.searchCategories(tCat.name);
        const alreadyExists = existing.some(k => k.name === tCat.name);

        if (!alreadyExists) {
            console.log(`Creating KB Category: ${tCat.name}`);
            try {
                await service.createCategory({
                    name: tCat.name,
                    description: tCat.description,
                    sortOrder: 0, // Default sort
                    color: 'blue', // Default color
                    icon: 'folder' // Default icon
                }, adminUser.id);
            } catch (e) {
                console.error(`Error creating ${tCat.name}:`, e.message);
            }
        } else {
            console.log(`Skipping ${tCat.name} (Already exists)`);
        }
    }

    await app.close();
    process.exit(0);
}

bootstrap();
