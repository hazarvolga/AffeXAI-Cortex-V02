'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Loader2, Save, Archive, CheckCircle,
    AlertCircle, ExternalLink
} from 'lucide-react';
import { commerceService, Product } from '@/lib/api/commerceService';

export default function EditPackagePage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
        priceAmount: 0,
        ai_tokens: 0,
        max_users: 5,
        features: '',
        isPublic: true,
        stripeProductId: '',
        active: true,
    });

    useEffect(() => {
        (async () => {
            try {
                const product = await commerceService.getProductById(productId);
                const activePrice = product.prices?.find(p => p.active);
                setForm({
                    name: product.name || '',
                    description: product.description || '',
                    priceAmount: activePrice?.amount || 0,
                    ai_tokens: (product.metadata as any)?.ai_tokens || 0,
                    max_users: (product.metadata as any)?.max_users || 5,
                    features: product.features?.join(', ') || '',
                    isPublic: product.isPublic ?? true,
                    stripeProductId: product.stripeProductId || '',
                    active: product.active,
                });
            } catch (err: any) {
                console.error('Failed to load product', err);
                setError('Product not found or failed to load.');
            } finally {
                setLoading(false);
            }
        })();
    }, [productId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await commerceService.updateProduct(productId, {
                name: form.name,
                description: form.description,
                metadata: {
                    ai_tokens: form.ai_tokens,
                    max_users: form.max_users,
                },
                features: form.features.split(',').map(s => s.trim()).filter(Boolean),
                isPublic: form.isPublic,
                priceAmount: form.priceAmount,
            });
            setSuccess('Package updated and synced to Stripe.');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Update failed', err);
            setError(err.response?.data?.message || 'Failed to update package.');
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async () => {
        if (!confirm(`Archive "${form.name}"? This will deactivate it on Stripe.`)) return;
        setArchiving(true);
        try {
            await commerceService.deleteProduct(productId);
            router.push('/editorial-console/commerce');
        } catch (err: any) {
            console.error('Archive failed', err);
            setError('Failed to archive package.');
            setArchiving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#9df425] animate-spin" />
                <span className="ml-3 text-xs font-mono text-white/40 uppercase tracking-widest">Loading package...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-lg sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/editorial-console/commerce')}
                            className="p-2 hover:bg-white/10 rounded transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 text-white/60" />
                        </button>
                        <div>
                            <p className="text-[10px] font-mono text-[#9df425] uppercase tracking-widest">Commerce / Edit</p>
                            <h1 className="text-lg font-bold uppercase tracking-tight">{form.name || 'Package'}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {form.stripeProductId ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#9df425] bg-[#9df425]/10 px-3 py-1.5 border border-[#9df425]/20">
                                <CheckCircle className="w-3 h-3" /> Stripe Synced
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff8c00] bg-[#ff8c00]/10 px-3 py-1.5 border border-[#ff8c00]/20">
                                Local Only
                            </span>
                        )}
                        {!form.active && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-400/10 px-3 py-1.5 border border-red-400/20">
                                Archived
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
                {/* Alerts */}
                {error && (
                    <div className="flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-3 p-4 border border-[#9df425]/30 bg-[#9df425]/5 text-[#9df425] text-xs font-mono">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        {success}
                    </div>
                )}

                {/* Package Identity */}
                <section className="space-y-4">
                    <h2 className="text-[10px] font-mono text-[#9df425] uppercase tracking-widest border-b border-white/5 pb-2">Package Identity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">Package Name</label>
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">Visibility</label>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                                className={`w-full p-3 border text-sm font-mono uppercase tracking-wider transition-colors ${form.isPublic
                                        ? 'border-[#9df425]/30 bg-[#9df425]/10 text-[#9df425]'
                                        : 'border-white/10 bg-white/5 text-white/40'
                                    }`}
                            >
                                {form.isPublic ? '● Public' : '○ Private'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors h-24 resize-none"
                        />
                    </div>
                </section>

                {/* Pricing */}
                <section className="space-y-4">
                    <h2 className="text-[10px] font-mono text-[#9df425] uppercase tracking-widest border-b border-white/5 pb-2">Pricing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">Monthly Price (USD)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-white/30 font-mono">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.priceAmount || ''}
                                    onChange={e => setForm({ ...form, priceAmount: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-white/5 border border-white/10 p-3 pl-7 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors"
                                />
                            </div>
                            <p className="text-[9px] text-white/20 mt-1 font-mono">⚠ Changing price creates new Stripe Price; old price archived.</p>
                        </div>
                        <div className="flex items-end">
                            {form.stripeProductId && (
                                <a
                                    href={`https://dashboard.stripe.com/products/${form.stripeProductId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-3 border border-white/10 text-white/40 hover:text-[#9df425] hover:border-[#9df425] text-xs font-mono uppercase tracking-wider transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" /> View on Stripe
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* Resource Limits */}
                <section className="space-y-4">
                    <h2 className="text-[10px] font-mono text-[#9df425] uppercase tracking-widest border-b border-white/5 pb-2">Resource Limits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">AI Token Limit</label>
                            <input
                                type="number"
                                min="0"
                                value={form.ai_tokens || ''}
                                onChange={e => setForm({ ...form, ai_tokens: parseInt(e.target.value) || 0 })}
                                className="w-full bg-white/5 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">Max Users (Seats)</label>
                            <input
                                type="number"
                                min="1"
                                value={form.max_users || ''}
                                onChange={e => setForm({ ...form, max_users: parseInt(e.target.value) || 1 })}
                                className="w-full bg-white/5 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors"
                            />
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="space-y-4">
                    <h2 className="text-[10px] font-mono text-[#9df425] uppercase tracking-widest border-b border-white/5 pb-2">Features</h2>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">Feature List (Comma separated)</label>
                        <textarea
                            value={form.features}
                            onChange={e => setForm({ ...form, features: e.target.value })}
                            placeholder="Priority Support, Advanced Analytics, Custom Branding"
                            className="w-full bg-white/5 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors h-24 resize-none placeholder:text-white/20"
                        />
                    </div>
                </section>

                {/* Actions */}
                <div className="flex flex-col md:flex-row justify-between gap-3 pt-6 border-t border-white/5">
                    <button
                        type="button"
                        onClick={handleArchive}
                        disabled={archiving || !form.active}
                        className="px-6 py-3 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors disabled:opacity-20 flex items-center justify-center gap-2"
                    >
                        {archiving ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Archiving...</>
                        ) : (
                            <><Archive className="w-3 h-3" /> Archive Package</>
                        )}
                    </button>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/editorial-console/commerce')}
                            className="px-8 py-3 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest hover:border-white hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-[#9df425] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="w-3 h-3" /> Save & Sync</>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
