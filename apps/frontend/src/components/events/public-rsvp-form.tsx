import React, { useState } from 'react';
import { Event } from '@affexai/shared-types';
import { eventsService } from '@/lib/api/eventsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, Calendar } from 'lucide-react';

export const PublicRsvpForm = ({ event }: { event: Event }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await eventsService.register(event.id, { name, email });
            setStatus('success');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="space-y-6 text-center py-8">
                <div className="flex justify-center">
                    <CheckCircle2 className="w-16 h-16 text-[#f9f906]" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight">Access Granted</h3>
                    <p className="text-zinc-500 mt-2">Registration confirmed. Check your inbox for the terminal key.</p>
                </div>
                <div className="pt-6 grid grid-cols-1 gap-4">
                    <Button className="w-full bg-[#f9f906] text-black hover:bg-[#f9f906]/80 font-bold uppercase tracking-widest h-12">
                        <Calendar className="w-4 h-4 mr-2" /> Add to Calendar
                    </Button>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">A confirmation packet has been dispatched.</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] uppercase tracking-widest text-zinc-400">Full Name</Label>
                <Input
                    id="name"
                    required
                    placeholder="ENTER IDENTITY"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-zinc-800 rounded-none h-12 font-mono text-sm focus:border-[#f9f906] focus:ring-0 transition-all"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-zinc-400">Email Vector</Label>
                <Input
                    id="email"
                    type="email"
                    required
                    placeholder="COMM_CHANNEL@PROTOCOL.NET"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-zinc-800 rounded-none h-12 font-mono text-sm focus:border-[#f9f906] focus:ring-0 transition-all"
                />
            </div>

            <Button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#f9f906] text-black hover:bg-[#f9f906]/80 font-bold uppercase tracking-widest h-14 rounded-none shadow-[0_0_30px_rgba(249,249,6,0.1)] group transition-all"
            >
                {status === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>Initialize Registration <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span></>
                )}
            </Button>

            <div className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] leading-relaxed text-center">
                BY INITIALIZING, YOU AGREE TO DATA PERSISTENCE PROTOCOLS AND SYSTEM PRIVACY STANDARDS.
            </div>
        </form>
    );
};
