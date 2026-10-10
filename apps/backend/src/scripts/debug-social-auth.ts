
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { TwitterProvider } from '../modules/social-media/providers/twitter.provider';
import { Logger } from '@nestjs/common';

async function debugSocialAuth() {
    // Load .env
    dotenv.config();

    console.log('🔍 Debugging Social Auth (Twitter)...');

    // Mock ConfigService
    const configService = {
        get: (key: string) => {
            const val = process.env[key];
            console.log(`ConfigService.get('${key}') -> ${val ? 'Creating...' : 'MISSING'}`);
            // Return raw value (string or undefined)
            return val;
        }
    } as unknown as ConfigService;

    const provider = new TwitterProvider(configService);

    try {
        console.log('Attempting to generate Auth URL...');
        const url = provider.getAuthUrl('http://localhost:3000/callback');
        console.log('✅ Success! URL:', url);
    } catch (error: any) {
        console.error('❌ Failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response);
        }
    }
}

debugSocialAuth().catch(console.error);
