/**
 * Schema Index
 * Central registration point for all block schemas
 */

export * from './block-schema';
export * from './v2-schemas';

import { registerV2Schemas } from './v2-schemas';
import { getAllSchemas, type BlockSchema } from './block-schema';

let initialized = false;

/**
 * Initialize all block schemas
 * Call this once at app startup
 */
export function initializeBlockSchemas(): void {
    if (initialized) return;

    // Register V2 schemas (main blocks)
    registerV2Schemas();

    initialized = true;
    console.log('[CMS] Block schemas initialized');
}

/**
 * Get all block schemas as a Record
 * Compatible replacement for legacy allBlockConfigs
 */
export function getAllBlockSchemas(): Record<string, BlockSchema> {
    // Ensure schemas are initialized
    if (!initialized) {
        initializeBlockSchemas();
    }

    const schemas = getAllSchemas();
    const result: Record<string, BlockSchema> = {};

    for (const schema of schemas) {
        result[schema.type] = schema;
    }

    return result;
}

// Legacy compatibility export
export const allBlockSchemas = new Proxy({} as Record<string, BlockSchema>, {
    get(target, prop: string) {
        if (!initialized) {
            initializeBlockSchemas();
        }
        const schemas = getAllSchemas();
        const schema = schemas.find(s => s.type === prop);
        return schema || undefined;
    },
    ownKeys() {
        if (!initialized) {
            initializeBlockSchemas();
        }
        return getAllSchemas().map(s => s.type);
    },
    getOwnPropertyDescriptor(target, prop: string) {
        if (!initialized) {
            initializeBlockSchemas();
        }
        const schemas = getAllSchemas();
        const schema = schemas.find(s => s.type === prop);
        if (schema) {
            return { configurable: true, enumerable: true, value: schema };
        }
        return undefined;
    }
});
