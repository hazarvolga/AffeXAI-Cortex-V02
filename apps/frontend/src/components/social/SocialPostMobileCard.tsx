
import React from 'react';
import { SocialPost } from '@/lib/api/socialMediaService';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Twitter, Linkedin, Instagram, Trash2, PenTool, RefreshCw } from 'lucide-react';

interface SocialPostMobileCardProps {
    post: SocialPost;
    onDelete: (id: string) => void;
    onSync: (id: string) => void;
}

export const SocialPostMobileCard = ({ post, onDelete, onSync }: SocialPostMobileCardProps) => {
    const postDate = new Date(post.scheduledDate || post.createdAt);
    const isPublished = post.status === 'published';
    const reach = post.stats?.reach || 0;

    return (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4 mb-3 relative overflow-hidden group active:scale-[0.98] transition-transform">
            {/* Platform Icons & Date */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex space-x-2">
                    {post.platforms.includes('twitter') && <Twitter className="w-4 h-4 text-blue-400" />}
                    {post.platforms.includes('linkedin') && <Linkedin className="w-4 h-4 text-blue-600" />}
                    {post.platforms.includes('instagram') && <Instagram className="w-4 h-4 text-pink-500" />}
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    {postDate.toLocaleDateString('tr-TR')}
                </span>
            </div>

            {/* Content Preview */}
            <p className="text-white text-sm font-medium mb-4 line-clamp-3 leading-relaxed">
                {post.content}
            </p>

            {/* Status & Actions Bar */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <Badge variant="outline" className={`rounded-sm border-white/10 uppercase text-[9px] tracking-widest px-2 py-1 ${post.status === 'published' ? "bg-[#9df425]/10 text-[#9df425] border-[#9df425]/20" :
                    post.status === 'scheduled' ? "bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/20" :
                        "text-white/40"
                    }`}>
                    {post.status}
                </Badge>

                <div className="flex gap-2">
                    {isPublished ? (
                        // Published Actions: Sync
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-[#13ecec] bg-white/5" onClick={() => onSync(post.id)}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    ) : (
                        // Draft/Scheduled Actions: Edit & Delete
                        <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-[#ff8c00] bg-white/5">
                                <PenTool className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-red-500 bg-white/5" onClick={() => onDelete(post.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Analytics Overlay (if published) */}
            {isPublished && (
                <div className="mt-3 bg-black/20 rounded p-2 flex items-center gap-3">
                    <div className="flex-1">
                        <div className="flex justify-between text-[9px] uppercase text-white/40 font-mono mb-1">
                            <span>Reach Impact</span>
                            <span>{reach} / 5000</span>
                        </div>
                        <Progress value={Math.min((reach / 5000) * 100, 100)} className="h-1 bg-white/5" />
                    </div>
                </div>
            )}
        </div>
    );
};
