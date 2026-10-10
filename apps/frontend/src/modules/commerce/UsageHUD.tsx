'use client';

import React, { useEffect, useState } from 'react';
import { commerceService, UsageStats, UserLimit } from '@/lib/api/commerceService';
import { Zap, Users, AlertCircle } from 'lucide-react';

interface UsageHUDProps {
    compact?: boolean;
}

export const UsageHUD: React.FC<UsageHUDProps> = ({ compact = false }) => {
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [userLimits, setUserLimits] = useState<UserLimit | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const [stats, limits] = await Promise.all([
                    commerceService.getUsageStats(),
                    commerceService.getUserLimits(),
                ]);
                setUsage(stats);
                setUserLimits(limits);
            } catch (err) {
                console.error('Failed to fetch usage', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsage();
        const interval = setInterval(fetchUsage, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !usage) return null;

    const tokenPct = Math.min((usage.used / usage.limit) * 100, 100);
    const seatUsed = userLimits ? userLimits.limit - userLimits.remaining : 0;
    const seatPct = userLimits ? Math.min((seatUsed / userLimits.limit) * 100, 100) : 0;
    const isCritical = tokenPct >= 90 || seatPct >= 90;

    if (compact) {
        return (
            <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5" title={`AI Tokens: ${usage.used.toLocaleString()} / ${usage.limit.toLocaleString()}`}>
                    <Zap className={`w-3 h-3 ${tokenPct >= 90 ? 'text-red-400' : tokenPct >= 75 ? 'text-yellow-400' : 'text-[#f9bc06]'}`} />
                    <span className="text-muted-foreground font-mono">{tokenPct.toFixed(0)}%</span>
                </div>
                {userLimits && (
                    <div className="flex items-center gap-1.5" title={`Seats: ${seatUsed} / ${userLimits.limit}`}>
                        <Users className={`w-3 h-3 ${seatPct >= 90 ? 'text-red-400' : 'text-[#f9bc06]'}`} />
                        <span className="text-muted-foreground font-mono">{seatUsed}/{userLimits.limit}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm w-full max-w-sm space-y-3">
            {/* Token Usage */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-[#f9bc06]" /> AI Tokens
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                        {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}
                    </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${tokenPct >= 90 ? 'bg-destructive' : tokenPct >= 75 ? 'bg-yellow-500' : 'bg-[#f9bc06]'
                            }`}
                        style={{ width: `${tokenPct}%` }}
                    />
                </div>
            </div>

            {/* Seat Usage */}
            {userLimits && (
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-[#f9bc06]" /> Active Seats
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                            {seatUsed} / {userLimits.limit}
                        </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${seatPct >= 90 ? 'bg-destructive' : seatPct >= 75 ? 'bg-yellow-500' : 'bg-[#f9bc06]'
                                }`}
                            style={{ width: `${seatPct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Reset Info */}
            <p className="text-[10px] text-muted-foreground">
                Resets {usage.periodEnd ? new Date(usage.periodEnd).toLocaleDateString('tr-TR') : '—'}
            </p>

            {/* Critical Alert */}
            {isCritical && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Usage near limit. <a href="/pricing" className="underline font-bold">Upgrade</a></span>
                </div>
            )}
        </div>
    );
};
