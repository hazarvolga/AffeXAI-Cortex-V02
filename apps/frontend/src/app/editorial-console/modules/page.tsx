'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const SentimentHeatmap = dynamic(() => import('@/components/editorial/SentimentHeatmap'), {
    ssr: false,
    loading: () => <div className="w-full h-full min-h-[250px] bg-[#161B22]/50 animate-pulse rounded-lg border border-white/5" />
});

const mockBrandData = [
    { subject: 'Trust', A: 120, fullMark: 150 },
    { subject: 'Joy', A: 98, fullMark: 150 },
    { subject: 'Surprise', A: 86, fullMark: 150 },
    { subject: 'Anticipation', A: 99, fullMark: 150 },
    { subject: 'Fear', A: 20, fullMark: 150 },
    { subject: 'Anger', A: 15, fullMark: 150 },
];

export default function ModuleGatewayPage() {
    return (
        <section className="relative w-full h-full bg-[#080808] font-sans selection:bg-[#00f0ff]/30 overflow-hidden flex flex-col">
            {/* 
                STITCH DESIGN SYSTEM PORT 
                Base Styles from code.html adapted to Tailwind/JSX 
            */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

                .font-display { font-family: 'Space Grotesk', sans-serif; }
                
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                
                /* Strict Port of .bento-card from code.html */
                .bento-card {
                    background: rgba(22, 27, 34, 0.8);
                    border: 1px solid rgba(35, 69, 72, 0.5);
                    backdrop-filter: blur(12px);
                    transition: all 0.3s ease;
                }
                .bento-card:hover {
                    border-color: #00f0ff; /* Adapted to AffeXAI Cyan */
                    box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
                }

                /* Strict Port of .glass-dock */
                .glass-dock {
                    background: rgba(16, 32, 34, 0.8);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(146, 197, 201, 0.1);
                }

                /* Strict Port of .hazy-signal */
                .hazy-signal {
                    mask-image: linear-gradient(to right, black, transparent);
                    opacity: 0.5;
                    filter: blur(1px);
                }
                
                /* Scrollbar hiding for clean layout */
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {/* Header / Brand Pulse (Fixed Top) */}
            <div className="flex-none flex flex-col items-center justify-center pt-8 pb-4 px-10 w-full max-w-[1400px] mx-auto z-20">
                <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-[#00f0ff] text-3xl">insights</span>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-[0.2em] font-display">Module Gateway</h1>
                </div>

                {/* Real-time Brand Pulse Waveform (Strict Port) */}
                <div className="w-full max-w-[800px] flex flex-col items-center gap-2">
                    <div className="flex justify-between w-full px-2">
                        <span className="text-[10px] text-[#00f0ff]/60 font-bold uppercase tracking-widest font-display">Global Brand Velocity</span>
                        <span className="text-[10px] text-[#00f0ff] font-bold uppercase tracking-widest flex items-center gap-1 font-display">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f0ff]"></span>
                            </span>
                            Status: Accelerated
                        </span>
                    </div>
                    <div className="w-full h-24 relative overflow-hidden rounded-xl bg-[#161B22]/50 border border-white/5">
                        <svg className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 100">
                            <path className="opacity-30" d="M0 50 Q 50 10, 100 50 T 200 50 T 300 50 T 400 50 T 500 50 T 600 50 T 700 50 T 800 50 T 900 50 T 1000 50" stroke="#00f0ff" strokeWidth="2"></path>
                            <path d="M0 60 Q 125 0, 250 60 T 500 60 T 750 60 T 1000 60" stroke="#00f0ff" strokeLinecap="round" strokeWidth="3"></path>
                            <defs>
                                <linearGradient id="wave-grad" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.2"></stop>
                                    <stop offset="100%" stopColor="#00f0ff" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d="M0 60 Q 125 0, 250 60 T 500 60 T 750 60 T 1000 60 V 100 H 0 Z" fill="url(#wave-grad)"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Main Bento Grid Content (Scrollable) */}
            <div className="flex-grow w-full overflow-y-auto no-scrollbar pb-32">
                <main className="w-full max-w-[1400px] mx-auto px-6">
                    <div className="grid grid-cols-12 grid-rows-6 gap-4 h-[800px]">

                        {/* 1. EMOTIONAL ANALYTICS (Top Left) - 3D Surface Plot */}
                        <div className="col-span-12 lg:col-span-5 row-span-3 bento-card rounded-xl p-6 flex flex-col gap-4 overflow-hidden relative group">
                            <div className="flex justify-between items-center z-10">
                                <div className="flex flex-col">
                                    <h3 className="text-white text-lg font-bold font-display">Emotional Analytics</h3>
                                    <p className="text-[#00f0ff]/70 text-xs font-medium font-display">Live Sentiment Heatmap (3D)</p>
                                </div>
                                <span className="material-symbols-outlined text-[#00f0ff]/40 group-hover:text-[#00f0ff] transition-colors">grid_view</span>
                            </div>

                            {/* Interactive 3D Canvas */}
                            <div className="flex-1 relative flex items-center justify-center min-h-0 w-full h-full">
                                {/* TEMPORARY DISABLED: 3D Animation causing white screen issues. 
                                    <SentimentHeatmap /> 
                                */}
                                <div className="text-[#00f0ff]/50 text-xs font-display">
                                    3D Visualization Paused
                                </div>
                            </div>
                        </div>

                        {/* 2. LIVE MODULE FEED (Right Side Top) */}
                        <div className="col-span-12 lg:col-span-7 row-span-4 bento-card rounded-xl p-6 flex flex-col gap-6 group">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <h3 className="text-white text-xl font-bold tracking-tight font-display">Active Module Feed</h3>
                                    <p className="text-[#00f0ff]/70 text-sm font-display">Internal System Actions</p>
                                </div>
                                <div className="px-3 py-1 rounded-full border border-[#00f0ff]/30 text-[10px] text-[#00f0ff] font-bold uppercase bg-[#00f0ff]/10 font-display">Live Processing</div>
                            </div>
                            <div className="space-y-4 font-display">
                                {/* Insight Card 1 */}
                                <div className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-[#00f0ff]/40 transition-all cursor-pointer">
                                    <div className="flex gap-4">
                                        <span className="material-symbols-outlined text-[#00f0ff]">auto_awesome</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="text-sm font-bold text-white">SEO Optimization Complete</h4>
                                                <span className="text-[10px] text-[#00f0ff]/60">2m ago</span>
                                            </div>
                                            <p className="text-sm text-[#00f0ff]/80 leading-relaxed">Updated meta-tags for 'Pricing' page. Keyword 'Enterprise AI' density increased to 2.4%.</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Insight Card 2 */}
                                <div className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-[#00f0ff]/40 transition-all cursor-pointer">
                                    <div className="flex gap-4">
                                        <span className="material-symbols-outlined text-[#00f0ff]">auto_graph</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="text-sm font-bold text-white">Competitor Insight</h4>
                                                <span className="text-[10px] text-[#00f0ff]/60">14m ago</span>
                                            </div>
                                            <p className="text-sm text-[#00f0ff]/80 leading-relaxed">Competitor X documentation update detected. New feature found: 'Vector Sync'. Triggering research agent.</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Insight Card 3 */}
                                <div className="p-4 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 hover:border-[#00f0ff]/60 transition-all cursor-pointer">
                                    <div className="flex gap-4">
                                        <span className="material-symbols-outlined text-[#00f0ff]">rocket_launch</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="text-sm font-bold text-white">Content Draft Ready</h4>
                                                <span className="text-[10px] text-[#00f0ff]/60">Now</span>
                                            </div>
                                            <p className="text-sm text-[#00f0ff]/80 leading-relaxed">New blog post 'The Future of Agentic Coding' drafted based on current trend velocity.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-auto pt-4 flex justify-end">
                                <button className="flex items-center gap-2 bg-[#00f0ff] text-[#102022] font-bold text-xs uppercase px-6 py-3 rounded-lg hover:scale-105 transition-transform font-display">
                                    Force Sync Modules <span className="material-symbols-outlined text-sm">sync</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. CAMPAIGN HORIZON (Bottom Left) */}
                        <div className="col-span-12 lg:col-span-5 row-span-3 bento-card rounded-xl p-6 flex flex-col gap-4 overflow-hidden group">
                            <div className="flex flex-col">
                                <h3 className="text-white text-lg font-bold font-display">Campaign Horizon</h3>
                                <p className="text-[#00f0ff]/70 text-xs font-medium font-display">Upcoming Automated Actions</p>
                            </div>
                            <div className="relative flex-1 flex flex-col gap-1 mt-2 font-display">
                                {/* Timeline Items */}
                                <div className="flex items-center gap-4 py-3 border-b border-white/5">
                                    <div className="flex flex-col items-center">
                                        <span className="material-symbols-outlined text-[#00f0ff] text-xl">radio_button_checked</span>
                                        <div className="w-[1px] h-full bg-[#00f0ff]/30"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">Q3 Product Launch</p>
                                        <p className="text-[#00f0ff]/50 text-[10px] uppercase font-bold tracking-widest">Immediate</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 py-3 border-b border-white/5 opacity-80 hazy-signal">
                                    <div className="flex flex-col items-center">
                                        <span className="material-symbols-outlined text-[#00f0ff]/60 text-xl">blur_on</span>
                                        <div className="w-[1px] h-full bg-[#00f0ff]/30"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">Weekly Newsletter Dispatch</p>
                                        <p className="text-[#00f0ff]/40 text-[10px] uppercase font-bold tracking-widest">+2 Days</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 py-3 opacity-60 hazy-signal">
                                    <div className="flex flex-col items-center">
                                        <span className="material-symbols-outlined text-[#00f0ff]/30 text-xl">cloud_queue</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">Monthly Audit Report</p>
                                        <p className="text-[#00f0ff]/30 text-[10px] uppercase font-bold tracking-widest">+1 Week</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. RAPID PROTOTYPE LAB (Bottom Right) */}
                        <div className="col-span-12 lg:col-span-7 row-span-2 bento-card rounded-xl p-6 flex flex-col gap-4 group overflow-hidden">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <h3 className="text-white text-lg font-bold font-display">Rapid Prototype Lab</h3>
                                    <p className="text-[#00f0ff]/70 text-xs font-medium font-display">Test Ideas with Active Modules</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></div>
                                    <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse [animation-delay:200ms]"></div>
                                    <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse [animation-delay:400ms]"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-10 gap-4 flex-1 h-full">
                                <div className="col-span-7 h-full">
                                    <div className="bg-black/20 border border-white/5 rounded-lg p-4 h-full relative group">
                                        <textarea className="w-full h-full bg-transparent border-none text-[#00f0ff] focus:ring-0 text-sm font-medium placeholder:text-[#00f0ff]/20 resize-none font-display focus:outline-none" placeholder="Input raw concept for module processing..."></textarea>
                                        <div className="absolute bottom-2 right-2 text-[10px] text-[#00f0ff]/40 flex items-center gap-2 font-display">
                                            <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                            AI Ready
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-3 flex flex-col gap-2 font-display">
                                    <div className="flex-1 bg-white/5 border border-white/5 rounded-lg p-3 flex flex-col gap-2 overflow-hidden">
                                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-1">Target Modules</p>
                                        <div className="flex items-center gap-2 opacity-60">
                                            <div className="w-6 h-6 rounded bg-[#00f0ff]/20 flex items-center justify-center"><span className="material-symbols-outlined text-sm text-[#00f0ff]">alternate_email</span></div>
                                            <div className="flex-1 h-1 bg-[#00f0ff]/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#00f0ff] w-2/3"></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-60">
                                            <div className="w-6 h-6 rounded bg-[#00f0ff]/20 flex items-center justify-center"><span className="material-symbols-outlined text-sm text-[#00f0ff]">photo_camera</span></div>
                                            <div className="flex-1 h-1 bg-[#00f0ff]/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#00f0ff] w-1/2"></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-60">
                                            <div className="w-6 h-6 rounded bg-[#00f0ff]/20 flex items-center justify-center"><span className="material-symbols-outlined text-sm text-[#00f0ff]">work</span></div>
                                            <div className="flex-1 h-1 bg-[#00f0ff]/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#00f0ff] w-3/4"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Floating Bottom Dock Navigation (Strict Port) */}
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className="glass-dock px-6 py-4 rounded-full flex items-center gap-8 shadow-2xl border-[#00f0ff]/20">
                    <a className="flex flex-col items-center gap-1 group cursor-pointer">
                        <span className="material-symbols-outlined text-[#00f0ff] text-2xl group-hover:scale-125 transition-transform">dashboard</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#00f0ff]/80 font-display">Gateway</span>
                    </a>
                    <a className="flex flex-col items-center gap-1 group opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="material-symbols-outlined text-white text-2xl group-hover:scale-125 transition-transform">lab_profile</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 font-display">Lab</span>
                    </a>
                    <div className="w-px h-8 bg-white/10 mx-2"></div>
                    <a className="flex flex-col items-center gap-1 group opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="material-symbols-outlined text-white text-2xl group-hover:scale-125 transition-transform">hub</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 font-display">Modules</span>
                    </a>
                    <a className="flex flex-col items-center gap-1 group opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="material-symbols-outlined text-white text-2xl group-hover:scale-125 transition-transform">notifications_active</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 font-display">Alerts</span>
                    </a>
                    <div className="w-px h-8 bg-white/10 mx-2"></div>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#00f0ff] p-0.5">
                            <div className="w-full h-full rounded-full bg-[#00f0ff]/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-lg">person</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Ambient Background Decoration (Strict Port) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-20">
                <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-[#00f0ff]/10 blur-[120px]"></div>
                <div className="absolute bottom-[10%] right-[5%] w-[30vw] h-[30vw] rounded-full bg-[#00f0ff]/5 blur-[100px]"></div>
            </div>
        </section>
    );
}
