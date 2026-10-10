import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorSearchOptions {
    collection: string;
    vector: number[];
    limit?: number;
    filter?: any;
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
    private readonly logger = new Logger(VectorStoreService.name);
    private client: QdrantClient;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.connect();
    }

    private connect() {
        const url = this.configService.get<string>('QDRANT_URL') || 'http://localhost:6333';
        const apiKey = this.configService.get<string>('QDRANT_API_KEY');

        this.logger.log(`Connecting to Qdrant at ${url}...`);

        this.client = new QdrantClient({
            url,
            apiKey,
        });
    }

    async healthCheck(): Promise<boolean> {
        try {
            const collections = await this.client.getCollections();
            this.logger.log(`Qdrant Connected. Collections: ${collections.collections.length}`);
            return true;
        } catch (error) {
            this.logger.error('Qdrant Connection Failed', error);
            return false;
        }
    }

    async search(options: VectorSearchOptions) {
        const { collection, vector, limit = 5, filter } = options;
        try {
            return await this.client.query(collection, {
                params: {
                    hnsw_ef: 128,
                    exact: false,
                },
                query: vector,
                limit,
                filter,
            });
        } catch (error) {
            this.logger.error(`Search failed for collection ${collection}`, error);
            return [];
        }
    }

    async upsert(collection: string, points: any[]) {
        try {
            await this.client.upsert(collection, {
                wait: true,
                points,
            });
            this.logger.log(`Upserted ${points.length} points to ${collection}`);
        } catch (error) {
            this.logger.error(`Upsert failed for collection ${collection}`, error);
            throw error;
        }
    }

    async createCollection(collectionName: string, vectorSize = 1024) {
        try {
            const result = await this.client.getCollections();
            const exists = result.collections.some((c) => c.name === collectionName);

            if (!exists) {
                await this.client.createCollection(collectionName, {
                    vectors: {
                        size: vectorSize,
                        distance: 'Cosine',
                    },
                });
                this.logger.log(`Created collection: ${collectionName}`);
            }
        } catch (error) {
            this.logger.error(`Failed to create collection ${collectionName}`, error);
        }
    }
}
