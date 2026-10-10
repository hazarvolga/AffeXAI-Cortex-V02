'use client';

import React, { useState } from 'react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { SecurityToggle } from '@/components/bcc/security/SecurityToggle';
import { SessionCard } from '@/components/bcc/security/SessionCard';
import { AuditTable } from '@/components/bcc/security/AuditTable';
import { Shield, Smartphone } from 'lucide-react'; // Imports for icons usually needed, but here filtered by components

export default function SecurityPage() {
    const [twoFactor, setTwoFactor] = useState(true);
    const [auditLog] = useState([
        { id: 'ev-1', action: 'LOGIN_ATTEMPT', user: 'admin@affexai.com', ip: '192.168.1.1', status: 'success', timestamp: '10:42:05' },
        { id: 'ev-2', action: 'API_KEY_ROTATION', user: 'system', ip: 'internal', status: 'success', timestamp: '09:15:30' },
        { id: 'ev-3', action: 'FAILED_LOGIN', user: 'unknown', ip: '45.32.11.90', status: 'failure', timestamp: '03:22:11' },
        { id: 'ev-4', action: 'CONFIG_CHANGE', user: 'dev_ops', ip: '10.0.0.5', status: 'warning', timestamp: 'Yesterday' },
    ]);

    return (
        <BccEditorialWrapper
            headerTitle="Security Center"
            headerSubtitle="Identity governance, access control, and threat analysis."
            headerBadge="DEFENSE_GRID"
            theme="super-admin"
            telemetryData={[
                { label: "THREAT_LEVEL", value: "LOW", color: "#9df425" },
                { label: "ACTIVE_SESSIONS", value: "3" },
                { label: "2FA_ENFORCED", value: "98", suffix: "%" }
            ]}
        >
            <div className="space-y-8 pb-12">

                {/* 1. Identity Shield */}
                <section>
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4 pl-1 border-l-2 border-[#9df425]">
                        Identity Protocols
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SecurityToggle
                            label="Two-Factor Auth"
                            description="Require 2FA for all admin accounts accessing sensitive data."
                            isActive={twoFactor}
                            onToggle={setTwoFactor}
                        />
                        <SecurityToggle
                            label="Password Rotation"
                            description="Force password updates every 90 days for compliance."
                            isActive={false}
                            onToggle={() => { }}
                        />
                        <SecurityToggle
                            label="IP Whitelisting"
                            description="Restrict admin panel access to known corporate IPs."
                            isActive={true}
                            onToggle={() => { }}
                            locked
                        />
                    </div>
                </section>

                {/* 2. Session Monitor */}
                <section>
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4 pl-1 border-l-2 border-[#9df425]">
                        Active Neural Links
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SessionCard
                            device="MacBook Pro M3 Max"
                            type="desktop"
                            ip="192.168.1.105"
                            location="Istanbul, TR"
                            lastActive="Just now"
                            isCurrent
                        />
                        <SessionCard
                            device="iPhone 15 Pro"
                            type="mobile"
                            ip="10.5.22.1"
                            location="Istanbul, TR"
                            lastActive="22 mins ago"
                        />
                        <SessionCard
                            device="Chrome / Windows 11"
                            type="desktop"
                            ip="88.211.45.12"
                            location="Berlin, DE"
                            lastActive="4 hours ago"
                            riskScore={85}
                        />
                    </div>
                </section>

                {/* 3. Event Horizon */}
                <section>
                    <AuditTable events={auditLog as any} />
                </section>

            </div>
        </BccEditorialWrapper>
    );
}
