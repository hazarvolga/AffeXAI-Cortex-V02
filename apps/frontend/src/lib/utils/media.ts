import mediaService, { Media } from '@/lib/api/mediaService';

// Cache for media items to avoid repeated API calls
const mediaCache = new Map<string, Media>();

// Get base URL for media files - use env variable for production support
function getMediaBaseUrl(): string {
  // NEXT_PUBLIC_API_URL ends with /api, we need to remove it for media URLs
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

/**
 * Get media URL from media ID
 * @param mediaId The ID of the media item
 * @returns The URL of the media item or null if not found
 */
export async function getMediaUrl(mediaId: string): Promise<string | null> {
  // Check cache first
  if (mediaCache.has(mediaId)) {
    const media = mediaCache.get(mediaId)!;
    return `${getMediaBaseUrl()}${media.url}`;
  }

  try {
    // Fetch media from API
    const media = await mediaService.getMediaById(mediaId);

    // Cache the media item
    mediaCache.set(mediaId, media);

    return `${getMediaBaseUrl()}${media.url}`;
  } catch (error) {
    console.error('Error fetching media:', error);
    return null;
  }
}

/**
 * Get media item from media ID
 * @param mediaId The ID of the media item
 * @returns The media item or null if not found
 */
export async function getMedia(mediaId: string): Promise<Media | null> {
  // Check cache first
  if (mediaCache.has(mediaId)) {
    return mediaCache.get(mediaId)!;
  }

  try {
    // Fetch media from API
    const media = await mediaService.getMediaById(mediaId);
    
    // Cache the media item
    mediaCache.set(mediaId, media);
    
    return media;
  } catch (error) {
    console.error('Error fetching media:', error);
    return null;
  }
}

/**
 * Clear the media cache
 */
export function clearMediaCache(): void {
  mediaCache.clear();
}