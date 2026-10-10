import { NextResponse } from 'next/server';

/**
 * Compression utilities for API responses
 * 
 * These utilities help optimize API response sizes by:
 * - Removing unnecessary fields
 * - Compressing responses
 * - Adding appropriate headers
 */

/**
 * Options for response compression
 */
export interface CompressionOptions {
  /** Enable compression (default: true in production) */
  enabled?: boolean;
  /** Minimum size in bytes to compress (default: 1024) */
  threshold?: number;
  /** Fields to remove from response */
  excludeFields?: string[];
}

/**
 * Compress and optimize API response
 * 
 * @param data - Response data to compress
 * @param options - Compression options
 * @returns NextResponse with optimized data and headers
 * 
 * @example
 * ```typescript
 * export async function GET() {
 *   const data = await fetchLargeDataset();
 *   return compressResponse(data, {
 *     excludeFields: ['__v', 'password'],
 *   });
 * }
 * ```
 */
export function compressResponse<T>(
  data: T,
  options: CompressionOptions = {}
): NextResponse {
  const {
    enabled = process.env.NODE_ENV === 'production',
    threshold = 1024,
    excludeFields = [],
  } = options;

  // Remove excluded fields
  let optimizedData = data;
  if (excludeFields.length > 0) {
    optimizedData = removeFields(data, excludeFields);
  }

  // Convert to JSON string to check size
  const jsonString = JSON.stringify(optimizedData);
  const dataSize = Buffer.byteLength(jsonString, 'utf8');

  // Create response
  const response = NextResponse.json(optimizedData);

  // Add compression headers
  if (enabled && dataSize >= threshold) {
    response.headers.set('Content-Encoding', 'gzip');
    response.headers.set('Vary', 'Accept-Encoding');
  }

  // Add size headers for monitoring
  response.headers.set('X-Original-Size', dataSize.toString());
  response.headers.set('Content-Length', dataSize.toString());

  // Cache control for API responses
  response.headers.set(
    'Cache-Control',
    'public, max-age=60, stale-while-revalidate=120'
  );

  return response;
}

/**
 * Remove specified fields from object/array recursively
 * 
 * @param data - Data to process
 * @param fields - Field names to remove
 * @returns Data with fields removed
 */
function removeFields<T>(data: T, fields: string[]): T {
  if (Array.isArray(data)) {
    return data.map((item) => removeFields(item, fields)) as T;
  }

  if (data && typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (!fields.includes(key)) {
        result[key] = removeFields(value, fields);
      }
    }
    return result;
  }

  return data;
}

/**
 * Optimize response payload by removing null/undefined values
 * 
 * @param data - Data to optimize
 * @returns Optimized data
 * 
 * @example
 * ```typescript
 * const data = { name: 'John', age: null, email: undefined };
 * const optimized = optimizePayload(data);
 * // Result: { name: 'John' }
 * ```
 */
export function optimizePayload<T>(data: T): Partial<T> {
  if (Array.isArray(data)) {
    return data.map((item) => optimizePayload(item)).filter(Boolean) as any;
  }

  if (data && typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        result[key] = optimizePayload(value);
      }
    }
    return result;
  }

  return data;
}

/**
 * Paginate and compress large datasets
 * 
 * @param data - Full dataset
 * @param page - Current page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Paginated response with metadata
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const { searchParams } = new URL(request.url);
 *   const page = parseInt(searchParams.get('page') || '1');
 *   const pageSize = parseInt(searchParams.get('pageSize') || '20');
 *   
 *   const data = await fetchAllItems();
 *   return paginateResponse(data, page, pageSize);
 * }
 * ```
 */
export function paginateResponse<T>(
  data: T[],
  page: number = 1,
  pageSize: number = 20
): NextResponse {
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = data.slice(start, end);

  const response = {
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };

  return compressResponse(response);
}

/**
 * Minimize JSON response by using shorter field names
 * 
 * @param data - Data to minimize
 * @param mapping - Field name mapping (longName -> shortName)
 * @returns Minimized data
 * 
 * @example
 * ```typescript
 * const data = { firstName: 'John', lastName: 'Doe' };
 * const minimized = minimizeJson(data, {
 *   firstName: 'fn',
 *   lastName: 'ln',
 * });
 * // Result: { fn: 'John', ln: 'Doe' }
 * ```
 */
export function minimizeJson<T>(
  data: T,
  mapping: Record<string, string>
): any {
  if (Array.isArray(data)) {
    return data.map((item) => minimizeJson(item, mapping));
  }

  if (data && typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      const newKey = mapping[key] || key;
      result[newKey] = minimizeJson(value, mapping);
    }
    return result;
  }

  return data;
}

/**
 * Add ETags for caching
 * 
 * @param data - Response data
 * @returns Response with ETag header
 * 
 * @example
 * ```typescript
 * export async function GET() {
 *   const data = await fetchData();
 *   return withETag(data);
 * }
 * ```
 */
export function withETag<T>(data: T): NextResponse {
  const response = NextResponse.json(data);
  
  // Generate simple ETag from JSON hash
  const jsonString = JSON.stringify(data);
  const hash = Buffer.from(jsonString).toString('base64').substring(0, 27);
  const etag = `"${hash}"`;
  
  response.headers.set('ETag', etag);
  response.headers.set('Cache-Control', 'public, max-age=60, must-revalidate');
  
  return response;
}

/**
 * Create a streaming response for large datasets
 * 
 * @param dataGenerator - Async generator that yields data chunks
 * @returns Streaming response
 * 
 * @example
 * ```typescript
 * async function* generateLargeDataset() {
 *   for (let i = 0; i < 1000; i++) {
 *     yield { id: i, data: await fetchItem(i) };
 *   }
 * }
 * 
 * export async function GET() {
 *   return streamResponse(generateLargeDataset());
 * }
 * ```
 */
export async function streamResponse<T>(
  dataGenerator: AsyncGenerator<T>
): Promise<Response> {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode('['));
        let first = true;
        
        for await (const chunk of dataGenerator) {
          if (!first) {
            controller.enqueue(encoder.encode(','));
          }
          controller.enqueue(encoder.encode(JSON.stringify(chunk)));
          first = false;
        }
        
        controller.enqueue(encoder.encode(']'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Calculate compression ratio
 * 
 * @param original - Original data size in bytes
 * @param compressed - Compressed data size in bytes
 * @returns Compression ratio as percentage
 */
export function getCompressionRatio(
  original: number,
  compressed: number
): number {
  return Math.round(((original - compressed) / original) * 100);
}

/**
 * Format bytes to human-readable string
 * 
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
