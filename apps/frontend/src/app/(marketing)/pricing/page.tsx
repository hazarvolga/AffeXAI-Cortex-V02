'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Terminal, Database, Cpu, Activity, Loader2 } from 'lucide-react';
import { commerceService, Product } from '@/lib/api/commerceService';
import { PricingCard } from '@/components/marketing/PricingCard';

export default function PricingPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkingOut, setCheckingOut] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await commerceService.getProducts();
                // Sort by tier metadata
                setProducts(data.sort((a, b) => (a.metadata?.tier || 0) - (b.metadata?.tier || 0)));
            } catch (err: any) {
                console.error('Failed to load pricing', err);
                setError('Failed to load plans. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handlePurchase = async (product: any) => {
        // Find the best available price: prefer monthly, then any active price
        const monthlyPrice = product.prices?.find((p: any) => p.interval === 'month' && p.active);
        const anyActivePrice = product.prices?.find((p: any) => p.active);
        const selectedPrice = monthlyPrice || anyActivePrice;

        if (!selectedPrice) {
            alert('No active pricing available for this product.');
            return;
        }

        setCheckingOut(product.id);
        try {
            const priceIdentifier = selectedPrice.stripePriceId || selectedPrice.id;
            const { url } = await commerceService.createCheckoutSession(priceIdentifier);
            if (url) {
                window.location.href = url;
            }
        } catch (err: any) {
            console.error('Checkout failed:', err);
            // If unauthorized, redirect to login with return URL
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                const returnUrl = encodeURIComponent('/pricing');
                window.location.href = `/login?returnUrl=${returnUrl}`;
                return;
            }
            alert('Failed to start checkout. Please try again.');
        } finally {
            setCheckingOut(null);
        }
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden font-sans">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 px-6 lg:px-20 py-8 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-md">
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
                            <Link href="/pricing" className="text-[10px] uppercase tracking-widest text-[#f9f906]">Pricing</Link>
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

            <main className="flex-1 px-6 md:px-20 py-12 max-w-[1400px] mx-auto w-full">
                {/* Hero */}
                <section className="mb-24 pt-12 border-l border-[#f9bc06]/30 pl-8">
                    <p className="text-[#f9bc06] text-xs font-mono mb-4 tracking-[0.4em] uppercase">Status: Operational // Disclosure Active</p>
                    <h1 className="text-white key-headline hairline-text text-[64px] md:text-[110px] leading-[0.9] tracking-tighter max-w-4xl">
                        AffeXAI Intelligence Architecture
                    </h1>
                    <div className="mt-12 flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/3">
                            <p className="text-[#bbb39b] text-sm leading-relaxed font-light">
                                Formal disclosure of high-density neural infrastructure designed for institutional autonomy and synchronous cognitive operations.
                            </p>
                        </div>
                        <div className="hidden md:block h-[1px] bg-[#3a3527] flex-1 mt-4"></div>
                    </div>
                </section>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#3a3527] mb-24">
                    <div className="flex flex-col gap-4 p-8 border-b md:border-b-0 md:border-r border-[#3a3527]">
                        <p className="text-[#f9bc06]/60 text-[10px] font-mono tracking-widest uppercase">Metric: Neural Density</p>
                        <p className="text-white text-4xl font-bold font-mono">TIER 1.0</p>
                        <p className="text-[#554e3a] text-xs leading-normal">Optimization for institutional scalability.</p>
                    </div>
                    <div className="flex flex-col gap-4 p-8 border-b md:border-b-0 md:border-r border-[#3a3527] bg-[#f9bc06]/[0.02]">
                        <p className="text-[#f9bc06]/60 text-[10px] font-mono tracking-widest uppercase">System Origin</p>
                        <p className="text-white text-4xl font-bold font-mono">VERIFIED</p>
                        <p className="text-[#554e3a] text-xs leading-normal">Cryptographic signature validated.</p>
                    </div>
                    <div className="flex flex-col gap-4 p-8">
                        <p className="text-[#f9bc06]/60 text-[10px] font-mono tracking-widest uppercase">Core Latency</p>
                        <p className="text-white text-4xl font-bold font-mono">&lt;0.002MS</p>
                        <p className="text-[#554e3a] text-xs leading-normal">Near-instantaneous inference throughput.</p>
                    </div>
                </div>

                {/* Capabilities */}
                <div className="mb-8 flex items-baseline justify-between border-b border-[#3a3527] pb-4">
                    <h2 className="text-white text-3xl font-bold tracking-tighter uppercase">System Capabilities</h2>
                    <span className="text-[#554e3a] font-mono text-xs">SPEC_VERSION_04.4</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[#3a3527] border border-[#3a3527] mb-24">
                    {[
                        { icon: Terminal, title: 'Cognitive Modeling', desc: 'High-density parameter modeling for institutional infrastructure.' },
                        { icon: Database, title: 'Data Ingestion', desc: 'Synchronous ingestion of multi-vector datasets.' },
                        { icon: Cpu, title: 'Inference Load', desc: 'Optimized inference threading for 24/7 operations.' },
                        { icon: Activity, title: 'Operational Velocity', desc: 'Maximized throughput for ultra-low latency.' }
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex flex-col gap-6 bg-[#0a0a0a] p-8 group hover:bg-[#1a1a1a] transition-colors">
                            <Icon className="text-[#f9bc06] size-8 font-light" strokeWidth={1.5} />
                            <div className="flex flex-col gap-2">
                                <h3 className="text-white text-lg font-bold uppercase tracking-tight">{title}</h3>
                                <p className="text-[#bbb39b] text-sm font-light leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Access Tiers - REAL API */}
                <div className="mb-8 flex items-baseline justify-between border-b border-[#3a3527] pb-4">
                    <h2 className="text-white text-3xl font-bold tracking-tighter uppercase">Access Tiers</h2>
                    <span className="text-[#554e3a] font-mono text-xs">
                        {loading ? 'LOADING...' : `Dynamic Load: ${products.length} NODES`}
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-[#f9bc06] animate-spin" />
                        <span className="ml-4 text-[#bbb39b] text-sm font-mono">Fetching access tiers...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-24">
                        <p className="text-red-400 font-mono text-sm">{error}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                        {products.map((product) => (
                            <div key={product.id} className={`
                                flex flex-col h-full p-8 border hover:bg-[#1a1a1a]/50 transition-colors
                                ${product.metadata?.tier === 2
                                    ? 'border-[#f9bc06]/50 bg-[#f9bc06]/[0.03] relative overflow-hidden'
                                    : 'border-[#3a3527] bg-[#1a1a1a]/30'
                                }
                            `}>
                                {product.metadata?.tier === 2 && (
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className="text-[10px] font-mono text-[#f9bc06] uppercase bg-[#f9bc06]/10 px-2 py-1">
                                            Recommended
                                        </span>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <span className={`text-xs font-mono uppercase ${product.metadata?.tier === 2 ? 'text-[#f9bc06]' : 'text-[#554e3a]'}`}>
                                        {product.name}
                                    </span>
                                    <h3 className="text-xl font-bold uppercase mt-2 text-white">{product.name}</h3>
                                    <p className="text-xs font-light text-[#bbb39b] mt-2 min-h-[40px]">{product.description}</p>
                                </div>

                                <ul className="space-y-4 mb-12 flex-1">
                                    {product.features?.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-[#bbb39b] font-light">
                                            <span className={`mt-0.5 text-xs ${product.metadata?.tier === 2 ? 'text-[#f9bc06]' : 'text-[#bbb39b]'}`}>✓</span>
                                            <span className="text-white/80">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="pt-6 border-t border-[#3a3527]">
                                    {product.prices?.length > 0 && (
                                        <p className={`text-2xl font-mono tracking-tighter mb-4 ${product.metadata?.tier === 2 ? 'text-[#f9bc06]' : 'text-white'}`}>
                                            ${product.prices.find(p => p.interval === 'month')?.amount || '—'}
                                            <span className="text-xs text-[#554e3a] ml-1">/ mo</span>
                                        </p>
                                    )}
                                    <button
                                        onClick={() => handlePurchase(product)}
                                        disabled={checkingOut === product.id || !product.prices?.length}
                                        className={`
                                            w-full py-3 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50
                                            ${product.metadata?.tier === 2
                                                ? 'bg-[#f9bc06] text-black hover:bg-white hover:scale-[1.02]'
                                                : 'bg-transparent border border-[#3a3527] text-[#bbb39b] hover:border-white hover:text-white'
                                            }
                                        `}
                                    >
                                        {checkingOut === product.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                            </span>
                                        ) : 'Initialize Access'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <section className="bg-[#f9bc06] p-12 md:p-24 text-center">
                    <h2 className="text-black text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-6">Initialize Authorization</h2>
                    <p className="text-black/80 max-w-2xl mx-auto text-lg mb-12 font-medium">
                        The AffeXAI architecture is currently accepting institutional requests.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Link href="/login" className="bg-black text-[#f9bc06] px-10 py-4 font-bold uppercase text-sm tracking-widest hover:bg-zinc-900 transition-colors">
                            Begin Security Vetting
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="px-6 md:px-20 py-12 border-t border-[#3a3527] bg-[#0a0a0a]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 text-white">
                            <div className="size-4 text-[#f9bc06]">
                                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                                </svg>
                            </div>
                            <h2 className="text-white text-sm font-bold uppercase tracking-widest">AffeXAI</h2>
                        </div>
                        <p className="text-[#554e3a] text-[10px] font-mono">SYSTEM_ID: 882-AFX-2024 // ALL RIGHTS RESERVED</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 bg-[#f9bc06] rounded-full animate-pulse"></div>
                        <span className="text-[#bbb39b] text-[10px] font-mono uppercase tracking-tighter">System Pulse: Steady</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
