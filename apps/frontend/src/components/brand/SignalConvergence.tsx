"use client";

import React from 'react';

interface SignalConvergenceProps {
    convergence: {
        title: string;
        subtitle: string;
        deltaDescription: string;
    };
}

export const SignalConvergence = ({ convergence }: SignalConvergenceProps) => {
    return (
        <div className="max-w-2xl">
            <h4 className="text-[11px] font-bold tracking-[0.3em] uppercase text-primary mb-12 font-mono">
                Signal Convergence
            </h4>
            <div className="space-y-12">
                <div className="relative group">
                    <h2 className="text-4xl lg:text-5xl font-light leading-tight tracking-tight mb-4">
                        {convergence?.title ?? 'SYNCHRONIZING SIGNALS'}
                        <span className="opacity-30 block mt-2">{convergence?.subtitle ?? 'WAITING FOR DATA'}</span>
                    </h2>
                    <p className="text-sm opacity-50 max-w-lg leading-relaxed">
                        {convergence?.deltaDescription ?? 'Analyzing multi-channel sentiment clusters...'}
                    </p>
                </div>
            </div>
        </div>
    );
};
