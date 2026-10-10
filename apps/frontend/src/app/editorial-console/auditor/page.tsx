'use client';

import React, { useState } from 'react';
import { EconomicsChart } from '@/components/bcc/auditor/EconomicsChart';
import { TenantIntelligence } from '@/components/bcc/auditor/TenantIntelligence';

import { commerceService } from '@/lib/api/commerceService';

export default function AuditorPage() {
    const [activeTab, setActiveTab] = useState<'revenue' | 'costs' | 'invoices'>('revenue');
    const [revenueData, setRevenueData] = useState<any>(null);
    const [invoicesData, setInvoicesData] = useState<any[]>([]);
    const [costsData, setCostsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [costsLoading, setCostsLoading] = useState(false);

    React.useEffect(() => {
        (async () => {
            try {
                const data = await commerceService.getRevenueSummary();
                setRevenueData(data);
            } catch (err) {
                console.error('Failed to load revenue summary:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    React.useEffect(() => {
        if (activeTab === 'invoices' && invoicesData.length === 0) {
            setInvoicesLoading(true);
            commerceService.getAdminInvoices()
                .then(data => setInvoicesData(data))
                .catch(err => console.error('Failed to load invoices:', err))
                .finally(() => setInvoicesLoading(false));
        }
    }, [activeTab]);

    React.useEffect(() => {
        if (activeTab === 'costs' && !costsData) {
            setCostsLoading(true);
            commerceService.getTokenEconomics()
                .then(data => setCostsData(data))
                .catch(err => console.error('Failed to load token economics:', err))
                .finally(() => setCostsLoading(false));
        }
    }, [activeTab]);

    return (
        <section className="flex-grow relative w-full h-full overflow-hidden bg-[#080808] editorial-grid">
            <style jsx>{`
                .editorial-grid {
                    background-size: 40px 40px;
                    background-image: radial-gradient(circle, #1a1a1a 1px, transparent 1px);
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {/* Foreground Data Elements (Tabs & Tables) */}
            <div className="absolute inset-0 p-12 flex flex-col justify-between z-10">

                {/* Header Section */}
                <div className="flex justify-between items-start mt-12 w-full">
                    <div className="max-w-3xl">
                        <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] font-bold uppercase tracking-tighter mb-4 text-white">
                            Fiscal <br /> Auditor.
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className="bg-[#9df425] text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">Realtime Audit</span>
                            <p className="text-white/40 text-sm max-w-sm font-light leading-relaxed">
                                Financial throughput visualization. Monitoring revenue streams, infrastructure burn, and transactional integrity.
                            </p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex space-x-1 bg-white/5 p-1 rounded-lg border border-white/10 backdrop-blur-md">
                        {(['revenue', 'costs', 'invoices'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 text-xs uppercase tracking-widest font-bold transition-all rounded ${activeTab === tab
                                    ? 'bg-[#9df425] text-black shadow-[0_0_15px_rgba(157,244,37,0.3)]'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area (Tab Panels) */}
                <div className="flex-grow my-8 relative overflow-hidden bg-[#080808]/50 border-y border-white/5 backdrop-blur-sm">
                    <div className="absolute inset-0 overflow-auto scrollbar-hide py-4 px-12">

                        {/* TAB: REVENUE */}
                        {activeTab === 'revenue' && (
                            <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                {loading ? (
                                    <div className="text-white/40 text-xs font-mono uppercase tracking-widest text-center py-12">Loading Financial Data...</div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                            <div className="p-6 border border-white/10 bg-white/5 rounded">
                                                <div className="text-[10px] text-[#9df425] uppercase tracking-widest mb-2">Total MRR</div>
                                                <div className="text-3xl font-light text-white">
                                                    ${revenueData?.totalMRR?.toLocaleString() ?? '0.00'}
                                                </div>
                                            </div>
                                            <div className="p-6 border border-white/10 bg-white/5 rounded">
                                                <div className="text-[10px] text-[#ff1a1a] uppercase tracking-widest mb-2">Projected Burn (Est)</div>
                                                <div className="text-3xl font-light text-white">
                                                    ${revenueData?.estimatedBurn?.toLocaleString() ?? '0.00'}
                                                </div>
                                            </div>
                                            <div className="p-6 border border-white/10 bg-white/5 rounded">
                                                <div className="text-[10px] text-white/60 uppercase tracking-widest mb-2">Net Margin</div>
                                                <div className="text-3xl font-light text-white">
                                                    {revenueData?.netMargin ?? '0.0'}%
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border border-white/10 rounded overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="text-[10px] uppercase tracking-widest text-white/30 border-b border-white/10 bg-white/5">
                                                    <tr>
                                                        <th className="py-3 pl-4 font-normal">Tenant Entity</th>
                                                        <th className="py-3 font-normal">Plan Tier</th>
                                                        <th className="py-3 font-normal">Status</th>
                                                        <th className="py-3 font-normal text-right pr-4">Monthly Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 text-white/80 font-light">
                                                    {revenueData?.tenants?.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="py-8 text-center text-white/30 text-xs font-mono uppercase tracking-widest">
                                                                No active subscriptions found
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {revenueData?.tenants?.map((row: any, i: number) => (
                                                        <tr key={i} className="group hover:bg-white/5 transition-colors">
                                                            <td className="py-4 pl-4 border-l-2 border-transparent group-hover:border-[#9df425] transition-all">
                                                                <span className="font-mono text-xs text-white/50 mr-2">TN-{row.tenantId.substring(0, 4)}</span>
                                                                {/* Mock name for now, or fetch if available */}
                                                                Tenant {row.tenantId.substring(0, 8)}...
                                                            </td>
                                                            <td className="py-4">
                                                                <span className="bg-white/10 px-2 py-1 rounded text-[10px] uppercase tracking-wider">
                                                                    {row.planName}
                                                                </span>
                                                            </td>
                                                            <td className="py-4">
                                                                <span className={`${row.status === 'active' ? 'text-[#9df425]' : 'text-[#ff1a1a]'}`}>
                                                                    {row.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-right font-mono text-white/60 group-hover:text-white pr-4">
                                                                ${row.monthlyValue?.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* TAB: COSTS (Token Economics Integration) */}
                        {activeTab === 'costs' && (
                            <div className="w-full max-w-full space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                {costsLoading ? (
                                    <div className="text-white/40 text-xs font-mono uppercase tracking-widest text-center py-12">Calculating Token Economics...</div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-2">
                                                <EconomicsChart
                                                    data={costsData?.monthlyUsage}
                                                    totalTokens={costsData?.totalTokensThisMonth}
                                                    totalCost={costsData?.totalEstimatedCost}
                                                    growth={costsData?.vsLastMonth}
                                                />
                                            </div>
                                            <div className="lg:col-span-1 space-y-4">
                                                <div className="p-6 border border-white/10 bg-white/5 rounded">
                                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Infrastructure Bill (Est)</div>
                                                    <div className="text-3xl font-light text-white">
                                                        ${(costsData?.totalEstimatedCost * 1.2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                                                    </div>
                                                </div>
                                                <div className="p-6 border border-white/10 bg-white/5 rounded">
                                                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">3rd Party API Burn</div>
                                                    <div className="text-3xl font-light text-white">
                                                        ${costsData?.totalEstimatedCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <TenantIntelligence tenants={costsData?.tenantBreakdown} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* TAB: INVOICES */}
                        {activeTab === 'invoices' && (
                            <div className="w-full max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                                {invoicesLoading ? (
                                    <div className="text-white/40 text-xs font-mono uppercase tracking-widest text-center py-12">Loading Invoices from Stripe...</div>
                                ) : (
                                    <>
                                        {invoicesData.filter(inv => inv.status === 'open' || inv.status === 'uncollectible').length > 0 && (
                                            <div className="p-4 border border-[#ff1a1a]/30 bg-[#ff1a1a]/5 rounded mb-6 flex items-center space-x-4">
                                                <span className="material-icons text-[#ff1a1a]">warning</span>
                                                <div className="text-sm text-[#ff1a1a]">
                                                    {invoicesData.filter(inv => inv.status === 'open' || inv.status === 'uncollectible').length} Invoices are past due/open
                                                    (Total: ${(invoicesData.filter(inv => inv.status === 'open').reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()})
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {invoicesData.length === 0 && (
                                                <div className="text-center py-8 text-white/30 text-xs font-mono uppercase tracking-widest">No invoices found</div>
                                            )}
                                            {invoicesData.map((inv) => (
                                                <div
                                                    key={inv.id}
                                                    onClick={() => inv.hostedUrl && window.open(inv.hostedUrl, '_blank')}
                                                    className={`flex justify-between items-center p-4 border border-white/10 hover:bg-white/5 transition-colors ${inv.hostedUrl ? 'cursor-pointer' : ''}`}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-8 h-8 bg-white/10 flex items-center justify-center text-xs font-mono text-white/50">INV</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                                                {inv.number}
                                                                <span className="text-[9px] font-normal text-white/40 font-mono">{inv.customerEmail}</span>
                                                            </div>
                                                            <div className="text-[10px] text-white/40 uppercase tracking-widest">
                                                                {new Date(inv.created).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-mono text-white">
                                                            ${inv.amount.toFixed(2)} <span className="text-[9px] text-white/30">{inv.currency}</span>
                                                        </div>
                                                        <div className={`text-[10px] uppercase font-bold ${inv.status === 'paid' ? 'text-[#9df425]' : inv.status === 'open' ? 'text-yellow-400' : 'text-[#ff1a1a]'}`}>
                                                            {inv.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                {/* Bottom HUD (Simplified) */}
                <div className="flex justify-between items-end w-full border-t border-white/10 pt-6">
                    <div className="text-[10px] text-white/30 max-w-md">
                        AUDIT LOG: User "hazarekiz" accessed <span className="text-[#9df425] uppercase">{activeTab} Stream</span> at {new Date().toLocaleTimeString()}
                    </div>
                    {/* Geometric Legend (Kept minimal) */}
                    <div className="hidden lg:flex flex-col items-end space-y-6">
                        <div className="flex items-center space-x-3 group cursor-help">
                            <span className="text-[10px] tracking-widest text-white/40 uppercase group-hover:text-white transition-colors">Profit Stream</span>
                            <div className="w-12 h-px bg-[#9df425]/40 group-hover:bg-[#9df425] transition-all"></div>
                        </div>
                        <div className="flex items-center space-x-3 group cursor-help">
                            <span className="text-[10px] tracking-widest text-white/40 uppercase group-hover:text-white transition-colors">Cost Liability</span>
                            <div className="w-12 h-px bg-[#ff1a1a]/40 group-hover:bg-[#ff1a1a] transition-all"></div>
                        </div>
                    </div>
                </div>
            </div>

        </section>
    );
}
