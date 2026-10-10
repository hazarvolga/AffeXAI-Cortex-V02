"use client";

import React from 'react';
import { useComposerStore, Platform } from '@/lib/stores/composerStore';
import { PlatformTabs } from '@/components/social/composer/PlatformTabs';
import { AiMagicControls } from '@/components/social/composer/AiMagicControls';
import { PostPreviewCard } from '@/components/social/composer/PostPreviewCard';
import { SocialModuleNav } from '@/components/admin/social/SocialModuleNav';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { Button } from '@/components/ui/button';
import { Save, Send } from 'lucide-react';

export default function ComposerPage() {
    const { activeTab, masterContent, platforms, setMasterContent, setPlatformContent } = useComposerStore();

    const handleContentChange = (val: string) => {
        if (activeTab === 'master') {
            setMasterContent(val);
        } else {
            setPlatformContent(activeTab as Platform, val);
        }
    };

    const currentContent = activeTab === 'master' ? masterContent : platforms[activeTab as Platform]?.content || '';

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [accounts, setAccounts] = React.useState<any[]>([]); // Using any for now to avoid circular dep issues with types

    // Dynamic import to be safe, though standard import works.
    const { socialMediaService } = require('@/lib/api/socialMediaService');

    React.useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const accs = await socialMediaService.getAccounts();
                setAccounts(Array.isArray(accs) ? accs : []);
            } catch (err) {
                console.error("Failed to load accounts for composer", err);
            }
        };
        fetchAccounts();
    }, []);

    const handleDeploy = async () => {
        setIsSubmitting(true);
        try {
            // 1. Identify target account(s)
            let targetAccountIds: string[] = [];

            if (activeTab === 'master') {
                targetAccountIds = accounts.filter(a => a.isActive).map(a => a.id);
            } else {
                const targets = accounts.filter(a => a.provider === activeTab && a.isActive);
                targetAccountIds = targets.map(t => t.id);
            }

            if (targetAccountIds.length === 0) {
                alert(`No active accounts found for ${activeTab === 'master' ? 'broadcasting' : activeTab}. Please connect an account in the Dashboard.`);
                setIsSubmitting(false);
                return;
            }

            console.log("Deploying to accounts:", targetAccountIds);

            await socialMediaService.createPost({
                content: currentContent,
                accountIds: targetAccountIds,
                scheduledAt: undefined
            });

            alert("Signal dispatched successfully to grid!");
            // Reset logic could go here

        } catch (error) {
            console.error("Deploy failed", error);
            alert("Failed to dispatch signal. See console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BccEditorialWrapper
            headerTitle="Content Studio"
            headerSubtitle="AI-Augmented Deployment Console"
            headerBadge="Studio"
            moduleNav={<SocialModuleNav />}
        >
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-240px)] min-h-[600px] animate-in fade-in duration-700">

                {/* LEFT PANEL: INPUT & CONTEXT (5 Cols) */}
                <BccHudTile
                    title="Signal Input"
                    subtitle={activeTab === 'master' ? "Master Transmission Source" : `Channel: ${activeTab.toUpperCase()}`}
                    className="col-span-5 flex flex-col"
                    headerAction={
                        <div className="flex gap-2">
                            <span className="text-[10px] font-mono text-white/30 self-center mr-2">
                                {currentContent.length} CHARS
                            </span>
                        </div>
                    }
                >
                    <div className="flex flex-col h-full">
                        <div className="-mx-6 -mt-4 mb-0">
                            <PlatformTabs />
                        </div>

                        <div className="flex-1 relative group mt-4">
                            <textarea
                                value={currentContent}
                                onChange={(e) => handleContentChange(e.target.value)}
                                placeholder={activeTab === 'master'
                                    ? "Enter your core message or idea here. The AI will adapt it for other channels..."
                                    : `Customize content specifically for ${activeTab}...`}
                                className="w-full h-full bg-transparent border-none outline-none text-base text-white/90 placeholder:text-white/20 resize-none font-light leading-relaxed p-2 focus:ring-0"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white text-xs h-8">
                                <Save className="w-3 h-3 mr-2" />
                                Save Draft
                            </Button>
                            <Button
                                onClick={handleDeploy}
                                disabled={isSubmitting || !currentContent.trim()}
                                className="bg-[#13ecda] hover:bg-[#13ecda]/90 text-black font-bold uppercase tracking-widest text-[10px] h-8 px-6 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span className="animate-pulse">Transmitting...</span>
                                ) : (
                                    <>
                                        <Send className="w-3 h-3 mr-2" />
                                        Deploy
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </BccHudTile>

                {/* CENTER PANEL: AI CONTROLS (2 Cols) */}
                <BccHudTile
                    className="col-span-2 flex flex-col justify-center bg-white/[0.02]"
                >
                    <div className="h-full flex items-center">
                        <AiMagicControls />
                    </div>
                </BccHudTile>

                {/* RIGHT PANEL: PREVIEW (5 Cols) */}
                <BccHudTile
                    title="Visual Verification"
                    subtitle="WYSIWYG Simulation"
                    className="col-span-5 bg-black/40 flex flex-col"
                >
                    <div className="flex-1 flex items-center justify-center p-8 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-opacity-5">
                        <div className="transform scale-90 origin-center transition-all duration-500">
                            <PostPreviewCard
                                platform={activeTab === 'master' ? 'twitter' : activeTab as Platform}
                                content={currentContent}
                            />
                        </div>
                    </div>
                </BccHudTile>
            </div>
        </BccEditorialWrapper>
    );
}
