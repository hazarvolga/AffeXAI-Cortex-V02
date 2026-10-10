import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw, Trash2, AlertTriangle } from 'lucide-react';
import { SocialPost } from '@/lib/api/socialMediaService';

interface SchedulerTableViewProps {
    queue: SocialPost[];
    onDelete: (id: string) => void;
    onRetry: (id: string) => void;
}

export function SchedulerTableView({ queue, onDelete, onRetry }: SchedulerTableViewProps) {
    if (queue.length === 0) {
        return (
            <div className="text-white/20 text-center py-12 border border-white/5 bg-white/5">
                <p className="mb-4 text-[10px] uppercase tracking-widest font-mono">No transmissions in queue.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {queue.map((post) => (
                <div key={post.id} className="relative group">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${post.status === 'failed' ? 'bg-red-500' :
                        post.status === 'published' ? 'bg-[#9df425]' :
                            'bg-[#ff8c00]'
                        }`}></div>

                    <div className={`bg-[#0a0a0a] border border-white/5 p-4 pl-6 flex items-center justify-between hover:border-white/10 transition-all`}>
                        <div className="flex items-center gap-6">
                            {/* Time Block */}
                            <div className="flex flex-col min-w-[100px]">
                                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
                                    {post.scheduledDate ? new Date(post.scheduledDate).toLocaleTimeString() : 'IMMEDIATE'}
                                </span>
                                <span className="text-xl font-mono font-bold text-white">
                                    {post.scheduledDate ? new Date(post.scheduledDate).toLocaleDateString() : 'NOW'}
                                </span>
                            </div>

                            {/* Content Block */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${post.status === 'published' ? 'bg-[#9df425]/10 text-[#9df425] border-[#9df425]/20' :
                                        post.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/20'
                                        }`}>
                                        {post.status}
                                    </span>
                                    {post.platforms && post.platforms.map((p, i) => (
                                        <span key={i} className="text-[9px] text-white/40 bg-white/5 px-2 py-0.5 font-mono uppercase">
                                            via {p}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-white/70 line-clamp-1 font-mono max-w-xl">{post.content}</p>

                                {/* Error Message */}
                                {/* Note: SocialPost interface in services needs errorMessage if we want to show it. 
                                    Assuming it might exist or we add it later. For now rendering if exists on 'any' cast or refactor interface */}
                                {(post as any).errorMessage && post.status === 'failed' && (
                                    <div className="flex items-center gap-2 text-[10px] text-red-400 font-mono mt-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>{(post as any).errorMessage}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {post.status === 'failed' && (
                                <Button
                                    onClick={() => onRetry(post.id)}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-[9px] font-bold uppercase tracking-widest text-[#9df425] border-[#9df425]/30 hover:bg-[#9df425]/10"
                                >
                                    <RotateCw className="w-3 h-3 mr-1" /> Retry
                                </Button>
                            )}
                            <Button
                                onClick={() => onDelete(post.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-white/40 hover:text-red-500 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
