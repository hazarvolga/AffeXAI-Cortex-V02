import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CrmCustomer } from '@/services/crm.service'; // Assuming this is where the interface is
import { Activity, BrainCircuit, HeartPulse, ShieldAlert } from 'lucide-react';

interface NeuralNodeCardProps {
    customer: CrmCustomer;
    onEdit?: (customer: CrmCustomer) => void;
}

export function NeuralNodeCard({ customer, onEdit }: NeuralNodeCardProps) {
    // Calculate visual indicators based on scores
    // Resonance: 0-1
    // Sentiment: -1 to 1 (or 0-1 depending on backend) - Backend plan says 0-1
    // Friction: 0-1

    const resonanceColor = (score: number = 0) => {
        if (score >= 0.8) return 'text-orange-500';
        if (score >= 0.5) return 'text-emerald-500';
        return 'text-slate-500';
    };

    const sentimentColor = (score: number = 0) => {
        if (score >= 0.7) return 'text-emerald-400';
        if (score >= 0.4) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <Card
            onClick={() => onEdit?.(customer)}
            className="p-4 bg-slate-900/50 border-slate-800 hover:border-orange-500/30 transition-all cursor-pointer group backdrop-blur-sm"
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-sm font-medium text-slate-100 group-hover:text-orange-400 transition-colors">
                        {customer.companyName}
                    </h3>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]">
                        {customer.contactPerson || customer.email}
                    </p>
                </div>
                <Badge variant="outline" className={`bg-slate-950 border-slate-800 ${resonanceColor(customer.resonanceScore)}`}>
                    <BrainCircuit className="w-3 h-3 mr-1" />
                    {Math.round((customer.resonanceScore || 0) * 100)}%
                </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-xs border-t border-slate-800 pt-3">
                <div className="flex flex-col items-center">
                    <span className="text-slate-600 mb-1">Sentiment</span>
                    <div className={`flex items-center font-mono ${sentimentColor(customer.sentimentScore)}`}>
                        <HeartPulse className="w-3 h-3 mr-1" />
                        {((customer.sentimentScore || 0) * 100).toFixed(0)}
                    </div>
                </div>

                <div className="flex flex-col items-center border-l border-slate-800">
                    <span className="text-slate-600 mb-1">Friction</span>
                    <div className={`flex items-center font-mono ${(customer.frictionRank || 0) > 0.5 ? 'text-red-400' : 'text-slate-400'}`}>
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        {((customer.frictionRank || 0) * 10).toFixed(1)}
                    </div>
                </div>

                <div className="flex flex-col items-center border-l border-slate-800">
                    <span className="text-slate-600 mb-1">Activity</span>
                    <div className="flex items-center font-mono text-blue-400">
                        <Activity className="w-3 h-3 mr-1" />
                        {customer.lastInteractionAt ? new Date(customer.lastInteractionAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                    </div>
                </div>
            </div>
        </Card>
    );
}
