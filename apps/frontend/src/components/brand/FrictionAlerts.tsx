"use client";

import React from 'react';

interface FrictionAlertsProps {
    friction: {
        title: string;
        description: string;
        status: string;
    };
}

export const FrictionAlerts = ({ friction }: FrictionAlertsProps) => {
    return (
        <div className="flex justify-end pr-24">
            <div className="max-w-md text-right relative">
                {/* Focal Tension Indicator */}
                <div className="absolute -right-8 top-1 w-2 h-2 bg-primary animate-pulse"></div>
                <h3 className="text-2xl font-bold tracking-tight mb-6 uppercase">
                    {friction?.title ?? 'Friction Analysis'}
                </h3>
                <p className="text-sm text-white/40 leading-loose">
                    {friction?.description ?? 'Monitoring reputational signals for potential friction points...'}
                </p>
                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-end">
                    <span className="text-[10px] tracking-[0.2em] uppercase opacity-30 font-mono">
                        Status: {friction?.status ?? 'SYNCING'}
                    </span>
                </div>
            </div>
        </div>
    );
};
