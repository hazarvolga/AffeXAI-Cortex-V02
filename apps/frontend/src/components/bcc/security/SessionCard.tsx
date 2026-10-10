import React from 'react';
import { Monitor, Smartphone, Globe, Clock, ShieldAlert } from 'lucide-react';
import { BccHudTile } from '@/components/brand/BccHudTile';

interface SessionCardProps {
    device: string;
    type: 'desktop' | 'mobile';
    ip: string;
    location: string;
    lastActive: string;
    isCurrent?: boolean;
    riskScore?: number; // 0-100
}

export const SessionCard: React.FC<SessionCardProps> = ({
    device,
    type,
    ip,
    location,
    lastActive,
    isCurrent,
    riskScore = 0
}) => {
    const isHighRisk = riskScore > 50;
    const accentColor = isHighRisk ? '#ff1a1a' : '#9df425';

    return (
        <BccHudTile
            title={isCurrent ? 'CURRENT_SESSION' : 'REMOTE_SESSION'}
            subtitle={`IP: ${ip}`}
            accentColor={accentColor}
            icon={type === 'desktop' ? Monitor : Smartphone}
            headerAction={
                isHighRisk && (
                    <div className="flex items-center gap-1 text-[#ff1a1a] animate-pulse">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">RISK_DETECTED</span>
                    </div>
                )
            }
            className="h-full"
        >
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-sm font-bold text-white">{device}</div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40 font-mono">
                            <Globe className="w-3 h-3" />
                            <span>{location}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-2 text-white/60">
                        <Clock className="w-3 h-3" />
                        <span>{lastActive}</span>
                    </div>

                    {!isCurrent && (
                        <button className="text-[#ff1a1a] hover:text-[#ff4d4d] hover:underline uppercase tracking-widest">
                            REVOKE
                        </button>
                    )}
                </div>
            </div>
        </BccHudTile>
    );
};
