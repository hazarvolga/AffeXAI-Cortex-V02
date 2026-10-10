'use client';

import React, { useState, useEffect } from 'react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { ProductCard } from '@/components/bcc/products/ProductCard';
import { ProductTable } from '@/components/bcc/products/ProductTable';
import { Search, Loader2, Package, Eye } from 'lucide-react';
import { commerceService, Product, Subscription, UsageLimit } from '@/lib/api/commerceService';

export default function ProductCatalogPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [limits, setLimits] = useState<UsageLimit | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [productsData, subData, limitsData] = await Promise.all([
                    commerceService.getProducts(),
                    commerceService.getSubscription().catch(() => null),
                    commerceService.getLimits().catch(() => null),
                ]);
                setProducts(productsData);
                setSubscription(subData);
                setLimits(limitsData);
            } catch (err) {
                console.error('Product data load failed', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <BccEditorialWrapper
            headerTitle="Product Catalog"
            headerSubtitle="Read-only view of subscription tiers and add-ons."
            headerBadge="CATALOG_VIEW"
            theme="super-admin"
            hideSidebar={true}
            telemetryData={[
                { label: "TOTAL_SKUS", value: products.length.toString() },
                { label: "ACTIVE_PLAN", value: subscription?.price?.product?.name || "No Plan" },
                { label: "TOKENS_LEFT", value: limits?.remaining?.toLocaleString() || "—", color: (limits?.remaining ?? 999) < 1000 ? "#ff4444" : "#9df425" },
            ]}
            moduleNav={
                <div className="flex items-center gap-3 ml-8">
                    <div className="flex items-center space-x-1 bg-white/5 border border-white/5 rounded-full p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full transition-all ${viewMode === 'grid' ? 'bg-[#9df425] text-black shadow-[0_0_10px_rgba(157,244,37,0.3)]' : 'text-white/40 hover:text-white'}`}
                        >Grid</button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full transition-all ${viewMode === 'table' ? 'bg-[#9df425] text-black shadow-[0_0_10px_rgba(157,244,37,0.3)]' : 'text-white/40 hover:text-white'}`}
                        >Table</button>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/30">
                        <Eye className="w-3 h-3" />
                        <span className="text-[9px] font-mono uppercase tracking-widest">Read Only</span>
                    </div>
                </div>
            }
        >
            <div className="space-y-8 pb-12">
                {/* Search Bar */}
                <div className="bg-[#0a0a0a]/40 border border-white/5 p-4 backdrop-blur-md">
                    <div className="relative w-full md:w-96 group">
                        <input
                            type="text"
                            placeholder="SEARCH_CATALOG..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 p-3 pl-10 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-[#9df425] transition-colors uppercase tracking-wider"
                        />
                        <Search className="absolute left-3 top-3.5 w-4 h-4 text-white/30 group-focus-within:text-[#9df425] transition-colors" />
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-6 h-6 text-[#9df425] animate-spin" />
                        <span className="ml-3 text-xs font-mono text-white/40 uppercase tracking-widest">Loading catalog...</span>
                    </div>
                )}

                {/* Content */}
                {!loading && (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <ProductTable products={filteredProducts} />
                    )
                )}

                {/* Empty */}
                {!loading && filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-xs font-mono text-white/30 uppercase tracking-widest">
                            {searchQuery ? 'No packages match your search' : 'No packages available'}
                        </p>
                    </div>
                )}
            </div>
        </BccEditorialWrapper>
    );
}
