'use client';

import React from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { motion } from 'framer-motion';

const inter = Inter({
    subsets: ['latin'],
    weight: ['100', '200', '300', '400', '500', '600', '700'],
    variable: '--font-inter',
});

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-10%" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
};

export default function MarketingHomePage() {
    return (
        <div className={`min-h-screen bg-[#050505] text-white selection:bg-[#f9f906] selection:text-black font-sans ${inter.variable}`}>

            {/* ═══════════════════════════════════════════════════════════════
                NAVIGATION
            ════════════════════════════════════════════════════════════════ */}
            <header className="px-6 lg:px-20 py-8 border-b border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-1 bg-[#f9f906]"></div>
                        <Link href="/" className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-white hover:text-[#f9f906] transition-colors">
                            AffeXAI Intelligence
                        </Link>
                    </div>
                    <div className="flex items-center gap-6 md:gap-12">
                        <nav className="hidden md:flex items-center gap-10">
                            <Link href="/modules" className="text-[10px] uppercase tracking-widest text-[#666] hover:text-white transition-colors">Modules</Link>
                            <Link href="/architecture" className="text-[10px] uppercase tracking-widest text-[#666] hover:text-white transition-colors">Architecture</Link>
                            <Link href="/features" className="text-[10px] uppercase tracking-widest text-[#666] hover:text-white transition-colors">Features</Link>
                            <Link href="/pricing" className="text-[10px] uppercase tracking-widest text-[#666] hover:text-white transition-colors">Pricing</Link>
                        </nav>
                        <div className="flex gap-4">
                            <Link href="/login" className="hidden md:flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] text-white text-[10px] font-bold uppercase tracking-widest px-6 h-9 hover:border-[#f9f906]/50 transition-colors">
                                Login
                            </Link>
                            <Link href="/pricing" className="flex items-center justify-center bg-[#f9f906] text-black text-[10px] font-bold uppercase tracking-widest px-6 h-9 hover:brightness-110 transition-all">
                                Request Access
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-6 lg:px-20 pb-20">

                {/* ═══════════════════════════════════════════════════════════
                    HERO — THE STATEMENT
                ════════════════════════════════════════════════════════════ */}
                <div className="pt-24 pb-32">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-white font-[100] text-[12vw] lg:text-[6vw] leading-[0.9] tracking-tighter max-w-[90%]"
                    >
                        THE INTELLIGENCE LAYER<br />
                        FOR BRAND PERCEPTION.
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mt-8 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4"
                    >
                        <span className="text-[10px] text-[#666] uppercase tracking-widest">System Disclosure v5.0 // Status: </span>
                        <span className="text-[10px] text-[#f9f906] uppercase tracking-widest">Operational</span>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="mt-12 text-[#999] text-lg md:text-xl font-[200] leading-relaxed max-w-2xl"
                    >
                        Signals from support, content, campaigns, and conversations converge into a single intelligence layer. Not reports. Not dashboards. A living model of brand behavior, perception, and direction.
                    </motion.p>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    EDITORIAL SPREAD — WHAT IS AFFEXAI
                ════════════════════════════════════════════════════════════ */}
                <div className="grid lg:grid-cols-[1fr_2fr] gap-16 lg:gap-32">

                    {/* Sticky Sidebar */}
                    <div className="hidden lg:block">
                        <div className="sticky top-10 border-l border-[#1a1a1a] pl-6 space-y-12">
                            <div>
                                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">System Blueprint</p>
                                <p className="text-xs text-[#999] leading-relaxed font-light">
                                    AffeXAI is a biological-industrial hybrid. Information flows through distinct strata of verification, transformation, and expression—engineered for autonomous brand orchestration.
                                </p>
                            </div>
                            <div className="pt-8 border-t border-[#1a1a1a]">
                                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">Signal Strata</p>
                                <div className="space-y-2">
                                    {[
                                        { id: '01', name: 'CONVERGENCE' },
                                        { id: '02', name: 'SYNTHESIS' },
                                        { id: '03', name: 'COMMAND' },
                                    ].map(layer => (
                                        <div key={layer.id} className="flex justify-between items-center text-[10px] font-mono">
                                            <span className="text-[#444]">Signal {layer.id}</span>
                                            <span className="text-white/40">{layer.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-8 border-t border-[#1a1a1a]">
                                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">Compliance</p>
                                <div className="space-y-2">
                                    {['ISO/IEC 27001', 'SOC 2 Type II', 'GDPR/CCPA'].map(cert => (
                                        <div key={cert} className="flex justify-between items-center text-[10px] font-mono">
                                            <span className="text-white/40">{cert}</span>
                                            <span className="text-[#f9f906]">VERIFIED</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Narrative */}
                    <div className="space-y-48">

                        {/* ─── Signal 01: Convergence ─── */}
                        <motion.section {...fadeInUp} className="max-w-3xl">
                            <span className="text-[10px] text-[#f9f906] font-mono mb-4 block tracking-[0.3em]">SIGNAL_01 // CONVERGENCE</span>
                            <h2 className="text-3xl md:text-5xl font-[200] text-white mb-8 tracking-tight italic">
                                Every Interaction Is<br />A Signal Worth Reading.
                            </h2>
                            <p className="text-[#999] text-lg md:text-xl font-[200] leading-relaxed mb-12">
                                Support tickets, social sentiment, campaign telemetry, and customer conversations are not isolated data points. They are the nervous system of your brand. AffeXAI converges these disparate vectors into a singular truth—a real-time pulse of how your brand is perceived, trusted, and remembered.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 border-t border-[#1a1a1a]">
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest text-[#f9f906] mb-3">Omni-Channel Ingestion</h4>
                                    <p className="text-xs text-[#666] leading-relaxed">Social media feeds, email campaigns, support queues, event check-ins—every touchpoint flows into a unified intelligence graph.</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest text-[#f9f906] mb-3">Semantic Deduplication</h4>
                                    <p className="text-xs text-[#666] leading-relaxed">Redundant signals are collapsed into distinct meaning-vectors using NLP-driven clustering, eliminating noise from the perception model.</p>
                                </div>
                            </div>
                        </motion.section>

                        {/* ─── Signal 02: Synthesis ─── */}
                        <motion.section {...fadeInUp} className="max-w-3xl">
                            <span className="text-[10px] text-[#f9f906] font-mono mb-4 block tracking-[0.3em]">SIGNAL_02 // NEURAL SYNTHESIS</span>
                            <h2 className="text-3xl md:text-5xl font-[200] text-white mb-8 tracking-tight italic">
                                RAG-Powered Context<br />That Remembers Your Brand.
                            </h2>
                            <p className="text-[#999] text-lg md:text-xl font-[200] leading-relaxed mb-12">
                                Intelligence is not merely processing—it is recollection. Our RAG (Retrieval-Augmented Generation) layer transforms static knowledge into active resonance. Using Qdrant vector databases, we retrieve semantic signals in milliseconds to ground every AI response in your brand's specific historical truth.
                            </p>
                            <div className="relative h-64 w-full bg-[#0a0a0a] border border-[#1a1a1a] p-8 overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#f9f906]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="flex flex-col h-full justify-between relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-mono text-[#f9f906]">SYNAPSE_SIGNAL_FLOW</div>
                                            <div className="w-32 h-[1px] bg-[#f9f906]/30"></div>
                                        </div>
                                        <span className="text-[9px] text-[#444] font-mono">ENCODING_1024_DIM</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 bg-[#f9f906] animate-pulse"></div>
                                            <div className="text-xs font-[100] text-white/40">Input Signal: &ldquo;Customer complaint about onboarding flow&rdquo;</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-[1px] bg-[#1a1a1a]"></div>
                                            <div className="text-xs font-[100] text-white/40 italic">Querying Vector Semantics...</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 bg-[#f9f906]"></div>
                                            <div className="text-xs font-bold text-[#f9f906]">Context Injected: &ldquo;Brand voice = Empathetic-Professional, Tone Authority = 0.87&rdquo;</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* ─── Signal 03: Command ─── */}
                        <motion.section {...fadeInUp} className="max-w-3xl">
                            <span className="text-[10px] text-[#f9f906] font-mono mb-4 block tracking-[0.3em]">SIGNAL_03 // THE COMMAND SURFACE</span>
                            <h2 className="text-3xl md:text-5xl font-[200] text-white mb-8 tracking-tight italic">
                                BCC: The Human-Machine<br />Command Interface.
                            </h2>
                            <p className="text-[#999] text-lg md:text-xl font-[200] leading-relaxed mb-12">
                                The surface is where logic becomes visceral. The Brand Communication Center is an editorial-grade console designed for the modern commander. Glassmorphic HUDs, real-time telemetry, and predictive heatmaps allow you to observe your brand as a living organism—not a set of spreadsheets.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Obsidian UI', val: 'Low Friction' },
                                    { label: 'HUD Telemetry', val: 'Live' },
                                    { label: 'Global Search', val: 'Instant' },
                                    { label: 'Neural Copilot', val: 'Active' }
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 border border-[#1a1a1a] bg-[#080808]">
                                        <div className="text-[9px] text-[#444] uppercase mb-1">{stat.label}</div>
                                        <div className="text-xs text-white uppercase tracking-tighter">{stat.val}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* ═══════════════════════════════════════════════════════
                            MODULE ARSENAL
                        ═══════════════════════════════════════════════════════ */}
                        <section>
                            <h2 className="text-white text-[10px] uppercase tracking-[0.3em] border-b border-[#1a1a1a] pb-6 mb-0">
                                Operational Module Index
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 border-l border-[#1a1a1a]">
                                {[
                                    { id: '01', name: 'SOCIAL_ARRAY', desc: 'Omni-channel signal monitoring and response matrix.', status: 'ACTIVE' },
                                    { id: '02', name: 'EVENT_HORIZON', desc: 'Physical and digital gathering orchestration system.', status: 'ACTIVE' },
                                    { id: '03', name: 'CAMPAIGN_RELAY', desc: 'High-volume outbound communication dispatcher.', status: 'ACTIVE' },
                                    { id: '04', name: 'SUPPORT_NEXUS', desc: 'Customer resolution and issue tracking core.', status: 'ACTIVE' },
                                    { id: '05', name: 'KNOWLEDGE_CORE', desc: 'Self-learning information architecture and FAQ engine.', status: 'STABLE' },
                                    { id: '06', name: 'CERT_AUTHORITY', desc: 'Automated credential issuance and verification.', status: 'ACTIVE' },
                                    { id: '07', name: 'STRATEGY_ENGINE', desc: 'AI-driven marketing strategy and content planning.', status: 'ACTIVE' },
                                    { id: '08', name: 'COMMERCE_LAYER', desc: 'Subscription billing, Stripe integration, and access tiers.', status: 'ACTIVE' }
                                ].map((mod) => (
                                    <motion.div
                                        key={mod.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-5%" }}
                                        transition={{ duration: 0.5 }}
                                        className="p-8 md:p-10 border-r border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors group min-h-[200px] flex flex-col justify-between"
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] text-[#444] block mb-4 group-hover:text-[#f9f906] transition-colors">
                                                {mod.id}.
                                            </span>
                                            <span className={`text-[9px] px-2 py-1 border ${mod.status === 'ACTIVE' ? 'border-[#f9f906]/30 text-[#f9f906]' : 'border-[#333] text-[#666]'} uppercase tracking-widest`}>
                                                {mod.status}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-white text-lg md:text-xl font-medium mb-3 tracking-tight group-hover:text-[#f9f906] transition-colors">
                                                {mod.name}
                                            </h3>
                                            <p className="text-[#888] text-sm leading-relaxed font-light">{mod.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════════════
                            SYSTEM MANIFESTOS
                        ═══════════════════════════════════════════════════════ */}
                        <section className="py-20 border-y border-[#1a1a1a]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="space-y-24"
                            >
                                <div>
                                    <span className="text-[#f9f906]/50 text-[10px] uppercase tracking-[0.5em] block mb-4">System Manifesto 01</span>
                                    <h2 className="text-white text-3xl md:text-5xl font-bold tracking-tighter leading-none">
                                        Growth is not managed;<br />it is orchestrated.
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#f9f906]/50 text-[10px] uppercase tracking-[0.5em] block mb-4">System Manifesto 02</span>
                                    <h2 className="text-white text-3xl md:text-5xl font-bold tracking-tighter leading-none">
                                        Perception is the only<br />true asset.
                                    </h2>
                                </div>
                                <div>
                                    <span className="text-[#f9f906]/50 text-[10px] uppercase tracking-[0.5em] block mb-4">System Manifesto 03</span>
                                    <h2 className="text-white text-3xl md:text-5xl font-bold tracking-tighter leading-none">
                                        Data without synthesis<br />is noise.
                                    </h2>
                                </div>
                            </motion.div>
                        </section>

                        {/* ═══════════════════════════════════════════════════════
                            INFRASTRUCTURE METRICS
                        ═══════════════════════════════════════════════════════ */}
                        <motion.section {...fadeInUp}>
                            <h2 className="text-white text-[10px] uppercase tracking-[0.3em] border-b border-[#1a1a1a] pb-6 mb-0">
                                Infrastructure Metrics
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
                                {[
                                    { label: 'Core Latency', value: '<0.002ms', sub: 'Near-instant inference' },
                                    { label: 'Uptime SLA', value: '99.95%', sub: 'Contractual guarantee' },
                                    { label: 'Tenant Isolation', value: 'ABSOLUTE', sub: 'Cryptographic enclaves' },
                                    { label: 'Neural Engine', value: 'v1.0.4', sub: 'RAG + Qdrant + Ollama' },
                                ].map((metric, i) => (
                                    <div key={i} className="bg-[#050505] p-6 md:p-8">
                                        <div className="text-[9px] text-[#444] uppercase tracking-widest mb-3">{metric.label}</div>
                                        <div className="text-xl md:text-2xl font-thin text-white mb-1 tracking-tight">{metric.value}</div>
                                        <div className="text-[9px] text-[#666] font-mono">{metric.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* ═══════════════════════════════════════════════════════
                            FINAL DIRECTIVE — CTA
                        ═══════════════════════════════════════════════════════ */}
                        <section className="pt-20 border-t border-[#1a1a1a]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1 }}
                                className="text-center py-24 bg-[#0a0a0a] border border-[#1a1a1a] relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#f9f906]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="relative z-10">
                                    <h3 className="text-white text-3xl md:text-4xl font-[200] mb-4">Experience the Symmetry.</h3>
                                    <p className="text-[#666] text-xs uppercase tracking-[0.2em] mb-12 max-w-lg mx-auto">
                                        Transition from legacy management to autonomous orchestration. The architecture is waiting.
                                    </p>
                                    <div className="flex flex-col md:flex-row justify-center gap-4">
                                        <Link
                                            href="/login"
                                            className="px-10 py-4 bg-[#f9f906] text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all"
                                        >
                                            Enter the System
                                        </Link>
                                        <Link
                                            href="/architecture"
                                            className="px-10 py-4 border border-[#2a2a2a] text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:border-[#f9f906]/50 hover:text-[#f9f906] transition-colors"
                                        >
                                            Explore Architecture
                                        </Link>
                                        <Link
                                            href="/pricing"
                                            className="px-10 py-4 border border-[#2a2a2a] text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:border-[#f9f906]/50 hover:text-[#f9f906] transition-colors"
                                        >
                                            View Access Tiers
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        </section>

                    </div>
                </div>
            </main>

            {/* ═══════════════════════════════════════════════════════════════
                INSTITUTIONAL FOOTER
            ════════════════════════════════════════════════════════════════ */}
            <footer className="mt-40 px-6 lg:px-20 py-20 border-t border-[#1a1a1a] bg-[#050505]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#f9f906]"></div>
                            <span className="text-xs font-bold tracking-widest uppercase">AffeXAI Core</span>
                        </div>
                        <p className="text-[10px] text-[#444] leading-relaxed max-w-sm uppercase tracking-wider font-mono">
                            Institutional Infrastructure for Autonomous Brand Perception. All rights reserved.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-6">
                        <div className="flex gap-10 text-[10px] text-[#666] uppercase tracking-[0.2em]">
                            <Link href="/features" className="hover:text-white cursor-pointer transition-colors">Features</Link>
                            <Link href="/modules" className="hover:text-white cursor-pointer transition-colors">Modules</Link>
                            <Link href="/architecture" className="hover:text-white cursor-pointer transition-colors">Architecture</Link>
                            <Link href="/pricing" className="hover:text-white cursor-pointer transition-colors">Pricing</Link>
                        </div>
                        <div className="text-[9px] text-[#333] font-mono uppercase tracking-widest">
                            Built on Next.js 15 // Neural Engine 1.0.4 // © 2026
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
