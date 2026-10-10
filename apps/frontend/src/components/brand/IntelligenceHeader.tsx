"use client";

import React from 'react';

export const IntelligenceHeader = ({ resonance }: { resonance?: { status?: string; value?: string } }) => {
    return (
        <section className="mb-48 text-center pt-24">
            <p className="text-[10px] tracking-[0.4em] uppercase opacity-30 mb-8 font-mono">
                Brand Condition Statement // Ref. 09-X
            </p>
            <h1 className="text-[6vw] lg:text-[8vw] leading-none font-light tracking-wider uppercase mb-4 font-display">
                System Resonance: <span className="text-primary">{resonance?.status ?? 'CALCULATING'}</span>
            </h1>
            <div className="flex justify-center mt-12">
                <div className="w-[1px] h-24 bg-gradient-to-b from-primary to-transparent"></div>
            </div>
        </section>
    );
};
