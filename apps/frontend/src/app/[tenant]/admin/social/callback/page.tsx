'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { socialMediaService } from '@/lib/api/socialMediaService';
import { toast } from 'sonner';

export default function SocialMediaCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    // Default to 'affexai' if tenant is missing, to match user's context
    const tenant = (params?.tenant as string) || 'affexai';
    const processedRef = useRef(false);

    useEffect(() => {
        const processCallback = async () => {
            // Prevent double processing in React Strict Mode
            if (processedRef.current) return;
            processedRef.current = true;

            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const provider = localStorage.getItem('connecting_provider');

            if (!code || !provider) {
                toast.error('Invalid callback parameters');
                router.push(`/${tenant}/admin/social/accounts`);
                return;
            }

            try {
                await socialMediaService.connectAccount({
                    provider,
                    code,
                    redirectUri: `${window.location.origin}/${tenant}/admin/social/callback`
                });
                toast.success(`Successfully connected to ${provider}`);
            } catch (error) {
                console.error('Failed to connect account:', error);
                toast.error('Failed to connect account');
            } finally {
                localStorage.removeItem('connecting_provider');
                router.push(`/${tenant}/admin/social/accounts`);
            }
        };

        processCallback();
    }, [router, searchParams, tenant]);

    return (
        <div className="flex items-center justify-center h-screen bg-[#f8f8f5] dark:bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#c8f906] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Completing Data Handshake...</p>
            </div>
        </div>
    );
}
