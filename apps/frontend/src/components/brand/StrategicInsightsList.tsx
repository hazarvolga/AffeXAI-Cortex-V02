"use client";

import React from 'react';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';

interface InsightCardProps {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    timestamp: string;
    category: string;
}

export const StrategicInsightsCard = ({ priority, title, description, timestamp, category }: InsightCardProps) => {
    const priorityColors = {
        high: 'bg-red-500/20 text-red-400 border-red-500/20',
        medium: 'bg-[#13c8ec]/20 text-[#13c8ec] border-[#13c8ec]/20',
        low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
    };

    return (
        <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg relative group cursor-pointer hover:border-[#13c8ec]/40 transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-sm border ${priorityColors[priority]}`}>
                        {priority} Priority
                    </span>
                    <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono flex items-center gap-1">
                        <Clock size={8} />
                        {timestamp}
                    </span>
                </div>
                <span className="text-[9px] text-cyan-500/40 font-mono uppercase tracking-widest">{category}</span>
            </div>

            <h3 className="text-sm font-bold text-white/90 mb-1 group-hover:text-[#13c8ec] transition-colors">{title}</h3>
            <p className="text-[11px] text-white/50 leading-relaxed mb-4 line-clamp-2">
                {description}
            </p>

            <button className="w-full py-2 bg-[#13c8ec]/5 border border-[#13c8ec]/20 text-[#13c8ec] text-[9px] font-bold uppercase tracking-[0.2em] group-hover:bg-[#13c8ec] group-hover:text-black transition-all duration-300 flex items-center justify-center gap-2">
                Generate Action
                <ArrowRight size={10} />
            </button>
        </div>
    );
};

export const StrategicInsightsList = () => {
    const insights: InsightCardProps[] = [
        {
            priority: 'high',
            title: 'Sentiment Shift Detected',
            description: 'Unusual correlation between APAC support tickets and organic social sentiment in EMEA regions.',
            timestamp: 'Just Now',
            category: 'Market Shift'
        },
        {
            priority: 'medium',
            title: 'Latent Competitor Gap',
            description: 'Competitor A has reduced volume on sustainability keywords. Opportunity for re-alignment.',
            timestamp: '2h ago',
            category: 'Competition'
        },
        {
            priority: 'low',
            title: 'Channel Saturation',
            description: 'Email open rates hitting ceiling. Suggesting pivot to conversational interface triggers.',
            timestamp: '5h ago',
            category: 'Performance'
        }
    ];

    return (
        <div className="col-span-12 lg:col-span-4 row-span-12 bg-white/5 backdrop-blur-xl border border-cyan-500/10 flex flex-col p-6 overflow-hidden rounded-xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <Sparkles size={18} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white/90 tracking-tight">Strategic Insights</h2>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono">AI-Augmented Logic Engine</p>
                </div>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {insights.map((insight, idx) => (
                    <StrategicInsightsCard key={idx} {...insight} />
                ))}
            </div>

            {/* Footer indicator */}
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2 items-center text-[9px] text-white/20 uppercase tracking-[0.2em] font-mono">
                <div className="size-1 rounded-full bg-emerald-500/40"></div>
                Engine Status: Synchronized
            </div>
        </div>
    );
};
