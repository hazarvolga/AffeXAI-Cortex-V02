'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  Shield,
  AlertTriangle
} from 'lucide-react';
import ipReputationService, { IpReputationResult } from '@/lib/api/ipReputationService';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';
import { cn } from '@/lib/utils';

export default function EmailValidationPage() {
  const [ipAddress, setIpAddress] = useState('');
  const [result, setResult] = useState<IpReputationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckReputation = async () => {
    if (!ipAddress) {
      setError('INPUT_PARAMETER_REQUIRED');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ipReputationService.checkIpReputation(ipAddress);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'CRITICAL_SYNC_FAILURE');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getReputationIcon = () => {
    if (!result) return null;

    switch (result.reputation) {
      case 'clean':
        return <CheckCircle className="h-4 w-4 text-[#9df425]" />;
      case 'listed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'unknown':
      default:
        return <HelpCircle className="h-4 w-4 text-[#ff8c00]" />;
    }
  };

  const getReputationStatusLabel = () => {
    if (!result) return '';

    switch (result.reputation) {
      case 'clean':
        return 'IDENTITY_SECURED';
      case 'listed':
        return 'NODE_BLACKLISTED';
      case 'unknown':
      default:
        return 'STATUS_UNVERIFIED';
    }
  };

  return (
    <BccEditorialWrapper
      headerTitle="IP Reputation Scanner"
      headerSubtitle="Sender IP Integrity and Blacklist Verification"
      headerBadge="Security"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "Scanner_Status", value: "ACTIVE", color: "#9df425" },
        { label: "Database_Sync", value: "94.2", suffix: "ms", color: "#ff8c00" }
      ]}
    >
      <div className="space-y-12 animate-in fade-in duration-1000">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BccHudTile
            title="SENDER_INTEGRITY_CHECK"
            subtitle="Real-time Node Reputation Analysis"
            icon="shield_moon"
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="ip-address" className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Transmission_IP_Address</Label>
                <div className="flex gap-4">
                  <Input
                    id="ip-address"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="ENTER IP (e.g. 192.168.1.1)..."
                    className="bg-white/5 border-white/10 rounded-none h-10 text-[10px] uppercase tracking-widest font-mono focus-visible:ring-1 focus-visible:ring-[#ff8c00]"
                  />
                  <Button
                    onClick={handleCheckReputation}
                    disabled={loading}
                    className="rounded-none bg-[#ff8c00] text-black hover:bg-[#ff8c00]/90 font-bold uppercase text-[10px] px-8"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'SCAN'
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-mono">
                  {error}
                </div>
              )}

              {result && (
                <div className="space-y-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Node_ID: {result.ip}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                        Confidence_Interval: {result.confidence}%
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {getReputationIcon()}
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          result.reputation === 'clean' ? 'text-[#9df425]' : result.reputation === 'listed' ? 'text-red-500' : 'text-[#ff8c00]'
                        )}>
                          {getReputationStatusLabel()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Diagnostic_Details</h4>
                    <p className="text-[10px] text-white/60 leading-relaxed font-mono uppercase bg-white/[0.01] p-4 border border-white/5">
                      {result.details}
                    </p>
                  </div>

                  {result.listedOn && result.listedOn.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest">External_Blacklists</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.listedOn.map((server, index) => (
                          <Badge key={index} variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-none text-[8px] uppercase tracking-widest">
                            {server}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </BccHudTile>

          <BccHudTile
            title="HISTORICAL_NODE_DATA"
            subtitle="Cumulative Signal Pattern Tracking"
            icon="history"
          >
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white/20" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed max-w-xs">
                  Historical tracking for dispatch nodes is currently in state synchronization.
                </p>
              </div>
              <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#ff8c00]/40 animate-pulse" />
              </div>
            </div>
          </BccHudTile>
        </div>

        <BccHudTile
          title="PROTOCOL_GUIDELINES"
          subtitle="Sender Reputation Optimization"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-[#ff8c00] uppercase tracking-widest">01_Authentication</h5>
              <p className="text-[9px] text-white/40 leading-relaxed uppercase tracking-wider font-mono">Ensure SPF, DKIM, and DMARC protocols are fully synced for initial validation.</p>
            </div>
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-[#ff8c00] uppercase tracking-widest">02_Transmission_Volume</h5>
              <p className="text-[9px] text-white/40 leading-relaxed uppercase tracking-wider font-mono">Avoid sudden spikes in dispatch volume to prevent triggering neural baseline alerts.</p>
            </div>
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-[#ff8c00] uppercase tracking-widest">03_Identity_Hygiene</h5>
              <p className="text-[9px] text-white/40 leading-relaxed uppercase tracking-wider font-mono">Maintain high-quality identity clusters and prune stale nodes regularly.</p>
            </div>
          </div>
        </BccHudTile>
      </div>
    </BccEditorialWrapper>
  );
}