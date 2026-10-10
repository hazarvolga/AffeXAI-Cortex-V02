export interface Contact {
  address: string;
  phone: string;
  email: string;
}

export interface SocialMedia {
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  instagram?: string;
  pinterest?: string;
  tiktok?: string;
  [key: string]: string | undefined;
}

export interface Seo {
  defaultTitle: string;
  defaultDescription: string;
}

export interface SiteSettings {
  companyName: string;
  logoUrl: string;
  logoDarkUrl: string;
  contact: Contact;
  socialMedia: SocialMedia;
  seo: Seo;
}

class SettingsService {
  async getSiteSettings(): Promise<SiteSettings> {
    // Directly call the backend API
    const response = await fetch('http://localhost:9005/api/settings/site');
    if (!response.ok) {
      throw new Error('Failed to fetch site settings');
    }
    return response.json();
  }

  // Note: We're removing the updateSiteSettings method since it's not needed for this use case
  // and would require additional backend setup
}

export default new SettingsService();