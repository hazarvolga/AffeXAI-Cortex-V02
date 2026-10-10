import React, { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { httpClient } from '@/lib/api/http-client';

// Dynamic import for Three.js component to avoid SSR issues
const ThreeResonanceField = dynamic(
    () => import('./ThreeResonanceField').then(mod => mod.ThreeResonanceField),
    { ssr: false, loading: () => <div className="animate-pulse text-[#13ecda]/20 font-mono text-xs">INITIALIZING WEBGL...</div> }
);

import { BrandIntelligence } from '@/lib/api/brandService';

interface GlobalHeatmapTileProps {
    data?: BrandIntelligence | null;
}

export const GlobalHeatmapTile = ({ data: initialData }: GlobalHeatmapTileProps) => {
    const [topology, setTopology] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTopology = async () => {
            try {
                const data = await httpClient.get<any>('/bcc/topology');
                setTopology(data);
            } catch (error) {
                console.error('Failed to fetch BCC topology:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopology();
        const interval = setInterval(fetchTopology, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden group min-h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#13ecda]/5 to-transparent pointer-events-none"></div>
            <div className="p-6 relative z-10 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white/90">Global Resonance Hub</h2>
                    <p className="text-white/50 text-sm">
                        {isLoading ? 'Synchronizing Neural Field...' : 'Real-time Neural Signal Topology'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="p-2 glass-panel rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/5 bg-white/5">
                        <span className="material-symbols-outlined text-lg text-[#13ecda]">3d_rotation</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-black/20">
                <Suspense fallback={<div className="text-xs font-mono text-white/30">LOADING FIELD...</div>}>
                    <ThreeResonanceField data={topology || initialData?.topology} />
                </Suspense>
            </div>

            <div className="p-6 flex items-center gap-4 z-10 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#13ecda] orb-glow"></span>
                    <span className="text-[10px] text-white/60 font-medium uppercase tracking-widest font-mono">Neural Resonance</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#a855f7]"></span>
                    <span className="text-[10px] text-white/60 font-medium uppercase tracking-widest font-mono">Ambient Intensity</span>
                </div>
            </div>
        </div>
    );
};

