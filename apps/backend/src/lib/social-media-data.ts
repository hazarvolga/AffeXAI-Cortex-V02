
import type { SocialAccount, SocialPlatform, SocialPost } from './types';
import { Facebook, Twitter, Linkedin, Youtube, Instagram, Share2, Component } from 'lucide-react';
import { events } from './events-data';
import { pages } from './cms-data';
import { siteSettingsData } from './site-settings-data';

// --- DYNAMIC ACCOUNT GENERATION ---
// This part now reads from siteSettingsData to create the accounts dynamically.
// The connection status is still mocked here, but the list of accounts is dynamic.

// Mock connection status. In a real app, this would come from a database.
const connectionStatus: { [key: string]: boolean } = {
    facebook: true,
    twitter: true,
    linkedin: false,
    youtube: false,
    instagram: true,
};

const extractUsername = (platform: string, url: string): string => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (platform.toLowerCase() === 'linkedin' && pathParts.includes('company')) {
             return pathParts[pathParts.indexOf('company') + 1] || 'Aluplan';
        }
        return pathParts.pop() || `Aluplan ${platform}`;
    } catch (e) {
        return `Aluplan ${platform}`;
    }
}

export const socialAccounts: SocialAccount[] = Object.entries(siteSettingsData.socialMedia)
    .filter(([_, url]) => url) // Filter out empty URLs
    .map(([platform, url], index) => {
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1) as SocialPlatform;
        return {
            id: `acc-${platform.substring(0, 2)}-${String(index + 1).padStart(3, '0')}`,
            platform: platformName,
            username: extractUsername(platform, url),
            avatarUrl: `https://i.pravatar.cc/150?u=${platform}`,
            isConnected: connectionStatus[platform] || false,
        };
    });


// --- ICON MAPPING ---
export const getPlatformIcon = (platform: SocialPlatform | string) => {
    switch (platform.toLowerCase()) {
        case 'facebook': return Facebook;
        case 'twitter': return Twitter;
        case 'linkedin': return Linkedin;
        case 'youtube': return Youtube;
        case 'instagram': return Instagram;
        case 'pinterest': return Share2;
        case 'tiktok': return Component;
        default: return Share2;
    }
}


// --- MOCKED POST DATA (Remains the same for now) ---
export const socialPosts: SocialPost[] = [
    {
        id: 'post-001',
        accountId: socialAccounts.find(a => a.platform === 'Facebook')?.id || 'acc-fb-001',
        status: 'Yayınlandı',
        content: `Allplan'ın en yeni sürümü olan 2025'in getirdiği çığır açan özellikleri kaçırmayın! Uzmanlarımızdan canlı demolar izleyin, sektör liderleriyle tanışın.`,
        sourceContentId: 'evt-001',
        sourceContentType: 'event',
        publishedAt: '2024-07-28T10:00:00.000Z',
    },
     {
        id: 'post-002',
        accountId: socialAccounts.find(a => a.platform === 'Twitter')?.id || 'acc-tw-001',
        status: 'Yayınlandı',
        content: `Allplan 2025 Lansmanı için geri sayım başladı! 🚀 Yeni özellikler, canlı demolar ve daha fazlası... #Allplan #BIM #AEC`,
        sourceContentId: 'evt-001',
        sourceContentType: 'event',
        publishedAt: '2024-07-28T10:05:00.000Z',
    },
    {
        id: 'post-003',
        accountId: socialAccounts.find(a => a.platform === 'Facebook')?.id || 'acc-fb-001',
        status: 'Planlandı',
        content: `Ücretsiz webinarımıza katılın: Allplan Bridge ile Parametrik Köprü Tasarımı. Projelerinizi nasıl hızlandırabileceğinizi keşfedin.`,
        sourceContentId: 'evt-002',
        sourceContentType: 'event',
        scheduledAt: '2024-08-20T14:00:00.000Z',
    },
     {
        id: 'post-004',
        accountId: socialAccounts.find(a => a.platform === 'LinkedIn')?.id || 'acc-li-001',
        status: 'Hata',
        content: `Yeni sayfamız yayında: "Bina Tasarımı Çözümleri". Mimari, strüktürel ve MEP için entegre BIM çözümlerimizi keşfedin.`,
        sourceContentId: 'page-solutions-building-design',
        sourceContentType: 'page',
        scheduledAt: '2024-07-30T11:00:00.000Z',
    }
];

export const getSourceContentName = (type: 'event' | 'page' | 'blog', id: string) => {
    if (type === 'event') {
        return events.find(e => e.id === id)?.title || 'Bilinmeyen Etkinlik';
    }
    if (type === 'page') {
        return pages.find(p => p.id === id)?.title || 'Bilinmeyen Sayfa';
    }
    return 'Bilinmeyen İçerik';
}
