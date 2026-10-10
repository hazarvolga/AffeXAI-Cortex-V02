'use client';

import React from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { motion } from 'framer-motion';

// Load Fonts (Inter for that institutional look)
const inter = Inter({
    subsets: ['latin'],
    weight: ['100', '200', '300', '400', '500', '600', '700'],
    variable: '--font-inter',
});

export default function ModulesPage() {
    return (
        <div className={`min-h-screen bg-[#050505] text-white selection:bg-[#f9f906] selection:text-black font-sans ${inter.variable}`}>
            {/* Top Navigation Bar */}
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
                            <Link href="/modules" className="text-[10px] uppercase tracking-widest text-[#f9f906]">Modules</Link>
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
                {/* Monolithic Typographic Statement */}
                <div className="pt-24 pb-32">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-white font-[100] text-[12vw] lg:text-[6vw] leading-[0.9] tracking-tighter max-w-[90%]"
                    >
                        ARTIFICIAL INTELLIGENCE<br />
                        MARKETING INTELLIGENCE.
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mt-8 flex items-center gap-2"
                    >
                        <span className="text-[10px] text-[#666] uppercase tracking-widest">Protocol Version 5.0 // Status: </span>
                        <span className="text-[10px] text-[#f9f906] uppercase tracking-widest">Operational</span>
                    </motion.div>
                </div>

                {/* Asymmetric Editorial Spread */}
                <div className="grid lg:grid-cols-[1fr_2fr] gap-16 lg:gap-32">

                    {/* Left Column: Metadata (Sticky) */}
                    <div className="hidden lg:block">
                        <div className="sticky top-10 border-l border-[#1a1a1a] pl-6 space-y-12">
                            <div>
                                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">Institutional Anchor</p>
                                <p className="text-xs text-[#999] leading-relaxed font-light">
                                    Distributed ledger infrastructure for autonomous marketing logic verification. High-contrast logic dictates the flow of intelligence.
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">Location Index</p>
                                <p className="text-xs text-[#999] font-mono">Global Functional Nodes [01-08]</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">System Time</p>
                                <p className="text-xs text-[#999] font-mono">{new Date().toISOString().split('T')[0]} // UTC</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: The 'What' */}
                    <div className="space-y-32">
                        <div className="max-w-3xl">
                            <p className="text-[#e5e5e5] text-xl md:text-2xl font-[200] leading-relaxed">
                                A neutral infrastructure for market verification. The platform serves as a declarative system for data provenance and trust validation within complex AI ecosystems.
                            </p>
                        </div>

                        {/* Public Capabilities (Rigid Grid) */}
                        <section>
                            <h2 className="text-white text-[10px] uppercase tracking-[0.3em] border-b border-[#1a1a1a] pb-6 mb-0">Public Functional Capabilities</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 border-l border-[#1a1a1a]">
                                {[
                                    {
                                        id: '01',
                                        name: 'SOCIAL_ARRAY',
                                        desc: 'Omni-channel signal monitoring and response matrix.',
                                        status: 'ACTIVE'
                                    },
                                    {
                                        id: '02',
                                        name: 'EVENT_HORIZON',
                                        desc: 'Physical and digital gathering orchestration system.',
                                        status: 'ACTIVE'
                                    },
                                    {
                                        id: '03',
                                        name: 'CAMPAIGN_RELAY',
                                        desc: 'High-volume outbound communication dispatcher.',
                                        status: 'IDLE'
                                    },
                                    {
                                        id: '04',
                                        name: 'SUPPORT_NEXUS',
                                        desc: 'Customer resolution and issue tracking core.',
                                        status: 'ACTIVE'
                                    },
                                    {
                                        id: '05',
                                        name: 'KNOWLEDGE_CORE',
                                        desc: 'Self-learning information architecture.',
                                        status: 'STABLE'
                                    },
                                    {
                                        id: '06',
                                        name: 'CERT_AUTHORITY',
                                        desc: 'Automated credential issuance and verification.',
                                        status: 'ACTIVE'
                                    },
                                    {
                                        id: '07',
                                        name: 'VALIDATION_GATE',
                                        desc: 'Real-time syntax and deliverability verification.',
                                        status: 'ACTIVE'
                                    },
                                    {
                                        id: '08',
                                        name: 'THREAT_INDEX',
                                        desc: 'Global blocklist monitoring and sender score analysis.',
                                        status: 'ACTIVE'
                                    }
                                ].map((module, idx) => (
                                    <div key={idx} className="p-10 border-r border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors group min-h-[240px] flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] text-[#444] block mb-4 group-hover:text-[#f9f906] transition-colors">
                                                {module.id}.
                                            </span>
                                            <span className={`text-[9px] px-2 py-1 border ${module.status === 'ACTIVE' ? 'border-[#f9f906]/30 text-[#f9f906]' : 'border-[#333] text-[#666]'} uppercase tracking-widest`}>
                                                {module.status}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-white text-xl font-medium mb-3 tracking-tight group-hover:text-[#f9f906] transition-colors">
                                                {module.name}
                                            </h3>
                                            <p className="text-[#888] text-sm leading-relaxed font-light">
                                                {module.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Compliance Standards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                            <div>
                                <h4 className="text-[10px] text-[#666] uppercase tracking-widest mb-8">Compliance Standards</h4>
                                <ul className="text-xs text-[#ccc] space-y-6">
                                    <li className="flex justify-between border-b border-[#1a1a1a] pb-3">
                                        <span>ISO/IEC 27001</span>
                                        <span className="text-[#f9f906]">VERIFIED</span>
                                    </li>
                                    <li className="flex justify-between border-b border-[#1a1a1a] pb-3">
                                        <span>SOC 2 Type II</span>
                                        <span className="text-[#f9f906]">VERIFIED</span>
                                    </li>
                                    <li className="flex justify-between border-b border-[#1a1a1a] pb-3">
                                        <span>GDPR/CCPA Protocol</span>
                                        <span className="text-[#f9f906]">VERIFIED</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-[10px] text-[#666] uppercase tracking-widest mb-8">Network Latency</h4>
                                <div className="relative h-32 w-full bg-[#0a0a0a] flex items-center justify-center border border-[#1a1a1a] overflow-hidden group">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-transparent via-[#f9f906]/10 to-transparent transition-opacity duration-700"></div>
                                    <div className="text-center">
                                        <span className="block text-[32px] font-thin text-white mb-1">0.12<span className="text-sm text-[#666] ml-1">ms</span></span>
                                        <span className="text-[9px] text-[#444] uppercase tracking-widest">Global Average Response</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Access Threshold Section */}
                <section className="mt-40 pt-20 border-t border-[#1a1a1a]">
                    <div className="max-w-4xl mx-auto text-center py-24 bg-[#080808] border border-[#1a1a1a] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#f9f906]/50 to-transparent opacity-30"></div>

                        <h2 className="text-white text-3xl font-[200] mb-4">Access Threshold</h2>
                        <p className="text-[#666] text-[10px] mb-12 uppercase tracking-[0.2em]">Restricted to authorized institutional entities only.</p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 px-10">
                            <button className="min-w-[200px] h-14 bg-[#1a1a1a] border border-[#333] text-white text-[10px] font-bold uppercase tracking-widest hover:border-[#666] transition-all">
                                Request Authorization
                            </button>
                            <button className="min-w-[200px] h-14 bg-[#f9f906] text-black text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all">
                                Institutional Login
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
