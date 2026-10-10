import React, { useState } from 'react';
import { SocialPost } from '@/lib/api/socialMediaService';
import { cn } from "@/lib/utils";
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, defaultDropAnimation, DropAnimation } from '@dnd-kit/core';
import { createPortal } from 'react-dom';

interface SchedulerCalendarViewProps {
    queue: SocialPost[];
    onPostMove?: (postId: string, newDate: Date) => void;
}

const DraggablePost = ({ post }: { post: SocialPost }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: post.id,
        data: { post }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "text-[9px] px-1.5 py-1 border-l-2 truncate font-mono cursor-grab active:cursor-grabbing hover:brightness-110 transition-all rounded-sm shadow-sm",
                post.status === 'published' ? "border-[#9df425] bg-[#9df425]/10 text-[#9df425]" :
                    post.status === 'failed' ? "border-red-500 bg-red-500/10 text-red-500" :
                        "border-[#ff8c00] bg-[#ff8c00]/10 text-[#ff8c00]",
                isDragging ? "opacity-30" : "opacity-100"
            )}
        >
            {post.content}
        </div>
    );
};

const DroppableDay = ({ day, month, year, children, isToday }: { day: number, month: number, year: number, children: React.ReactNode, isToday: boolean }) => {
    const dateStr = new Date(year, month, day).toISOString();
    const { setNodeRef, isOver } = useDroppable({
        id: dateStr,
        data: { date: new Date(year, month, day) }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "border-r border-b border-white/5 p-2 relative transition-colors group min-h-[120px]",
                isOver ? "bg-white/5 ring-1 ring-inset ring-[#13ecec]/50" : "hover:bg-white/[0.02]"
            )}
        >
            <span className={cn(
                "text-[10px] font-mono absolute top-2 left-2 z-10",
                isToday ? "text-[#ff8c00] font-bold" : "text-white/40"
            )}>
                {day}
            </span>
            <div className="mt-6 flex flex-col gap-1.5 pointer-events-auto">
                {children}
            </div>
        </div>
    );
};

// Overlay component for smooth drag visual
const PostOverlay = ({ post }: { post: SocialPost }) => (
    <div className={cn(
        "text-[9px] px-2 py-1.5 border-l-2 truncate font-mono rounded-sm shadow-2xl skew-x-[-2deg] scale-105 z-50 pointer-events-none",
        post.status === 'published' ? "border-[#9df425] bg-[#1a1a1a] text-[#9df425]" :
            post.status === 'failed' ? "border-red-500 bg-[#1a1a1a] text-red-500" :
                "border-[#ff8c00] bg-[#1a1a1a] text-[#ff8c00]"
    )}>
        {post.content}
    </div>
);

export function SchedulerCalendarView({ queue, onPostMove }: SchedulerCalendarViewProps) {
    const [activePost, setActivePost] = useState<SocialPost | null>(null);

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const handleDragStart = (event: any) => {
        if (event.active.data.current?.post) {
            setActivePost(event.active.data.current.post);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActivePost(null);

        if (over && active.id !== over.id && onPostMove) {
            const newDate = over.data.current?.date as Date;
            if (newDate) {
                onPostMove(active.id as string, newDate);
            }
        }
    };

    const dropAnimation: DropAnimation = {
        ...defaultDropAnimation,
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="border border-white/5 bg-[#0a0a0a] rounded-lg overflow-hidden select-none">
                {/* Header */}
                <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-3 text-[10px] uppercase tracking-widest text-white/40 font-mono text-center">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 auto-rows-fr">
                    {blanks.map((_, i) => (
                        <div key={`blank-${i}`} className="border-r border-b border-white/5 bg-black/20 min-h-[120px]" />
                    ))}

                    {days.map(day => {
                        const date = new Date(today.getFullYear(), today.getMonth(), day);
                        const isToday = day === today.getDate();
                        const postsForDay = queue.filter(post => {
                            const postDate = post.scheduledDate ? new Date(post.scheduledDate) : new Date(post.createdAt);
                            return postDate.getDate() === day &&
                                postDate.getMonth() === today.getMonth() &&
                                postDate.getFullYear() === today.getFullYear();
                        });

                        return (
                            <DroppableDay key={day} day={day} month={today.getMonth()} year={today.getFullYear()} isToday={isToday}>
                                {postsForDay.map(post => (
                                    <DraggablePost key={post.id} post={post} />
                                ))}
                            </DroppableDay>
                        );
                    })}
                </div>
            </div>

            {typeof document !== 'undefined' && createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activePost ? <PostOverlay post={activePost} /> : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
