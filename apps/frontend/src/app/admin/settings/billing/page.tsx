'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CreditCard, ExternalLink, BarChart3, Users, Zap,
    Loader2, ChevronRight, ShieldCheck
} from 'lucide-react';
import { commerceService, Subscription, UsageStats, UserLimit } from '@/lib/api/commerceService';

export default function BillingPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [userLimits, setUserLimits] = useState<UserLimit | null>(null);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [sub, stats, limits] = await Promise.all([
                    commerceService.getSubscription(),
                    commerceService.getUsageStats(),
                    commerceService.getUserLimits(),
                ]);
                setSubscription(sub);
                setUsage(stats);
                setUserLimits(limits);
            } catch (err) {
                console.error('Failed to load billing data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const handleManageBilling = async () => {
        setPortalLoading(true);
        try {
            const { url } = await commerceService.getBillingPortalUrl(window.location.href);
            if (url) window.location.href = url;
        } catch (err) {
            console.error('Failed to open billing portal', err);
            alert('Failed to open billing portal.');
        } finally {
            setPortalLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-[#f9bc06] animate-spin" />
                <span className="ml-4 text-[#bbb39b] text-sm font-mono">Loading billing data...</span>
            </div>
        );
    }

    const tokenPercentage = usage ? Math.min((usage.used / usage.limit) * 100, 100) : 0;
    const seatUsed = userLimits ? userLimits.limit - userLimits.remaining : 0;
    const seatPercentage = userLimits ? Math.min((seatUsed / userLimits.limit) * 100, 100) : 0;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-baseline justify-between border-b border-[#3a3527] pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Usage</h1>
                    <p className="text-[#bbb39b] text-sm mt-1">Manage your subscription, monitor usage, and access invoices.</p>
                </div>
                <span className="text-[#554e3a] font-mono text-[10px] uppercase tracking-widest">
                    {subscription ? 'ACTIVE' : 'NO PLAN'}
                </span>
            </div>

            {/* Current Plan Card */}
            <div className="border border-[#3a3527] bg-[#111] rounded-lg overflow-hidden">
                <div className="p-6 border-b border-[#3a3527] bg-[#0a0a0a]">
                    <p className="text-[#f9bc06] text-[10px] font-mono tracking-widest uppercase mb-2">Current Plan</p>
                    <div className="flex items-baseline justify-between">
                        <div>
                            <h2 className="text-white text-3xl font-bold tracking-tight">
                                {subscription?.price?.product?.name || 'No Active Plan'}
                            </h2>
                            {subscription && (
                                <p className="text-[#bbb39b] text-sm mt-1">
                                    ${subscription.price.amount}
                                    <span className="text-[#554e3a]"> / {subscription.price.interval || 'month'}</span>
                                </p>
                            )}
                        </div>
                        {subscription && (
                            <div className="text-right">
                                <p className="text-[10px] text-[#554e3a] font-mono uppercase">Renews</p>
                                <p className="text-white text-sm font-mono">
                                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 flex flex-wrap gap-4">
                    <button
                        onClick={handleManageBilling}
                        disabled={portalLoading || !subscription}
                        className="flex items-center gap-2 px-6 py-3 bg-[#f9bc06] text-black text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                    >
                        {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                        Manage Billing
                        <ExternalLink className="w-3 h-3" />
                    </button>
                    <Link
                        href="/pricing"
                        className="flex items-center gap-2 px-6 py-3 border border-[#3a3527] text-[#bbb39b] text-xs font-bold uppercase tracking-widest hover:border-white hover:text-white transition-colors"
                    >
                        {subscription ? 'Change Plan' : 'View Plans'}
                        <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* Usage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Token Usage */}
                <div className="border border-[#3a3527] bg-[#111] rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Zap className="w-5 h-5 text-[#f9bc06]" />
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">AI Token Usage</h3>
                    </div>
                    <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#bbb39b]">{usage?.used?.toLocaleString() || 0} used</span>
                            <span className="text-[#554e3a]">{usage?.limit?.toLocaleString() || 0} limit</span>
                        </div>
                        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${tokenPercentage >= 90 ? 'bg-red-500' :
                                        tokenPercentage >= 75 ? 'bg-yellow-500' : 'bg-[#f9bc06]'
                                    }`}
                                style={{ width: `${tokenPercentage}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-[#554e3a] font-mono">
                        {tokenPercentage.toFixed(0)}% used · Resets {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString('tr-TR') : '—'}
                    </p>
                </div>

                {/* Seat Usage */}
                <div className="border border-[#3a3527] bg-[#111] rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-[#f9bc06]" />
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Seat Usage</h3>
                    </div>
                    <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#bbb39b]">{seatUsed} active users</span>
                            <span className="text-[#554e3a]">{userLimits?.limit || 0} max</span>
                        </div>
                        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${seatPercentage >= 90 ? 'bg-red-500' :
                                        seatPercentage >= 75 ? 'bg-yellow-500' : 'bg-[#f9bc06]'
                                    }`}
                                style={{ width: `${seatPercentage}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-[#554e3a] font-mono">
                        {userLimits?.remaining || 0} seats remaining
                    </p>
                </div>
            </div>

            {/* Security Footer */}
            <div className="flex items-center gap-2 pt-4 border-t border-[#3a3527]">
                <ShieldCheck className="w-4 h-4 text-[#f9bc06]" />
                <span className="text-[10px] text-[#554e3a] font-mono uppercase tracking-widest">
                    Billing managed securely via Stripe · PCI DSS Level 1
                </span>
            </div>
        </div>
    );
}
