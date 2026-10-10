'use client';

import React, { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { socialMediaService } from '@/lib/api/socialMediaService';
import { toast } from 'sonner';

interface SocialConnectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    providerId: string;
    providerName: string;
}

export function SocialConnectModal({
    open,
    onOpenChange,
    providerId,
    providerName
}: SocialConnectModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const redirectUri = window.location.origin + window.location.pathname;
            // 1. Fetch Auth URL (This is the pre-flight check)
            const response: any = await socialMediaService.getAuthUrl(providerId, redirectUri);

            // Handle potential wrapping issues (backend might return { url } or { data: { url } })
            const url = response.url || response.data?.url;

            if (!url) {
                console.error('Received empty authentication URL:', response);
                throw new Error('Received empty authentication URL from server.');
            }

            // 2. Persist state for callback
            sessionStorage.setItem('pending_social_provider', providerId);

            // 3. Redirect
            window.location.href = url;
        } catch (err: any) {
            console.error('Connection init failed:', err);
            // If backend throws 500/400 due to missing config, we catch it here
            const msg = err.response?.data?.message || err.message || 'Configuration missing or unreachable.';
            setError(`Unable to initiate connection: ${msg}`);
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-[#0B0F19]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl shadow-blue-900/10 max-w-md">
                <AlertDialogHeader className="space-y-4">
                    <div className="flex items-center gap-2 text-[#9df425] mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="font-mono text-xs tracking-[0.2em] uppercase">Secure Handshake</span>
                    </div>

                    <AlertDialogTitle className="font-space-grotesk text-2xl tracking-tight text-white font-light">
                        Connect {providerName}
                    </AlertDialogTitle>

                    <AlertDialogDescription asChild>
                        <div className="font-mono text-xs text-white/60 leading-relaxed space-y-4">
                            <p>
                                Establishing a secure link with {providerName} will grant <strong>Cortex Status</strong> the ability to:
                            </p>
                            <ul className="list-disc pl-4 space-y-1 text-white/50">
                                <li>Read public profile information</li>
                                <li>Publish content on your behalf</li>
                                <li>Analyze engagement metrics</li>
                            </ul>

                            {error && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2 rounded-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
                    <AlertDialogCancel
                        disabled={loading}
                        className="bg-transparent border border-white/10 text-white/70 hover:bg-white/5 hover:text-white hover:border-[#9df425]/30 font-mono text-xs tracking-wider transition-all"
                    >
                        CANCEL
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={handleConnect}
                        disabled={loading}
                        className="bg-[#9df425]/10 border border-[#9df425]/50 text-[#9df425] hover:bg-[#9df425]/20 hover:text-[#b0ff4a] hover:border-[#9df425]/80 font-mono text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(157,244,37,0.1)] hover:shadow-[0_0_20px_rgba(157,244,37,0.2)]"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>CONNECTING...</span>
                            </div>
                        ) : (
                            'AUTHORIZE CONNECTION'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
