import React from 'react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface EventPreviewProps {
    data: {
        title?: string;
        description?: string;
        templateId?: string;
        startDate?: string;
        metadata?: {
            category?: string;
            visual?: {
                primaryColor?: string;
                logoUrl?: string;
                heroImageUrl?: string;
            };
            ticketTypes?: Array<{ quantity: string | number }>;
        };
    };
    className?: string;
}

export function EventPreviewCard({ data, className }: EventPreviewProps) {
    // Default fallback values
    const primaryColor = data?.metadata?.visual?.primaryColor || '#ff8c00';
    const templateId = data?.templateId || 'avant-garde';

    return (
        <div className={cn("h-full w-full overflow-y-auto no-scrollbar bg-black relative", className)}>
            {data ? (
                <div className="flex flex-col h-full relative min-h-[500px]">
                    {/* Template Texture */}
                    <div className={cn(
                        "absolute inset-0 opacity-[0.03] pointer-events-none",
                        templateId === 'avant-garde' && "bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:10px_10px]",
                        templateId === 'narrative' && "bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px]",
                        templateId === 'core-nexus' && "bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:16px_16px]"
                    )} />

                    {/* Hero Mock */}
                    <div className="h-44 bg-zinc-950 relative flex items-center justify-center border-b border-white/5 overflow-hidden shrink-0">
                        {data.metadata?.visual?.heroImageUrl ? (
                            <img src={data.metadata.visual.heroImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Hero" />
                        ) : (
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
                        )}

                        {/* Logo Overlay */}
                        <div className="z-10 bg-black/40 backdrop-blur-md p-3 border border-white/10 rounded-lg">
                            {data.metadata?.visual?.logoUrl ? (
                                <img src={data.metadata.visual.logoUrl} className="h-8 w-auto grayscale brightness-200" alt="Logo" />
                            ) : (
                                <span className="material-icons text-white/40 text-2xl">command</span>
                            )}
                        </div>
                    </div>

                    {/* Content Mock */}
                    <div className="p-6 space-y-5 relative z-10 bg-black/50">
                        <div className="space-y-1">
                            <div className="text-white font-bold text-sm uppercase tracking-tight leading-tight font-mono break-words">
                                {data.title || "NODE_UNTITLED"}
                            </div>
                            <div className="text-[8px] font-mono font-bold tracking-widest uppercase" style={{ color: primaryColor }}>
                                {data.metadata?.category || "GENERAL_NODE"}
                            </div>
                        </div>
                        <div className="h-px bg-white/5 w-full"></div>
                        <p className="text-white/30 text-[9px] leading-relaxed line-clamp-4 font-mono uppercase tracking-tight">
                            {data.description || "TELEMETRY_STREAM_PENDING_INITIALIZATION..."}
                        </p>

                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                            <div className="p-2.5 bg-white/[0.02] border border-white/5 space-y-1">
                                <div className="text-[6px] text-white/20 uppercase">Coordinate</div>
                                <div className="text-[8px] text-white/60 tabular-nums">
                                    {data.startDate ? format(new Date(data.startDate), "dd.MM.yy") : "--.--.--"}
                                </div>
                            </div>
                            <div className="p-2.5 bg-white/[0.02] border border-white/5 space-y-1">
                                <div className="text-[6px] text-white/20 uppercase">Units</div>
                                <div className="text-[8px] text-white/60 tabular-nums">{data.metadata?.ticketTypes?.[0]?.quantity || "0"} AVAIL</div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <div className="w-full py-2.5 text-black text-[9px] font-bold text-center uppercase tracking-[0.2em] shadow-lg shadow-black/20" style={{ backgroundColor: primaryColor }}>
                                Access_Registry
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center p-8 text-center">
                    <p className="text-[9px] text-white/20 font-mono uppercase tracking-[0.3em]">Connecting_to_Core...</p>
                </div>
            )}
        </div>
    );
}
