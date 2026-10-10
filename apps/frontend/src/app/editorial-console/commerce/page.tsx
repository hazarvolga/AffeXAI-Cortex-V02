'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import {
    Search, Plus, Package, Zap, Users, DollarSign,
    RefreshCw, Loader2, AlertCircle, Edit, Archive, CheckCircle, ExternalLink
} from 'lucide-react';
import { commerceService, Product, UsageStats, UserLimit } from '@/lib/api/commerceService';

export default function CommerceControlPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [userLimits, setUserLimits] = useState<UserLimit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [archiving, setArchiving] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [productsData, usageData, limitsData] = await Promise.all([
                commerceService.getAdminProducts(),
                commerceService.getUsageStats().catch(() => null),
                commerceService.getUserLimits().catch(() => null),
            ]);
            setProducts(productsData);
            setUsage(usageData);
            setUserLimits(limitsData);
        } catch (err: any) {
            console.error('Commerce data load failed', err);
            setError('Failed to load commerce data. Check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleArchive = async (id: string, name: string) => {
        if (!confirm(`Archive "${name}"? This will deactivate it on Stripe.`)) return;
        setArchiving(id);
        try {
            await commerceService.deleteProduct(id);
            loadData();
        } catch (err) {
            console.error('Archive failed', err);
            alert('Failed to archive product');
        } finally {
            setArchiving(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeProducts = products.filter(p => p.active);
    const totalRevenue = products.reduce((sum, p) => {
        const monthlyPrice = p.prices?.find(pr => pr.interval === 'month');
        return sum + (monthlyPrice?.amount || 0);
    }, 0);
    const seatUsed = userLimits ? userLimits.limit - userLimits.remaining : 0;

    return (
        <BccEditorialWrapper
            headerTitle="Commerce Control"
            headerSubtitle="Package management, pricing, and platform billing."
            headerBadge="COMMERCE_OPS"
            theme="super-admin"
            hideSidebar={true}
            telemetryData={[
                { label: "TOTAL_SKUS", value: products.length.toString() },
                { label: "ACTIVE", value: activeProducts.length.toString(), color: "#9df425" },
                { label: "MRR_POTENTIAL", value: `$${totalRevenue}`, color: "#00f0ff" },
            ]}
        >
            <div className="space-y-8 pb-12">

                {/* Commerce Intelligence Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5">
                    <div className="bg-[#0a0a0a] p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-3 h-3 text-[#9df425]" />
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Packages</span>
                        </div>
                        <p className="text-2xl font-bold font-mono text-white">{activeProducts.length}<span className="text-white/30 text-sm">/{products.length}</span></p>
                    </div>
                    <div className="bg-[#0a0a0a] p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-3 h-3 text-[#00f0ff]" />
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">MRR Potential</span>
                        </div>
                        <p className="text-2xl font-bold font-mono text-[#00f0ff]">${totalRevenue}</p>
                    </div>
                    <div className="bg-[#0a0a0a] p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-3 h-3 text-[#f9bc06]" />
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Token Usage</span>
                        </div>
                        <p className="text-2xl font-bold font-mono text-white">
                            {usage ? `${((usage.used / usage.limit) * 100).toFixed(0)}%` : '—'}
                        </p>
                    </div>
                    <div className="bg-[#0a0a0a] p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-3 h-3 text-[#9df425]" />
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Seats</span>
                        </div>
                        <p className="text-2xl font-bold font-mono text-white">
                            {userLimits ? `${seatUsed}/${userLimits.limit}` : '—'}
                        </p>
                    </div>
                </div>

                {/* Control Bar */}
                <div className="bg-[#0a0a0a]/40 border border-white/5 p-3 md:p-4 backdrop-blur-md flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-4">
                    <div className="relative w-full md:w-96 group">
                        <input
                            type="text"
                            placeholder="SEARCH_PACKAGES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 p-3 pl-10 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-[#9df425] transition-colors uppercase tracking-wider"
                        />
                        <Search className="absolute left-3 top-3.5 w-4 h-4 text-white/30 group-focus-within:text-[#9df425] transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 md:px-4 py-3 border border-white/10 hover:border-[#9df425] hover:text-[#9df425] transition-all group bg-black/50"
                        >
                            <RefreshCw className={`w-3 h-3 text-white/40 group-hover:text-[#9df425] ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-[#9df425] hidden md:inline">Refresh</span>
                        </button>
                        <button
                            onClick={() => router.push('/editorial-console/commerce/create')}
                            className="flex items-center gap-2 px-4 md:px-6 py-3 bg-[#9df425] text-black hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(157,244,37,0.2)]"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">New Package</span>
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/5 text-red-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-mono">{error}</span>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-6 h-6 text-[#9df425] animate-spin" />
                        <span className="ml-3 text-xs font-mono text-white/40 uppercase tracking-widest">Loading packages...</span>
                    </div>
                )}

                {/* Product Table */}
                {!loading && !error && (
                    <div className="border border-white/5 bg-[#0a0a0a]/50 overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40 font-bold border-b border-white/5">
                                <tr>
                                    <th className="py-3 px-4 md:px-6">Package</th>
                                    <th className="py-3 px-4 md:px-6">Price</th>
                                    <th className="py-3 px-4 md:px-6 hidden md:table-cell">Tokens</th>
                                    <th className="py-3 px-4 md:px-6 hidden md:table-cell">Users</th>
                                    <th className="py-3 px-4 md:px-6">Status</th>
                                    <th className="py-3 px-4 md:px-6">Stripe</th>
                                    <th className="py-3 px-4 md:px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredProducts.map((product) => {
                                    const monthlyPrice = product.prices?.find(pr => pr.interval === 'month');
                                    return (
                                        <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 px-4 md:px-6">
                                                <div className="font-bold text-white">{product.name}</div>
                                                <div className="text-[10px] text-white/30 font-mono mt-0.5 line-clamp-1">{product.description || '—'}</div>
                                            </td>
                                            <td className="py-4 px-4 md:px-6 font-mono text-white/80">
                                                ${monthlyPrice?.amount || 0}<span className="text-white/30">/mo</span>
                                            </td>
                                            <td className="py-4 px-4 md:px-6 font-mono text-white/80 hidden md:table-cell">
                                                {(product.metadata as any)?.ai_tokens?.toLocaleString() || '—'}
                                            </td>
                                            <td className="py-4 px-4 md:px-6 font-mono text-white/80 hidden md:table-cell">
                                                {(product.metadata as any)?.max_users || '—'}
                                            </td>
                                            <td className="py-4 px-4 md:px-6">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${product.active ? 'text-[#9df425]' : 'text-white/20'}`}>
                                                    {product.active ? 'Active' : 'Archived'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 md:px-6">
                                                {product.stripeProductId ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#9df425]">
                                                        <CheckCircle className="w-3 h-3" /> Synced
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff8c00]">Local</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 md:px-6 text-right">
                                                <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => router.push(`/editorial-console/commerce/${product.id}`)}
                                                        className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-[#9df425] transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleArchive(product.id, product.name)}
                                                        disabled={archiving === product.id || !product.active}
                                                        className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-red-400 transition-colors disabled:opacity-20"
                                                        title="Archive"
                                                    >
                                                        <Archive className={`w-3.5 h-3.5 ${archiving === product.id ? 'animate-pulse' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4">
                            {searchQuery ? 'No packages match your search' : 'No packages configured yet'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => router.push('/editorial-console/commerce/create')}
                                className="px-6 py-2.5 bg-[#9df425] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors"
                            >
                                Create First Package
                            </button>
                        )}
                    </div>
                )}
            </div>
        </BccEditorialWrapper>
    );
}
