/**
 * Site settings types and configurations
 */

export interface SiteContact {
    address: string;
    phone: string;
    email: string;
}

export interface SiteSocialMedia {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    [key: string]: string | undefined;
}

export interface SiteSeo {
    defaultTitle: string;
    defaultDescription: string;
}

export interface SiteSettings {
    companyName: string;
    domain: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    contactEmail?: string;
    logoId?: string;
    logoDarkId?: string;
    logoUrl?: string;
    logoDarkUrl?: string;
    contact: SiteContact;
    socialMedia: SiteSocialMedia;
    seo: SiteSeo;
    // Dynamic properties found in siteSettings.ts usages
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
}
