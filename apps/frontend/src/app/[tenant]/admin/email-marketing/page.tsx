'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EmailMarketingRedirect() {
    const router = useRouter();
    const params = useParams();
    const tenant = params?.tenant as string || 'affexai';

    useEffect(() => {
        // Auto-redirect after 2 seconds
        const timer = setTimeout(() => {
            router.push(`/${tenant}/admin/email`);
        }, 2000);

        return () => clearTimeout(timer);
    }, [router, tenant]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#080808]">
            <div className="text-center space-y-4">
                <div className="text-6xl mb-4">📧</div>
                <h1 className="text-2xl font-bold text-white">Email Marketing Taşındı</h1>
                <p className="text-white/60">
                    Yeni adrese yönlendiriliyorsunuz...
                </p>
                <p className="text-sm text-white/40 font-mono">
                    /{tenant}/admin/email
                </p>
                <div className="mt-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#ff8c00] border-r-transparent"></div>
                </div>
            </div>
        </div>
    );
}
