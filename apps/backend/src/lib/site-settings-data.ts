export type SiteSettings = {
    companyName: string;
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
    "companyName": "Aluplan Program Sistemleri 2026",
    "contact": {
        "address": "",
        "phone": "",
        "email": "info@aluplan.com.tr"
    },
    "socialMedia": {
        "facebook": "https://www.facebook.com/Allplan.Turkey",
        "linkedin": "https://www.linkedin.com/company/allplan-turkey/",
        "twitter": "https://twitter.com/Allplan_Turkey",
        "youtube": "https://www.youtube.com/c/AllplanTurkey",
        "instagram": "https://www.instagram.com/allplan_turkey/"
    },
    "seo": {
        "defaultTitle": "Aluplan Digital - AEC Çözümleri",
        "defaultDescription": "AEC profesyonelleri için en gelişmiş dijital çözümler ve uzman desteği."
    }
};