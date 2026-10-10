import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KnowledgeBaseCategoryService } from '../src/modules/tickets/services/knowledge-base-category.service';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(KnowledgeBaseCategoryService);
    const dataSource = app.get(DataSource);

    // Get an admin user for "createdBy"
    const adminUser = await dataSource.getRepository(User).findOne({
        where: { email: 'hazar@affexai.com' } // Fallback to any user if specific admin not found
    }) || await dataSource.getRepository(User).findOne({});

    if (!adminUser) {
        console.error('No users found to assign as creator.');
        process.exit(1);
    }

    const categories = [
        {
            name: 'General',
            description: 'General information and FAQs',
            icon: 'info',
            color: 'blue',
            sortOrder: 1,
        },
        {
            name: 'Technical Support',
            description: 'Technical issues and troubleshooting',
            icon: 'settings',
            color: 'red',
            sortOrder: 2,
        },
        {
            name: 'Allplan Installation',
            description: 'Installation and setup guides',
            icon: 'download',
            color: 'green',
            sortOrder: 3,
        },
        {
            name: 'Licensing',
            description: 'License management and activation',
            icon: 'key',
            color: 'yellow',
            sortOrder: 4,
        },
        {
            name: 'BIM & Data Exchange',
            description: 'IFC, exports, and BIM workflows',
            icon: 'share-2',
            color: 'purple',
            sortOrder: 5,
        },
    ];

    console.log('Seeding Knowledge Base Categories...');

    for (const cat of categories) {
        console.log(`Creating: ${cat.name}`);
        try {
            await service.createCategory(cat, adminUser.id);
            console.log('Done.');
        } catch (e) {
            console.error(`Error creating ${cat.name}:`, e.message);
        }
    }

    await app.close();
    process.exit(0);
}

bootstrap();
