import { siteSettingsData } from '@/lib/site-settings-data';

// Get base URL for media files - use env variable for production support
function getMediaBaseUrl(): string {
  // NEXT_PUBLIC_API_URL ends with /api, we need to remove it for media URLs
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

/**
 * Get the logo URL for the client components
 * This function handles both media IDs and direct URLs
 * @param isDarkMode Whether to get the dark mode logo
 * @returns The logo URL or a fallback placeholder
 */
export function getLogoUrl(isDarkMode: boolean = false): string {
  try {
    // Check if we have a media ID for the logo
    const logoId = isDarkMode ? siteSettingsData.logoDarkId : siteSettingsData.logoId;

    if (logoId) {
      // Return the media URL directly
      return `${getMediaBaseUrl()}/uploads/${logoId}`;
    }
    
    // Fallback to the direct URL if available
    if (isDarkMode && siteSettingsData.logoDarkUrl) {
      return siteSettingsData.logoDarkUrl;
    }
    
    if (!isDarkMode && siteSettingsData.logoUrl) {
      return siteSettingsData.logoUrl;
    }
    
    // Default placeholder
    return isDarkMode 
      ? 'https://placehold.co/140x40/171717/f0f0f0?text=Logo' 
      : 'https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo';
  } catch (error) {
    console.error('Error getting logo URL:', error);
    // Return fallback placeholder
    return isDarkMode 
      ? 'https://placehold.co/140x40/171717/f0f0f0?text=Logo' 
      : 'https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo';
  }
}

/**
 * Get the company name from site settings
 * @returns The company name
 */
export function getCompanyName(): string {
  return siteSettingsData.companyName || 'XYZ Company';
}