import { siteSettingsData } from "@/lib/site-settings-data";
import { backendApiUrl } from "@/lib/server/backend-api-url";
import mediaService from "@/lib/api/mediaService";

// Get base URL for media files - use env variable for production support
function getMediaBaseUrl(): string {
  // NEXT_PUBLIC_API_URL ends with /api, we need to remove it for media URLs
  const apiUrl = backendApiUrl();
  return apiUrl.replace(/\/api\/?$/, "");
}

/**
 * Get the logo URL for email templates (server-side version)
 * This function can handle both media IDs and direct URLs
 * @param isDarkMode Whether to get the dark mode logo
 * @returns The logo URL or a fallback placeholder
 */
export async function getEmailLogoUrl(
  isDarkMode: boolean = false,
): Promise<string> {
  try {
    // Check if we have a media ID for the logo
    const logoId = isDarkMode
      ? siteSettingsData.logoDarkId
      : siteSettingsData.logoId;

    if (logoId) {
      // Try to get the media URL from the media service
      try {
        const media = await mediaService.getMediaById(logoId);
        return `${getMediaBaseUrl()}${media.url}`;
      } catch (mediaError) {
        console.error("Error fetching media:", mediaError);
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
      ? "https://placehold.co/140x40/171717/f0f0f0?text=Logo"
      : "https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo";
  } catch (error) {
    console.error("Error getting logo URL:", error);
    // Return fallback placeholder
    return isDarkMode
      ? "https://placehold.co/140x40/171717/f0f0f0?text=Logo"
      : "https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo";
  }
}

/**
 * Get complete site settings for email templates
 * Returns all site configuration including company info, logos, and social links
 */
export async function getSiteSettings() {
  const logoUrl = await getEmailLogoUrl(false);
  const logoDarkUrl = await getEmailLogoUrl(true);

  return {
    companyName: siteSettingsData.companyName || "XYZ Company",
    logoUrl,
    logoDarkUrl,
    tagline: siteSettingsData.seo.defaultDescription,
    address: siteSettingsData.contact.address || "",
    phone: siteSettingsData.contact.phone || "",
    email: siteSettingsData.contact.email || "",
    contactEmail: siteSettingsData.contact.email || "",
    socialMedia: {
      facebook: siteSettingsData.socialMedia?.facebook || "",
      twitter: siteSettingsData.socialMedia?.twitter || "",
      instagram: siteSettingsData.socialMedia?.instagram || "",
      linkedin: siteSettingsData.socialMedia?.linkedin || "",
      youtube: siteSettingsData.socialMedia?.youtube || "",
    },
  };
}

/**
 * Get the logo URL synchronously for email templates
 * Uses only the static data without media service
 * @param isDarkMode Whether to get the dark mode logo
 * @returns The logo URL or a fallback placeholder
 */
export function getLogoUrl(isDarkMode: boolean = false): string {
  // Use the static URL directly from settings data
  if (isDarkMode && siteSettingsData.logoDarkUrl) {
    return siteSettingsData.logoDarkUrl;
  }

  if (!isDarkMode && siteSettingsData.logoUrl) {
    return siteSettingsData.logoUrl;
  }

  // Default placeholder
  return isDarkMode
    ? "https://placehold.co/140x40/171717/f0f0f0?text=Logo"
    : "https://placehold.co/140x40/f7f7f7/1a1a1a?text=Logo";
}

/**
 * Get the company name from site settings
 * @returns The company name
 */
export function getCompanyName(): string {
  return siteSettingsData.companyName || "XYZ Company";
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
