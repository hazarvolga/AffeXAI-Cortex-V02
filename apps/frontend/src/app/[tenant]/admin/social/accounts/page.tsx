'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { socialMediaService, SocialAccount } from '@/lib/api/socialMediaService';
import { toast } from 'sonner';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { SocialModuleNav } from '@/components/admin/social/SocialModuleNav';
import { SocialConnectModal } from '@/components/admin/social/SocialConnectModal';
import { Button } from '@/components/ui/button';
import { Twitter, Linkedin, Instagram, Facebook, Globe, CheckCircle2, AlertCircle, Plus, Loader2, Trash2, Building2, User as UserIcon } from 'lucide-react';

const PROVIDERS = [
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-blue-400' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
];

interface ProviderDef {
    id: string;
    name: string;
    icon: any;
    color: string;
}

export default function SocialMediaAccounts() {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null); // For callback processing
    const [selectedProvider, setSelectedProvider] = useState<ProviderDef | null>(null); // For Modal

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        loadAccounts();
        handleOAuthCallback();
    }, []);

    const handleOAuthCallback = async () => {
        const code = searchParams.get('code');
        const pendingProvider = sessionStorage.getItem('pending_social_provider');

        if (code && pendingProvider) {
            try {
                toast.loading('Finalizing connection...', { id: 'connect-loading' });
                setConnecting(pendingProvider);
                sessionStorage.removeItem('pending_social_provider');

                const currentUrl = window.location.origin + window.location.pathname;

                await socialMediaService.connectAccount({
                    provider: pendingProvider,
                    code,
                    redirectUri: currentUrl
                });

                toast.dismiss('connect-loading');
                toast.success(`Connected to ${pendingProvider.toUpperCase()}`);

                await loadAccounts();

                // Clear URL params without full reload
                router.replace(window.location.pathname);
            } catch (error: any) {
                console.error('Connection failed:', error);
                toast.dismiss('connect-loading');
                toast.error(`Connection failed: ${error.message || 'Unknown error'}`);
            } finally {
                setConnecting(null);
            }
        }
    };

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const data = await socialMediaService.getAccounts();

            // Check if data is wrapped in 'data' property (NestJS common pattern)
            // @ts-ignore
            const items = Array.isArray(data) ? data : (data?.data || []);

            if (Array.isArray(items)) {
                setAccounts(items);
            } else {
                setAccounts([]);
            }
        } catch (error) {
            console.error('Failed to load accounts:', error);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectClick = (provider: ProviderDef) => {
        setSelectedProvider(provider);
    };

    const handleDisconnect = async (accountId: string) => {
        if (!confirm('Disconnect this account? This will stop future posts.')) return;
        try {
            await socialMediaService.disconnectAccount(accountId);
            toast.success('Account disconnected');
            setAccounts(accounts.filter(a => a.id !== accountId));
        } catch (error) {
            toast.error('Failed to disconnect');
        }
    };

    // Group accounts by provider
    const getAccountsByProvider = (providerId: string) =>
        accounts.filter(a => a.provider === providerId);

    return (
        <BccEditorialWrapper
            headerTitle="Social Matrix"
            headerSubtitle="Active signal nodes and connection topology."
            headerBadge="Config"
            moduleNav={<SocialModuleNav />}
        >
            <div className="space-y-8 pb-20 animate-in fade-in duration-1000">
                {/* Stats */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <BccHudTile title="Network Topology" subtitle="Connected Nodes" icon="hub">
                        <div className="text-3xl font-light tracking-tighter text-white">{accounts.length}</div>
                        <div className="text-[10px] text-[#9df425] font-mono mt-1">Operational</div>
                    </BccHudTile>
                    <BccHudTile title="Sync Status" subtitle="Last Handshake" icon="sync">
                        <div className="text-3xl font-light tracking-tighter text-white">{loading ? '...' : 'OK'}</div>
                        <div className="text-[10px] text-white/40 font-mono mt-1">Latency Nominal</div>
                    </BccHudTile>
                    <BccHudTile title="Broadcasters" subtitle="Active Channels" icon="podcasts">
                        <div className="flex -space-x-2 mt-2">
                            {accounts.slice(0, 5).map((acc, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center overflow-hidden">
                                    {acc.profileData?.avatarUrl ? (
                                        <img src={acc.profileData.avatarUrl} alt={acc.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[10px] font-bold text-white/60">{acc.provider[0].toUpperCase()}</span>
                                    )}
                                </div>
                            ))}
                            {accounts.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
                                    <span className="text-[10px] text-white">+{accounts.length - 5}</span>
                                </div>
                            )}
                        </div>
                    </BccHudTile>
                </section>

                {/* Connection Matrix */}
                <BccHudTile title="Integration Matrix" subtitle="Connect New Providers" className="col-span-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-2">
                        {PROVIDERS.map((provider) => {
                            const connectedCount = getAccountsByProvider(provider.id).length;
                            const isProcessing = connecting === provider.id;
                            const Icon = provider.icon;

                            return (
                                <div
                                    key={provider.id}
                                    className={`relative group bg-[#0a0a0a] border border-white/5 p-6 transition-all duration-300 hover:border-white/20`}
                                >
                                    <div className="flex flex-col h-full justify-between space-y-6">
                                        <div>
                                            <div className={`w-10 h-10 rounded-none bg-white/5 flex items-center justify-center mb-4 text-white`}>
                                                <Icon className={`w-5 h-5 ${connectedCount > 0 ? provider.color : 'text-white/40'}`} />
                                            </div>
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-white">{provider.name}</h3>
                                            <p className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-wider">
                                                {connectedCount > 0 ? `${connectedCount} Connected` : 'Not Connected'}
                                            </p>
                                        </div>

                                        <div>
                                            <Button
                                                onClick={() => handleConnectClick(provider)}
                                                variant="outline"
                                                disabled={!!connecting}
                                                className="w-full h-8 bg-white/5 border-white/10 text-white hover:bg-[#ff8c00]/10 hover:text-[#ff8c00] hover:border-[#ff8c00]/30 text-[10px] uppercase tracking-widest rounded-none"
                                            >
                                                {isProcessing ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        <span>Connecting...</span>
                                                    </div>
                                                ) : (
                                                    'Connect Identity'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </BccHudTile>

                {/* Active Accounts List */}
                {accounts.length > 0 && (
                    <BccHudTile title="Managed Identities" subtitle="Active Social Nodes" className="col-span-full">
                        <div className="divide-y divide-white/5">
                            {accounts.map((account) => {
                                const providerDef = PROVIDERS.find(p => p.id === account.provider);
                                const Icon = providerDef?.icon || Globe;
                                const isOrg = account.profileData?.isOrganization;

                                return (
                                    <div key={account.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/10">
                                                {account.profileData?.avatarUrl ? (
                                                    <img src={account.profileData.avatarUrl} alt={account.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Icon className="w-5 h-5 text-white/40" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="text-sm font-medium text-white">{account.profileData?.name || account.username}</h4>
                                                    {isOrg && (
                                                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] border border-blue-500/30 uppercase tracking-widest flex items-center gap-1">
                                                            <Building2 className="w-2 h-2" /> Page
                                                        </span>
                                                    )}
                                                    {!isOrg && (
                                                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/40 text-[9px] border border-white/10 uppercase tracking-widest flex items-center gap-1">
                                                            <UserIcon className="w-2 h-2" /> Profile
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-3 mt-1">
                                                    <p className="text-xs text-white/40 font-mono flex items-center gap-1">
                                                        <Icon className="w-3 h-3" /> {providerDef?.name}
                                                    </p>
                                                    <span className="text-white/20 text-[10px]">•</span>
                                                    <p className="text-[10px] text-white/40 font-mono">
                                                        @{account.username || account.profileData?.username}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-4">
                                            <div className="hidden md:flex flex-col items-end mr-4">
                                                <div className="flex items-center space-x-1text-green-500 text-[10px] uppercase tracking-widest text-[#9df425]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#9df425] shadow-[0_0_5px_#9df425] mr-2"></span>
                                                    Active
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => handleDisconnect(account.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-white/20 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </BccHudTile>
                )}
            </div>

            {selectedProvider && (
                <SocialConnectModal
                    open={!!selectedProvider}
                    onOpenChange={(open) => !open && setSelectedProvider(null)}
                    providerId={selectedProvider.id}
                    providerName={selectedProvider.name}
                />
            )}
        </BccEditorialWrapper>
    );
}

