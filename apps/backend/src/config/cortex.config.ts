import { registerAs } from '@nestjs/config';

export default registerAs('cortex', () => ({
    url: process.env.CORTEX_URL || 'http://localhost:8000',
    serviceSecret: process.env.CORTEX_SERVICE_SECRET || '',
}));
