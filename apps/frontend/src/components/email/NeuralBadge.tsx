import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, HeartPulse } from 'lucide-react';

interface NeuralBadgeProps {
    score?: number;
    type: 'resonance' | 'sentiment';
    compact?: boolean;
}

export function NeuralBadge({ score = 0, type, compact = false }: NeuralBadgeProps) {
    const percentage = Math.round(score * 100);

    if (type === 'resonance') {
        const colorClass =
            score >= 0.8 ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' :
                score >= 0.5 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                    'text-slate-500 bg-slate-500/10 border-slate-500/20';

        return (
            <Badge variant="outline" className={`font-mono border ${colorClass} ${compact ? 'px-1 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'}`}>
                <BrainCircuit className="w-3 h-3 mr-1" />
                {percentage}%
            </Badge>
        );
    }

    if (type === 'sentiment') {
        const colorClass =
            score >= 0.7 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                score >= 0.4 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                    'text-red-400 bg-red-400/10 border-red-400/20';

        return (
            <Badge variant="outline" className={`font-mono border ${colorClass} ${compact ? 'px-1 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'}`}>
                <HeartPulse className="w-3 h-3 mr-1" />
                {percentage}
            </Badge>
        );
    }

    return null;
}
