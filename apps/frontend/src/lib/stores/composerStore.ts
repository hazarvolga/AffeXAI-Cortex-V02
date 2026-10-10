import { create } from 'zustand';

export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook';

export interface PlatformState {
    content: string;
    media: string[];
    isModified: boolean;
}

interface ComposerState {
    // Master content serves as the "Idea" source
    masterContent: string;

    // Platform-specific overrides
    platforms: Record<Platform, PlatformState>;

    // UI State
    activeTab: 'master' | Platform;
    isMagicMode: boolean;

    // Actions
    setMasterContent: (content: string) => void;
    setPlatformContent: (platform: Platform, content: string) => void;
    setActiveTab: (tab: 'master' | Platform) => void;

    // "Magic" Actions
    adaptMasterToAll: () => void; // Simulates AI distribution
    resetAll: () => void;
}

const initialPlatformState: PlatformState = {
    content: '',
    media: [],
    isModified: false
};

export const useComposerStore = create<ComposerState>((set, get) => ({
    masterContent: '',

    platforms: {
        twitter: { ...initialPlatformState },
        linkedin: { ...initialPlatformState },
        instagram: { ...initialPlatformState },
        facebook: { ...initialPlatformState }
    },

    activeTab: 'master',
    isMagicMode: false,

    setMasterContent: (content) => set({ masterContent: content }),

    setPlatformContent: (platform, content) => set((state) => ({
        platforms: {
            ...state.platforms,
            [platform]: {
                ...state.platforms[platform],
                content,
                isModified: true
            }
        }
    })),

    setActiveTab: (tab) => set({ activeTab: tab }),

    adaptMasterToAll: () => {
        const { masterContent, platforms } = get();

        // Simulation of AI Adaptation logic
        // In real implementation, this would call an API

        const newPlatforms = { ...platforms };

        // Twitter: Shorten to < 280 chars, add hashtags
        newPlatforms.twitter = {
            ...newPlatforms.twitter,
            content: masterContent.length > 200
                ? masterContent.substring(0, 200) + '... #update'
                : masterContent + ' #thoughts',
            isModified: false // Reset modified flag as it's auto-generated
        };

        // LinkedIn: Professional tone
        newPlatforms.linkedin = {
            ...newPlatforms.linkedin,
            content: "🚀 Professional Update:\n\n" + masterContent + "\n\n#ProfessionalNetwork #IndustryInsights",
            isModified: false
        };

        // Instagram: Visual focus (Needs media warning if empty)
        newPlatforms.instagram = {
            ...newPlatforms.instagram,
            content: masterContent + "\n.\n.\n.\n#instadaily #photooftheday",
            isModified: false
        };

        set({ platforms: newPlatforms, isMagicMode: true });
    },

    resetAll: () => set({
        masterContent: '',
        platforms: {
            twitter: { ...initialPlatformState },
            linkedin: { ...initialPlatformState },
            instagram: { ...initialPlatformState },
            facebook: { ...initialPlatformState }
        },
        activeTab: 'master',
        isMagicMode: false
    })
}));
