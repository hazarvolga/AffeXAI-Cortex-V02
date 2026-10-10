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

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-10%" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.15 } },
    viewport: { once: true, margin: "-10%" }
};

export default function ArchitecturePage() {
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
                            <Link href="/modules" className="text-[10px] uppercase tracking-widest text-[#666] hover:text-white transition-colors">Modules</Link>
                            <Link href="/architecture" className="text-[10px] uppercase tracking-widest text-[#f9f906]">Architecture</Link>
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
                {/* Hero Section: The Topology Statement */}
                <div className="pt-24 pb-32">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-white font-[100] text-[12vw] lg:text-[6vw] leading-[0.9] tracking-tighter max-w-[90%]"
                    >
                        THE NEURAL TOPOLOGY.<br />
                        BUREAUCRACY REPLACED BY LOGIC.
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mt-8 flex items-center gap-2"
                    >
                        <span className="text-[10px] text-[#666] uppercase tracking-widest">Architectural Ledger v5.0 // Core Distribution: </span>
                        <span className="text-[10px] text-[#f9f906] uppercase tracking-widest">Decentralized Multi-Tenant</span>
                    </motion.div>
                </div>

                {/* The Three Layers of Sovereignty */}
                <div className="grid lg:grid-cols-[1fr_2fr] gap-16 lg:gap-32">

                    {/* Sticky Sidebar Documentation */}
                    <div className="hidden lg:block">
                        <div className="sticky top-10 border-l border-[#1a1a1a] pl-6 space-y-12">
                            <div>
                                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">System Blueprint</p>
                                <p className="text-xs text-[#999] leading-relaxed font-light">
                                    AffeXAI is structured as a biological-industrial hybrid. Information flows through distinct strata of verification, transformation, and expression.
                                </p>
                            </div>
                            <div className="pt-8 border-t border-[#1a1a1a]">
                                <p className="text-[10px] text-[#666] uppercase tracking-widest mb-3">Operational Clusters</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-[#444]">Layer 01</span>
                                        <span className="text-white/40">INFRASTRUCTURE</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-[#444]">Layer 02</span>
                                        <span className="text-white/40">INTELLIGENCE</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-[#444]">Layer 03</span>
                                        <span className="text-white/40">INTERACTION</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: The Narrative */}
                    <div className="space-y-48">

                        {/* Layer 01: The Soil (Infrastructure) */}
                        <motion.section
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="max-w-3xl"
                        >
                            <span className="text-[10px] text-[#f9f906] font-mono mb-4 block tracking-[0.3em]">LAYER_01 // THE SOIL</span>
                            <h2 className="text-3xl md:text-5xl font-[200] text-white mb-8 tracking-tight italic">
                                Immutable Integrity Through<br />Multi-Tenant Seclusion.
                            </h2>
                            <p className="text-[#999] text-lg md:text-xl font-[200] leading-relaxed mb-12">
                                At the base of the topology lies the Soil—a high-durability infrastructure layer designed for absolute data isolation. Every tenant operates within a cryptographic enclave, ensuring that brand intelligence remained siloed, secure, and sovereign.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 border-t border-[#1a1a1a]">
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest text-[#f9f906] mb-3">Secluded Persistence</h4>
                                    <p className="text-xs text-[#666] leading-relaxed">Dedicated PostgreSQL schemas for every entity. Data contamination is mathematically impossible within the AffeXAI core.</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest text-[#f9f906] mb-3">Sync Latency</h4>
                                    <p className="text-xs text-[#666] leading-relaxed">Real-time DB synchronization with zero-downtime migration protocols. Scalability is baked into the ledger itself.</p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Layer 02: The Neural Network (Intelligence) */}
                        <motion.section
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="max-w-3xl"
                        >
                            <span className="text-[10px] text-[#f9f906] font-mono mb-4 block tracking-[0.3em]">LAYER_02 // THE NEURAL NET</span>
                            <h2 className="text-3xl md:text-5xl font-[200] text-white mb-8 tracking-tight italic">
                                RAG-Powered Context<br />Extraction & Synthesis.
                            </h2>
                            <p className="text-[#999] text-lg md:text-xl font-[200] leading-relaxed mb-12">
                                Intelligence is not just processing; it is recollection. Our RAG (Retrieval-Augmented Generation) layer transforms static knowledge into active resonance. Using Qdrant Vector Databases, we retrieve semantic signals in milliseconds to ground AI responses in your brand's specific historical truth.
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
                                            <div className="text-xs font-[100] text-white/40">Input Signal Detected: "Support Ticket #772"</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-[1px] bg-[#1a1a1a]"></div>
                                            <div className="text-xs font-[100] text-white/40 italic">Querying Vector Semantics...</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 bg-[#f9f906]"></div>
                                            <div className="text-xs font-bold text-[#f9f906]">Context Injected: "Brand Tone is Authority-Minimalist"</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Layer 03: The Surface (Interaction) */}
                        <motion.section
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="max-w-3xl"
                        >
                            <span className="text-[10px] text-[#f9f906] font-mono mb-4 block tracking-[0.3em]">LAYER_03 // THE SURFACE</span>
                            <h2 className="text-3xl md:text-5xl font-[200] text-white mb-8 tracking-tight italic">
                                BCC: The Human-Machine<br />Command Interface.
                            </h2>
                            <p className="text-[#999] text-lg md:text-xl font-[200] leading-relaxed mb-12">
                                The Surface is where logic becomes visceral. The Brand Communication Center (BCC) is an editorial-grade console designed for the modern commander. Glassmorphic HUDs, real-time telemetry, and predictive heatmaps allow you to observe your brand as a living organism rather than a set of spreadsheets.
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

                        {/* Final Directive */}
                        <section className="pt-20 border-t border-[#1a1a1a]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1 }}
                                className="text-center py-24 bg-[#0a0a0a] border border-[#1a1a1a] relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[#f9f906]/-[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <h3 className="text-white text-3xl font-[200] mb-6">Experience the Symmetry.</h3>
                                <p className="text-[#666] text-xs uppercase tracking-[0.2em] mb-12 max-w-md mx-auto">Transition from legacy management to autonomous orchestration.</p>
                                <div className="flex justify-center gap-4">
                                    <Link href="/modules" className="px-10 py-4 bg-[#f9f906] text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all">
                                        Explore Modules
                                    </Link>
                                </div>
                            </motion.div>
                        </section>

                    </div>
                </div>
            </main>

            {/* Institutional Footer */}
            <footer className="mt-40 px-6 lg:px-20 py-20 border-t border-[#1a1a1a] bg-[#050505]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#f9f906]"></div>
                            <span className="text-xs font-bold tracking-widest uppercase">AffeXAI Core</span>
                        </div>
                        <p className="text-[10px] text-[#444] leading-relaxed max-w-sm uppercase tracking-wider font-mono">
                            Institutional Infrastructure for Autonomous Brand Perception. No rights reserved to the machines.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-6">
                        <div className="flex gap-10 text-[10px] text-[#666] uppercase tracking-[0.2em]">
                            <span className="hover:text-white cursor-pointer transition-colors">Privacy Protocol</span>
                            <span className="hover:text-white cursor-pointer transition-colors">Terms of Logic</span>
                            <span className="hover:text-white cursor-pointer transition-colors">Security Grid</span>
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
