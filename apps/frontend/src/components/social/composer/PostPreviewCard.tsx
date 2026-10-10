"use client";

import React from 'react';
import { Platform } from '@/lib/stores/composerStore';
import { Twitter, Linkedin, Instagram, Facebook } from 'lucide-react';

interface PostPreviewCardProps {
    platform: Platform;
    account?: {
        name: string;
        handle: string;
        avatar?: string;
        verified?: boolean;
    };
    content: string;
}

export const PostPreviewCard = ({ platform, content, account }: PostPreviewCardProps) => {

    const user = account || {
        name: "Select Account",
        handle: "@username",
        avatar: "https://affine.assets/avatar-placeholder.png",
        verified: false
    };

    const formattedContent = content || "Start typing to preview content...";

    // Platform Specific Wrappers
    const renderPreview = () => {
        switch (platform) {
            case 'twitter':
                return (
                    <div className="bg-black border border-white/10 rounded-xl p-4 w-full max-w-[400px] shadow-2xl relative overflow-hidden">
                        <div className="flex gap-3">
                            <div className="size-10 bg-white/10 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">{user.name}</span>
                                    <span className="text-white/40 text-sm">{user.handle}</span>
                                    <span className="text-white/40 text-sm">· 1m</span>
                                </div>
                                <p className="text-white text-sm whitespace-pre-wrap mt-1 leading-normal">
                                    {formattedContent}
                                </p>
                                {/* Media Placeholder */}
                                <div className="mt-3 aspect-video bg-white/5 rounded-lg border border-white/5 flex items-center justify-center">
                                    <span className="text-xs text-white/20 font-mono">MEDIA_CONTAINER</span>
                                </div>
                                <div className="flex justify-between mt-3 text-white/40 max-w-[80%]">
                                    <div className="size-4 bg-white/10 rounded-full" />
                                    <div className="size-4 bg-white/10 rounded-full" />
                                    <div className="size-4 bg-white/10 rounded-full" />
                                    <div className="size-4 bg-white/10 rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-4 right-4">
                            <Twitter className="w-4 h-4 text-[#1da1f2]" />
                        </div>
                    </div>
                );

            case 'linkedin':
                return (
                    <div className="bg-white rounded-lg w-full max-w-[400px] shadow-2xl overflow-hidden text-black">
                        <div className="p-3 flex gap-3 border-b border-gray-100">
                            <div className="size-10 bg-gray-200 rounded-sm" />
                            <div>
                                <div className="font-bold text-sm text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">AI Intelligence Platform</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">1m · <span className="text-[8px]">🌐</span></div>
                            </div>
                            <Linkedin className="ml-auto w-5 h-5 text-[#0a66c2]" />
                        </div>
                        <div className="p-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {formattedContent}
                        </div>
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-400 font-mono">MEDIA</span>
                        </div>
                        <div className="px-3 py-2 border-t border-gray-100 flex justify-between bg-gray-50/50">
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                        </div>
                    </div>
                );

            case 'instagram':
                return (
                    <div className="bg-white w-full max-w-[350px] aspect-[9/16] shadow-2xl rounded-2xl overflow-hidden flex flex-col text-black relative border-8 border-black">
                        {/* Fake Phone Frame Header */}
                        <div className="bg-white p-3 flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="size-8 bg-gray-200 rounded-full" />
                                <span className="text-xs font-bold">{user.handle.replace('@', '')}</span>
                            </div>
                            <Instagram className="w-5 h-5 text-black" />
                        </div>

                        {/* Square Image Area */}
                        <div className="aspect-square bg-gray-50 flex items-center justify-center">
                            <span className="text-xs text-gray-300 font-mono">1080x1080 MEDIA</span>
                        </div>

                        <div className="p-3 flex-1">
                            <div className="flex gap-4 mb-2">
                                <div className="size-5 bg-black/10 rounded-full" />
                                <div className="size-5 bg-black/10 rounded-full" />
                                <div className="size-5 bg-black/10 rounded-full" />
                            </div>
                            <p className="text-xs text-gray-900 leading-tight">
                                <span className="font-bold mr-2">{user.handle.replace('@', '')}</span>
                                {formattedContent}
                            </p>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-white/50 font-mono text-xs">
                        PREVIEW NOT AVAILABLE FOR PROTOCOL {platform.toUpperCase()}
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">
                {platform} Simulator // Live View
            </div>
            {renderPreview()}
        </div>
    );
};
