'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { commerceService } from '@/lib/api/commerceService';

export default function CreatePackagePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
        priceAmount: 0,
        priceInterval: 'month',
        ai_tokens: 10000,
        max_users: 5,
        features: '',
        isPublic: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.priceAmount) {
            setError('Package name and price are required.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await commerceService.createProduct({
                name: form.name,
                description: form.description,
                metadata: {
                    ai_tokens: form.ai_tokens,
                    max_users: form.max_users,
                },
                features: form.features.split(',').map(s => s.trim()).filter(Boolean),
                isPublic: form.isPublic,
                priceAmount: form.priceAmount,
                priceInterval: form.priceInterval,
            });
            router.push('/editorial-console/commerce');
        } catch (err: any) {
            console.error('Create failed', err);
            setError(err.response?.data?.message || 'Failed to create package.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-lg sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-white/60" />
                    </button>
                    <div>
                        <p className="text-[10px] font-mono text-[#9df425] uppercase tracking-widest">Commerce / Create</p>
                        <h1 className="text-lg font-bold uppercase tracking-tight">New Package</h1>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
                {/* Error */}
                {error && (
                    <div className="p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
                )}

                {/* Basic Info */}
                <section className="space-y-4">
                    <h2 className="text-[10px] font-mono text-[#9df425] uppercase tracking-widest border-b border-white/5 pb-2">Package Identity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">Package Name *</label>
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Professional Plan"
                                className="w-full bg-white/5 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors placeholder:text-white/20"
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
                            placeholder="Brief description of this package..."
                            className="w-full bg-white/5 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors h-24 resize-none placeholder:text-white/20"
                        />
                    </div>
                </section>

                {/* Pricing */}
                <section className="space-y-4">
                    <h2 className="text-[10px] font-mono text-[#9df425] uppercase tracking-widest border-b border-white/5 pb-2">Pricing & Billing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">Price (USD) *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-white/30 font-mono">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.priceAmount || ''}
                                    onChange={e => setForm({ ...form, priceAmount: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-white/5 border border-white/10 p-3 pl-7 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1.5">Billing Interval</label>
                            <select
                                value={form.priceInterval}
                                onChange={e => setForm({ ...form, priceInterval: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors appearance-none"
                            >
                                <option value="month" className="bg-[#0a0a0a]">Monthly</option>
                                <option value="year" className="bg-[#0a0a0a]">Yearly</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Limits */}
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
                            placeholder="e.g. Priority Support, Advanced Analytics, Custom Branding, API Access"
                            className="w-full bg-white/5 border border-white/10 p-3 text-sm text-white font-mono focus:outline-none focus:border-[#9df425] transition-colors h-24 resize-none placeholder:text-white/20"
                        />
                    </div>
                </section>

                {/* Actions */}
                <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                        type="button"
                        onClick={() => router.back()}
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
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Creating & Syncing to Stripe...
                            </>
                        ) : (
                            <>
                                <Package className="w-3 h-3" />
                                Create Package & Sync to Stripe
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
