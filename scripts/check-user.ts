import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../apps/backend/src/modules/users/entities/user.entity';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'affexai',
    entities: [User],
    synchronize: false,
});

async function checkUser() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const user = await AppDataSource.manager.findOne(User, {
            where: { email: 'superuser@affexai.com' },
        });

        if (user) {
            console.log('✅ User found:', user.email);
            console.log('ID:', user.id);
            console.log('Created At:', user.createdAt);
        } else {
            console.log('❌ User superuser@affexai.com NOT FOUND');
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUser();
