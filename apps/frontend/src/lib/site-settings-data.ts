export type SiteSettings = {
    companyName: string;
    domain: string;
    logoId?: string;
    logoDarkId?: string;
    logoUrl?: string;
    logoDarkUrl?: string;
    contact: {
        address: string;
        phone: string;
        email: string;
    };
    socialMedia: {
        [key: string]: string;
    };
    seo: {
        defaultTitle: string;
        defaultDescription: string;
    };
};

export const siteSettingsData: SiteSettings = {
    "companyName": "XYZ Company",
    "domain": "xyz.example",
    "logoUrl": "https://placehold.co/140x40/f7f7f7/1a1a1a?text=XYZ%20Company",
    "logoDarkUrl": "https://placehold.co/140x40/171717/f0f0f0?text=XYZ%20Company",
    "contact": {
        "address": "",
        "phone": "",
        "email": "info@xyz.example"
    },
    "socialMedia": {
        "facebook": "",
        "linkedin": "",
        "twitter": "",
        "youtube": "",
        "instagram": ""
    },
    "seo": {
        "defaultTitle": "XYZ Company",
        "defaultDescription": "AffeXAI Cortex örnek tenant: XYZ Company."
    }
};