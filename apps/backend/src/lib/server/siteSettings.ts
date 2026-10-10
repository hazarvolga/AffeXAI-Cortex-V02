import { siteSettingsData } from '../site-settings-data';
import mediaService from '../api/mediaService';

/**
 * Get the logo URL for email templates (server-side version)
 * This function can handle both media IDs and direct URLs
 * @param isDarkMode Whether to get the dark mode logo
 * @returns The logo URL or a fallback placeholder
 */
export async function getEmailLogoUrl(isDarkMode: boolean = false): Promise<string> {
  try {
    // Check if we have a media ID for the logo
    const logoId = isDarkMode ? siteSettingsData.logoDarkId : siteSettingsData.logoId;
    
    if (logoId) {
      // Try to get the media URL from the media service
      try {
        const media = await mediaService.getMediaById(logoId);
        return `http://localhost:9005${media.url}`;
      } catch (mediaError) {
        console.error('Error fetching media:', mediaError);
        // Fall through to direct URL fallback
      }
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
  return siteSettingsData.companyName || 'Aluplan';
}

/**
 * Get contact information from site settings
 * @returns Contact information
 */
export function getContactInfo() {
  return siteSettingsData.contact;
}

/**
 * Get social media links from site settings
 * @returns Social media links object
 */
export function getSocialMediaLinks() {
  return siteSettingsData.socialMedia || {};
}