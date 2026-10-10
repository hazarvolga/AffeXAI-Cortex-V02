'use client';

import React, { useEffect, useState } from 'react';
import { commerceService, Product } from '@/lib/api/commerceService';
import { Plus, Edit, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    ai_tokens: number;
    max_users: number;
    features: string[];
    isPublic: boolean;
    stripeProductId?: string;
}

export const AdminCommercePanel: React.FC = () => {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Partial<AdminProduct>>({});
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await commerceService.getProducts();
            const mapped = data.map((p: Product) => ({
                id: p.id,
                name: p.name,
                description: p.description || '',
                price: p.prices?.find((pr) => pr.interval === 'month')?.amount || 0,
                ai_tokens: p.metadata?.ai_tokens || 0,
                max_users: p.metadata?.max_users || 5,
                features: p.features || [],
                isPublic: p.isPublic ?? true,
                stripeProductId: p.stripeProductId
            }));
            setProducts(mapped);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch products', err);
            setError('Failed to load packages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                name: selectedProduct.name,
                description: selectedProduct.description,
                metadata: {
                    ai_tokens: selectedProduct.ai_tokens,
                    max_users: selectedProduct.max_users,
                },
                features: selectedProduct.features,
                isPublic: selectedProduct.isPublic,
                priceAmount: selectedProduct.price,
            };

            if (selectedProduct.id) {
                await commerceService.updateProduct(selectedProduct.id, payload as any);
            } else {
                await commerceService.createProduct(payload as any);
            }
            setIsEditOpen(false);
            fetchProducts();
        } catch (err) {
            console.error('Save failed', err);
            alert('Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#9df425] animate-spin" />
                <span className="ml-3 text-xs font-mono text-white/40 uppercase tracking-widest">Loading packages...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/5 text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-mono">{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Package Management</h2>
                    <p className="text-xs text-white/40 mt-1 font-mono">{products.length} SKUs configured</p>
                </div>
                <button
                    onClick={() => { setSelectedProduct({}); setIsEditOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#9df425] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors"
                >
                    <Plus className="w-3 h-3" /> New Package
                </button>
            </div>

            {/* Product Table */}
            <div className="border border-white/5 bg-[#0a0a0a]/50 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40 font-bold border-b border-white/5">
                        <tr>
                            <th className="py-3 px-4 md:px-6">Name</th>
                            <th className="py-3 px-4 md:px-6 hidden md:table-cell">Price</th>
                            <th className="py-3 px-4 md:px-6 hidden md:table-cell">Tokens</th>
                            <th className="py-3 px-4 md:px-6 hidden md:table-cell">Users</th>
                            <th className="py-3 px-4 md:px-6">Sync</th>
                            <th className="py-3 px-4 md:px-6 text-right">Edit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {products.map((product) => (
                            <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 md:px-6">
                                    <div className="font-bold text-white text-sm">{product.name}</div>
                                    <div className="text-[10px] text-white/30 font-mono md:hidden">
                                        ${product.price}/mo · {product.ai_tokens.toLocaleString()} tokens
                                    </div>
                                </td>
                                <td className="py-3 px-4 md:px-6 font-mono text-white/80 text-sm hidden md:table-cell">
                                    ${product.price}<span className="text-white/30">/mo</span>
                                </td>
                                <td className="py-3 px-4 md:px-6 font-mono text-white/80 text-sm hidden md:table-cell">
                                    {product.ai_tokens.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 md:px-6 font-mono text-white/80 text-sm hidden md:table-cell">
                                    {product.max_users}
                                </td>
                                <td className="py-3 px-4 md:px-6">
                                    {product.stripeProductId ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#9df425]">
                                            <CheckCircle className="w-3 h-3" /> Synced
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff8c00]">Local</span>
                                    )}
                                </td>
                                <td className="py-3 px-4 md:px-6 text-right">
                                    <button
                                        onClick={() => { setSelectedProduct(product); setIsEditOpen(true); }}
                                        className="p-2 hover:bg-white/10 rounded text-white/40 hover:text-[#9df425] transition-colors"
                                    >
                                        <Edit className="w-3 h-3" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal (BCC styled) */}
            {isEditOpen && (
                <>
                    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-[#0a0a0a] border border-[#9df425]/30 w-full max-w-lg shadow-[0_0_50px_rgba(157,244,37,0.1)] pointer-events-auto">
                            <div className="p-6 border-b border-white/10">
                                <p className="text-[#9df425] text-[10px] font-mono tracking-widest uppercase mb-1">
                                    {selectedProduct.id ? 'EDIT_PACKAGE' : 'CREATE_PACKAGE'}
                                </p>
                                <h3 className="text-white text-lg font-bold uppercase tracking-tight">
                                    {selectedProduct.name || 'New Package'}
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-[#9df425] block mb-1">Package Name</label>
                                        <input
                                            value={selectedProduct.name || ''}
                                            onChange={e => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-[#9df425] block mb-1">Monthly Price ($)</label>
                                        <input
                                            type="number"
                                            value={selectedProduct.price || ''}
                                            onChange={e => setSelectedProduct({ ...selectedProduct, price: parseFloat(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-[#9df425] block mb-1">Description</label>
                                    <textarea
                                        value={selectedProduct.description || ''}
                                        onChange={e => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors h-20 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-[#9df425] block mb-1">AI Token Limit</label>
                                        <input
                                            type="number"
                                            value={selectedProduct.ai_tokens || ''}
                                            onChange={e => setSelectedProduct({ ...selectedProduct, ai_tokens: parseInt(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-[#9df425] block mb-1">Max Users</label>
                                        <input
                                            type="number"
                                            value={selectedProduct.max_users || ''}
                                            onChange={e => setSelectedProduct({ ...selectedProduct, max_users: parseInt(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-[#9df425] block mb-1">Features (comma separated)</label>
                                    <textarea
                                        value={selectedProduct.features?.join(', ') || ''}
                                        onChange={e => setSelectedProduct({ ...selectedProduct, features: e.target.value.split(',').map(s => s.trim()) })}
                                        placeholder="5 Users, Priority Support, 10GB Storage"
                                        className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors h-20 resize-none placeholder:text-white/20"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedProduct({ ...selectedProduct, isPublic: !selectedProduct.isPublic })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${selectedProduct.isPublic ? 'bg-[#9df425]' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${selectedProduct.isPublic ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                    <span className="text-xs text-white/60 font-mono uppercase tracking-wider">Publicly Visible</span>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-6 py-2.5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest hover:border-white hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-[#9df425] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save & Sync'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
