'use client';

import React, { useState } from 'react';

// --- DATA STRUCTURES ---

const LAYERS = [
    { id: 'neural', name: 'NEURAL CORE', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/5' },
    { id: 'business', name: 'BUSINESS LOGIC', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' },
    { id: 'comm', name: 'COMMUNICATION', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/5' },
    { id: 'infra', name: 'INFRASTRUCTURE', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
    { id: 'utility', name: 'UTILITIES', color: 'text-slate-400', border: 'border-slate-500/30', bg: 'bg-slate-500/5' },
];

const MODULES = [
    // NEURAL CORE (Brain)
    { id: 'cortex', layer: 'neural', name: 'Cortex (RAG)', desc: 'Vector Memory & Semantic Search (all-MiniLM-L6-v2)', inputs: ['Signals', 'Files', 'URLs'], outputs: ['Embeddings', 'Context'] },
    { id: 'strategy', layer: 'neural', name: 'Strategy Engine', desc: 'Decision Logic & AI Orchestrator', inputs: ['Context', 'Goals'], outputs: ['Actions', 'Signals'] },
    { id: 'analytics', layer: 'neural', name: 'Insight Engine', desc: 'Autonomous Multi-module Strategy Engine', inputs: ['All Signals', 'MarketData'], outputs: ['Directives', 'Reports'] },
    { id: 'crawler', layer: 'neural', name: 'Neural Crawler', desc: 'Autonomous Web & Social Intelligence Gathering', inputs: ['Keywords', 'Trends'], outputs: ['MarketSignals', 'Intelligence'] },
    { id: 'trust', layer: 'neural', name: 'Trust Dynamics', desc: 'Mathematical Trust Prediction Model', inputs: ['Resonance', 'Friction'], outputs: ['TrustScore', 'Prediction'] },
    { id: 'faq', layer: 'neural', name: 'FAQ Learning', desc: 'Self-improving Knowledge Loop', inputs: ['ChatLogs', 'Tickets'], outputs: ['NewQA', 'Signals'] },

    // BUSINESS (Organs)
    { id: 'crm', layer: 'business', name: 'CRM Intelligence', desc: 'Customer "Neural Identity" & Scoring', inputs: ['UserActivity', 'Signals'], outputs: ['ResonanceScore'] },
    { id: 'brand', layer: 'business', name: 'Brand Resonance', desc: 'Market Positioning Topology', inputs: ['Social', 'Feedback'], outputs: ['BrandHealth'] },
    { id: 'commerce', layer: 'business', name: 'Commerce', desc: 'Resource Quotas & Monetization', inputs: ['Usage'], outputs: ['Limits', 'Invoices'] },
    { id: 'events', layer: 'business', name: 'Events', desc: 'Physical/Digital Gathering Mgmt', inputs: ['UserAction'], outputs: ['EventSignal'] },
    { id: 'tickets', layer: 'business', name: 'Tickets', desc: 'Support & SLA Resolution', inputs: ['Queries'], outputs: ['Resolution'] },
    { id: 'forms', layer: 'business', name: 'Forms', desc: 'Structured Data Ingestion', inputs: ['UserInput'], outputs: ['RawData'] },
    { id: 'bcc', layer: 'business', name: 'BCC Overseer', desc: 'Brand Communication & Orchestration', inputs: ['All Signals'], outputs: ['Directives'] },
    { id: 'knowledge', layer: 'business', name: 'Knowledge Src', desc: 'Raw Info Gathering (Scraping)', inputs: ['URLs', 'Files'], outputs: ['RawContent'] },

    // COMMUNICATION (Voice)
    { id: 'social', layer: 'comm', name: 'Social Media', desc: 'Multi-channel Publishing & Listening', inputs: ['Content', 'Strategy'], outputs: ['Posts', 'Engagement'] },
    { id: 'email', layer: 'comm', name: 'Email Mkt', desc: 'Campaigns & Neural Newsletters', inputs: ['Segments', 'Content'], outputs: ['Emails', 'OpenRates'] },
    { id: 'chat', layer: 'comm', name: 'Live Chat', desc: 'Real-time Neural Interface', inputs: ['Messages'], outputs: ['Responses'] },
    { id: 'notif', layer: 'comm', name: 'Notifications', desc: 'System-wide Alert Routing', inputs: ['Events'], outputs: ['Push/WS'] },

    // INFRASTRUCTURE (Skeleton)
    { id: 'users', layer: 'infra', name: 'User Mgmt', desc: 'Identity & Authentication', inputs: ['Auth'], outputs: ['Session'] },
    { id: 'orgs', layer: 'infra', name: 'Organizations', desc: 'Multi-tenancy Isolation', inputs: ['TenantID'], outputs: ['Scope'] },
    { id: 'roles', layer: 'infra', name: 'RBAC', desc: 'Permission Governance', inputs: ['Request'], outputs: ['Access'] },
    { id: 'logs', layer: 'infra', name: 'System Logs', desc: 'Audit Trail & Telemetry', inputs: ['Actions'], outputs: ['LogFile'] },
    { id: 'backup', layer: 'infra', name: 'Backup', desc: 'Data Resilience & Recovery', inputs: ['DB'], outputs: ['Snapshot'] },
    { id: 'media', layer: 'infra', name: 'Media Engine', desc: 'S3 Asset Management', inputs: ['Files'], outputs: ['CDN_URL'] },
    { id: 'certs', layer: 'infra', name: 'Certificates', desc: 'SSL & Security Trust', inputs: ['Domains'], outputs: ['SSL'] },
    { id: 'settings', layer: 'infra', name: 'Settings', desc: 'Global Configuration', inputs: ['Config'], outputs: ['Env'] },

    // UTILITIES (Tools)
    { id: 'integrations', layer: 'utility', name: 'Integrations', desc: '3rd Party API Bridge', inputs: ['API Keys'], outputs: ['DataStream'] },
    { id: 'mail', layer: 'utility', name: 'Transactional', desc: 'System Email Delivery', inputs: ['Templates'], outputs: ['SMTP'] },
    { id: 'import', layer: 'utility', name: 'Data Import', desc: 'Migration Tools', inputs: ['CSV/JSON'], outputs: ['Records'] },
    { id: 'shared', layer: 'utility', name: 'Shared Lib', desc: 'Core Utilities & Helpers', inputs: ['-'], outputs: ['Functions'] },
];

export default function ManifestoPage() {
    const [hoveredModule, setHoveredModule] = useState<string | null>(null);

    return (
        <main className="min-h-screen bg-[#020202] text-white font-mono selection:bg-purple-900 selection:text-white pb-32">

            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 w-full z-50 bg-[#020202]/90 backdrop-blur-md border-b border-white/5 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 animate-pulse rounded-sm" />
                    <span className="text-xs tracking-[0.3em] font-bold text-white/80">NEURAL GRID BLUEPRINT v2.0</span>
                </div>
                <div className="text-[10px] text-white/30">
                    SYSTEM STATUS: <span className="text-purple-500 animate-pulse uppercase">PHASE 1: NEURAL GRID ACTIVE</span>
                </div>
            </header>

            <div className="pt-32 px-8 max-w-[1920px] mx-auto">

                {/* --- INTRO --- */}
                <div className="mb-20 max-w-4xl">
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-none">
                        THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">CYBERNETIC</span><br />
                        ARCHITECTURE
                    </h1>
                    <p className="text-xl text-white/50 leading-relaxed border-l-2 border-purple-500/50 pl-6">
                        AffeXAI is not a collection of features. It is a hierarchical system of <span className="text-white">30 interdependent modules</span> organized into 5 functional layers.
                        This blueprint maps the neural pathways, mathematical models, and signal flow that creates institutional autonomy.
                    </p>
                </div>

                {/* --- THE SYSTEM MAP (GRID) --- */}
                <div className="relative border border-white/10 bg-[#050505] p-12 rounded-xl overflow-hidden shadow-2xl">

                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    {/* LAYERS LOOP */}
                    <div className="relative z-10 flex flex-col gap-16">
                        {LAYERS.map((layer) => (
                            <div key={layer.id} className="relative group">
                                {/* Layer Label */}
                                <div className={`absolute -left-10 top-0 bottom-0 w-1 ${layer.bg.replace('/5', '/50')} rounded-full`} />
                                <h3 className={`text-sm tracking-[0.2em] font-bold mb-6 ${layer.color} pl-4 opacity-50`}>{layer.name}</h3>

                                {/* Modules Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {MODULES.filter(m => m.layer === layer.id).map((mod) => (
                                        <div
                                            key={mod.id}
                                            onMouseEnter={() => setHoveredModule(mod.id)}
                                            onMouseLeave={() => setHoveredModule(null)}
                                            className={`
                                                relative p-5 border border-white/5 rounded-lg transition-all duration-300
                                                cursor-crosshair hover:border-opacity-50 hover:bg-white/[0.02]
                                                ${hoveredModule === mod.id ? `${layer.border} scale-105 z-20 bg-[#0a0a0a]` : 'border-white/5'}
                                                ${hoveredModule && hoveredModule !== mod.id ? 'opacity-30 blur-[1px]' : 'opacity-100'}
                                            `}
                                        >
                                            {/* Connector Dot (Visual) */}
                                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white/20" />

                                            <div className={`text-xs font-bold mb-2 ${layer.color}`}>{mod.name}</div>
                                            <div className="text-[10px] text-white/50 leading-snug h-8 mb-4">{mod.desc}</div>

                                            {/* I/O Tags */}
                                            <div className="flex justify-between items-end mt-auto text-[9px] font-mono text-white/30">
                                                <div className="flex flex-col gap-1">
                                                    <span className="uppercase text-[8px] opacity-50">IN</span>
                                                    {mod.inputs.map(i => <span key={i} className="bg-white/5 px-1 rounded">{i}</span>)}
                                                </div>
                                                <div className="flex flex-col gap-1 text-right">
                                                    <span className="uppercase text-[8px] opacity-50">OUT</span>
                                                    {mod.outputs.map(o => <span key={o} className="bg-white/5 px-1 rounded">{o}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CONNECTING LINES (Conceptual SVG Overlay) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0">
                        {/* Just a visual representation of vertical flow */}
                        <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="url(#gradient-line)" strokeWidth="2" strokeDasharray="5,5" />
                        <defs>
                            <linearGradient id="gradient-line" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#a855f7" />
                                <stop offset="50%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* --- 3. MATHEMATICAL CORE --- */}
                <div className="mt-32">
                    <h2 className="text-4xl font-bold mb-12 flex items-center gap-4">
                        <span className="text-purple-500">II.</span> THE MATHEMATICS OF TRUST
                        <span className="h-px bg-white/10 flex-grow" />
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* TRUST INDEX */}
                        <div className="bg-[#050505] border border-white/10 p-10 rounded-xl relative group">
                            <div className="absolute top-0 right-0 p-4 text-xs font-mono text-white/20">src/modules/trust-dynamics</div>
                            <h3 className="text-2xl font-bold text-white mb-6">Trust Index Algorithm</h3>
                            <p className="text-white/50 mb-8 text-sm">
                                Trust is calculated as a weighted vector of 3 core dimensions.
                                The system forecasts this value 7 days into the future using linear regression.
                            </p>

                            <div className="font-mono text-sm bg-black/50 p-6 rounded-lg border border-white/5 text-purple-200">
                                <span className="opacity-50">// The Core Formula</span><br />
                                <span className="text-purple-400">T</span> =
                                (<span className="text-blue-400">R</span> * 0.40) +
                                (<span className="text-green-400">C</span> * 0.35) +
                                (<span className="text-orange-400">F_inv</span> * 0.25)
                            </div>

                            <div className="mt-6 space-y-3 text-xs font-mono">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-blue-400 font-bold">R (Resonance)</span>
                                    <span className="text-white/50">Emotional Alignment intensity</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-green-400 font-bold">C (Convergence)</span>
                                    <span className="text-white/50">Consistency of brand messaging</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-orange-400 font-bold">F_inv (100 - Friction)</span>
                                    <span className="text-white/50">Inverse of user resistance/complaints</span>
                                </div>
                            </div>
                        </div>

                        {/* RESONANCE SCORE */}
                        <div className="bg-[#050505] border border-white/10 p-10 rounded-xl relative group">
                            <div className="absolute top-0 right-0 p-4 text-xs font-mono text-white/20">src/modules/crm</div>
                            <h3 className="text-2xl font-bold text-white mb-6">Customer Resonance Model</h3>
                            <p className="text-white/50 mb-8 text-sm">
                                We quantify the "vibe" of every customer relationship.
                                This score dictates how the AI adapts its tone and offer strategy.
                            </p>

                            <div className="font-mono text-sm bg-black/50 p-6 rounded-lg border border-white/5 text-amber-200">
                                <span className="opacity-50">// The "Neural ID" Score</span><br />
                                <span className="text-amber-400">NeuralScore</span> = <br />
                                <span className="ml-4">(<span className="text-pink-400">Sentiment</span> * 0.5) +</span><br />
                                <span className="ml-4">(<span className="text-teal-400">Interaction</span> * 0.3) +</span><br />
                                <span className="ml-4">(<span className="text-red-400">1 - Friction</span> * 0.2)</span>
                            </div>

                            <div className="mt-6 flex gap-4 text-xs">
                                <div className="bg-pink-500/10 text-pink-400 px-3 py-1 rounded">❤️ Sentiment Analysis</div>
                                <div className="bg-teal-500/10 text-teal-400 px-3 py-1 rounded">🔄 Frequency</div>
                                <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded">🚧 Ticket Volume</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 4. THE SIGNAL FLOW (DIAGRAM) --- */}
                <div className="mt-32 pb-20">
                    <h2 className="text-4xl font-bold mb-12 flex items-center gap-4">
                        <span className="text-emerald-500">III.</span> THE NEURAL GRID FLOW
                        <span className="h-px bg-white/10 flex-grow" />
                    </h2>

                    <div className="bg-[#0a0a0a] rounded-xl p-12 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">

                        {/* Flow Visual */}
                        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full max-w-5xl z-10">
                            {/* SOURCE */}
                            <div className="w-full md:w-1/4 text-center">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-4">SOURCES</div>
                                <div className="space-y-2">
                                    <div className="bg-blue-500/20 border border-blue-500/50 p-3 rounded font-mono text-xs">Omni-Channel (EE-Signals)</div>
                                    <div className="bg-purple-500/20 border border-purple-500/50 p-3 rounded font-mono text-xs italic">Neural Crawler (Web/X Intelligence)</div>
                                    <div className="bg-blue-500/20 border border-blue-500/50 p-3 rounded font-mono text-xs">Success Multipliers (Rewards)</div>
                                </div>
                            </div>

                            {/* ARROW */}
                            <div className="text-white/20 text-4xl hidden md:block">→</div>

                            {/* PROCESSING (THE FIX) */}
                            <div className="w-full md:w-1/4 text-center relative">
                                <div className="text-[10px] uppercase tracking-widest text-green-400 mb-4 animate-pulse">PHASE 1: THE BACKBONE</div>
                                <div className="bg-[#050505] border-2 border-green-500 p-6 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                    <div className="font-bold text-lg mb-2">NeuralGrid Service</div>
                                    <div className="text-xs text-white/50">Reward-Drive Ingestion</div>
                                    <div className="my-3 h-px bg-white/10"></div>
                                    <div className="text-[10px] font-mono text-green-400">@OnEvent('neural.signal')</div>
                                </div>
                            </div>

                            {/* ARROW */}
                            <div className="text-white/20 text-4xl hidden md:block">→</div>

                            {/* BRAIN */}
                            <div className="w-full md:w-1/4 text-center">
                                <div className="text-[10px] uppercase tracking-widest text-purple-400 mb-4">CORTEX MEMORY</div>
                                <div className="bg-purple-900/20 border border-purple-500 p-6 rounded-xl flex flex-col items-center">
                                    <div className="w-12 h-12 bg-purple-500 rounded-full blur-md absolute opacity-20"></div>
                                    <div className="relative z-10 font-bold mb-1">Vector Store</div>
                                    <div className="text-[10px] text-white/60 font-mono">Qdrant / Embeddings</div>
                                </div>
                            </div>
                        </div>

                        {/* RECURSIVE LOOP LINE */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 opacity-50" />
                    </div>
                </div>

            </div>
        </main>
    );
}
