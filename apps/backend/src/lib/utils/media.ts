import mediaService, { Media } from '@/lib/api/mediaService';

// Cache for media items to avoid repeated API calls
const mediaCache = new Map<string, Media>();

/**
 * Get media URL from media ID
 * @param mediaId The ID of the media item
 * @returns The URL of the media item or null if not found
 */
export async function getMediaUrl(mediaId: string): Promise<string | null> {
  // Check cache first
  if (mediaCache.has(mediaId)) {
    const media = mediaCache.get(mediaId)!;
    return `http://localhost:9005${media.url}`;
  }

  try {
    // Fetch media from API
    const media = await mediaService.getMediaById(mediaId);
    
    // Cache the media item
    mediaCache.set(mediaId, media);
    
    return `http://localhost:9005${media.url}`;
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