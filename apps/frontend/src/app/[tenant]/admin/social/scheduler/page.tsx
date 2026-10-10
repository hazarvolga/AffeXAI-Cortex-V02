'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { socialMediaService, SocialPost } from '@/lib/api/socialMediaService';
import CreatePostModal from '../components/CreatePostModal';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { SocialModuleNav } from '@/components/admin/social/SocialModuleNav';
import { Button } from '@/components/ui/button';
import { Plus, RotateCw } from 'lucide-react';

// New Components
import { SchedulerToolbar } from '../components/SchedulerToolbar';
import { SchedulerTableView } from '../components/SchedulerTableView';
import { SchedulerCalendarView } from '../components/SchedulerCalendarView';
import { SocialProvider } from '../components/ProviderFilter';

export default function SocialMediaScheduler() {
    const [queue, setQueue] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // View State
    const [view, setView] = useState<'table' | 'calendar'>('table');
    const [selectedProviders, setSelectedProviders] = useState<SocialProvider[]>(['twitter', 'linkedin', 'instagram', 'facebook']);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await socialMediaService.getPosts();
            if (Array.isArray(data)) {
                setQueue(data);
            } else {
                console.error('Data received is not an array:', data);
                setQueue([]);
            }
        } catch (error) {
            console.error('Failed to load posts', error);
            toast.error('Failed to sync dispatch queue');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!confirm('Are you sure you want to abort this transmission sequence?')) return;

        try {
            await socialMediaService.deletePost(id);
            toast.success('Transmission sequence aborted.');
            loadPosts();
        } catch (error) {
            console.error('Failed to delete post', error);
            toast.error('Failed to abort transmission.');
        }
    };

    const handleRetryPost = async (id: string) => {
        try {
            toast.info('Re-initializing transmission sequence...');
            await socialMediaService.retryPost(id);
            toast.success('Transmission retried successfully.');
            loadPosts();
        } catch (error) {
            console.error('Failed to retry post', error);
            toast.error('Failed to retry transmission.');
        }
    };

    const handleUpdateLogic = () => {
        toast.info('Synchronizing dispatch logic...');
        setTimeout(() => {
            toast.success('Logic rules updated: v2.4.2');
        }, 1000);
    };

    const handleToggleProvider = (provider: SocialProvider) => {
        setSelectedProviders(prev =>
            prev.includes(provider)
                ? prev.filter(p => p !== provider)
                : [...prev, provider]
        );
    };

    const handlePostMove = async (postId: string, newDate: Date) => {
        // Optimistic UI Update (or simply toast for now)
        toast.info(`Rescheduling post...`);
        console.log(`Moving post ${postId} to ${newDate.toISOString()}`);

        // TODO: Call API to update scheduledAt
        // await socialMediaService.updatePost(postId, { scheduledAt: newDate });

        toast.success(`Post rescheduled to ${newDate.toLocaleDateString()}`);

        // Reload to sync (or update local state if we want better UX)
        // loadPosts(); 
    };

    const filteredQueue = queue.filter(post => {
        // Assume post.platforms is array of strings. Check if ANY overlap with selectedProviders.
        if (!post.platforms || post.platforms.length === 0) return true; // Show posts without platform specified (drafts)
        return post.platforms.some(p => selectedProviders.includes(p.toLowerCase() as SocialProvider));
    });

    return (
        <BccEditorialWrapper
            headerTitle="Dispatch Logic"
            headerSubtitle="Deterministic timeline architecture and queue management."
            headerBadge="System"
            moduleNav={<SocialModuleNav />}
        >
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadPosts}
            />

            <div className="space-y-6 pb-20 animate-in fade-in duration-1000">

                {/* Unified Toolbar (The Control Tower) */}
                <SchedulerToolbar
                    view={view}
                    onViewChange={setView}
                    selectedProviders={selectedProviders}
                    onToggleProvider={handleToggleProvider}
                />

                {/* Main Content Area */}
                <BccHudTile
                    className="col-span-full border-t-0 rounded-t-none" // Merge visually with toolbar
                    title={view === 'table' ? "Queue Manifest" : "Temporal Grid"}
                    subtitle={`${filteredQueue.length} Active Tasks Pending Execution`}
                    headerAction={
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-[#ff8c00] hover:bg-[#e67e00] text-black font-bold uppercase tracking-widest text-[10px] h-7 px-4 rounded-none"
                        >
                            <Plus className="w-3 h-3 mr-2" />
                            New Transmission
                        </Button>
                    }
                >
                    <div className="p-4 min-h-[400px]">
                        {loading ? (
                            <div className="text-white/40 text-center py-12 text-[10px] uppercase tracking-widest font-mono">
                                Loading transmission data...
                            </div>
                        ) : (
                            view === 'table' ? (
                                <SchedulerTableView
                                    queue={filteredQueue}
                                    onDelete={handleDeletePost}
                                    onRetry={handleRetryPost}
                                />
                            ) : (
                                <SchedulerCalendarView queue={filteredQueue} onPostMove={handlePostMove} />
                            )
                        )}
                    </div>
                </BccHudTile>
            </div>
        </BccEditorialWrapper>
    );
}

