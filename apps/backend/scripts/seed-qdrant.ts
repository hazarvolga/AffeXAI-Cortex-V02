
import { QdrantClient } from '@qdrant/js-client-rest';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from ../.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seed() {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY;

    console.log(`🌱 Connecting to Qdrant at ${url}...`);

    const client = new QdrantClient({ url, apiKey });

    try {
        const collections = await client.getCollections();
        console.log('✅ Connection Successful!');
        console.log('📚 Existing Collections:', collections.collections.map(c => c.name).join(', '));

        const COLLECTION_NAME = 'brand_intelligence_signals';

        // Check if collection exists
        const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
        if (!exists) {
            console.log(`Creating collection: ${COLLECTION_NAME}...`);
            await client.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: 1024, // Matches our dummy vector size
                    distance: 'Cosine',
                },
            });
            console.log('✅ Collection created.');
        } else {
            console.log('ℹ️ Collection already exists.');
        }

        // Ingest a test point
        console.log('Inserting test signal...');
        await client.upsert(COLLECTION_NAME, {
            wait: true,
            points: [
                {
                    id: 1,
                    vector: new Array(1024).fill(0.1),
                    payload: {
                        content: "AffeXAI Brand Identity: Bold, Editorial, Glassmorphic.",
                        type: "brand_voice",
                        timestamp: new Date().toISOString()
                    }
                }
            ]
        });
        console.log('✅ Test signal ingested successfully.');

    } catch (error) {
        console.error('❌ Qdrant Error:', error.message);
        process.exit(1);
    }
}

seed();
