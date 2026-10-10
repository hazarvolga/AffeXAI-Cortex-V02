'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { socialMediaService, SocialAccount } from '@/lib/api/socialMediaService';
import { AiCoPilot } from '@/components/brand/ai/AiCoPilot';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadAccounts();
        }
    }, [isOpen]);

    const loadAccounts = async () => {
        try {
            const data = await socialMediaService.getAccounts();
            setAccounts(data.filter(a => a.isActive));
        } catch (error) {
            console.error('Failed to load accounts', error);
            toast.error('Failed to load connected accounts');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return toast.error('Content is required');
        if (selectedAccounts.length === 0) return toast.error('Select at least one account');

        setLoading(true);
        try {
            await socialMediaService.createPost({
                content,
                accountIds: selectedAccounts,
                scheduledAt: scheduledAt || undefined,
            });
            toast.success('Post created successfully!');
            onSuccess();
            onClose();
            setContent('');
            setSelectedAccounts([]);
            setScheduledAt('');
        } catch (error) {
            console.error('Failed to create post', error);
            toast.error('Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const toggleAccount = (id: string) => {
        setSelectedAccounts(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#101a22] border border-[#283239] w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-[#283239] flex justify-between items-center bg-[#0a0a0a]">
                    <h3 className="text-white font-bold uppercase tracking-wider text-sm">Create Deployment</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                    {/* Account Selector */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Target Nodes</label>
                        <div className="flex gap-2 flex-wrap">
                            {accounts.map(account => (
                                <button
                                    key={account.id}
                                    type="button"
                                    onClick={() => toggleAccount(account.id)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all flex items-center gap-2 ${selectedAccounts.includes(account.id)
                                        ? 'bg-[#1183d4]/20 border-[#1183d4] text-[#1183d4]'
                                        : 'bg-black/40 border-[#283239] text-slate-400 hover:border-slate-500'
                                        }`}
                                >
                                    <span className="capitalize">{account.provider}</span>
                                    <span className="opacity-50 text-[10px]">@{account.username}</span>
                                </button>
                            ))}
                            {accounts.length === 0 && <p className="text-xs text-amber-500">No active accounts connected.</p>}
                        </div>
                    </div>

                    {/* Content Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Payload Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="bg-black/40 border border-[#283239] text-white text-sm p-3 rounded-sm focus:border-[#1183d4] outline-none min-h-[120px] resize-none"
                            placeholder="Enter transmission content..."
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-slate-600 font-mono">{content.length} chars</span>
                        <div className="relative">
                            <AiCoPilot
                                context="social_post_creation"
                                data={{ existingContent: content, accounts: selectedAccounts }}
                                variant="inline"
                                onApply={(text) => setContent(text)}
                            />
                        </div>
                    </div>

                    {/* Scheduling */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Time Protocol (Optional)</label>
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="bg-black/40 border border-[#283239] text-white text-xs p-2 rounded-sm focus:border-[#1183d4] outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-[#283239]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={loading || selectedAccounts.length === 0 || !content}
                            className="bg-[#1183d4] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(17,131,212,0.3)]"
                        >
                            {loading ? 'Initializing...' : 'Initiate Sequence'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
