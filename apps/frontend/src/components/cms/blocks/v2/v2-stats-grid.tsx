'use client';

/**
 * V2 Stats Grid Block
 * Statistics/metrics display
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface StatItem {
    value?: string;
    label?: string;
    suffix?: string;
}

export interface V2StatsGridProps {
    heading?: string;
    subheading?: string;
    stats?: StatItem[];
    columns?: 2 | 3 | 4;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    className?: string;
}

export function V2StatsGrid({
    heading = 'Our Impact',
    subheading = 'Numbers that speak for themselves',
    stats = [
        { value: '500', label: 'Happy Clients', suffix: '+' },
        { value: '98', label: 'Satisfaction Rate', suffix: '%' },
        { value: '24', label: 'Support Available', suffix: '/7' },
        { value: '10', label: 'Years Experience', suffix: '+' },
    ],
    columns = 4,
    backgroundColor = '#1a1a2e',
    textColor = '#ffffff',
    accentColor = '#4f46e5',
    className,
}: V2StatsGridProps) {
    const columnClasses = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
    };

    return (
        <section
            className={cn('py-16 md:py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto">
                {/* Header */}
                {(heading || subheading) && (
                    <div className="text-center mb-12 max-w-2xl mx-auto">
                        {heading && (
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                {heading}
                            </h2>
                        )}
                        {subheading && (
                            <p className="text-lg opacity-70">
                                {subheading}
                            </p>
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className={cn('grid gap-8', columnClasses[columns])}>
                    {stats?.map((stat, index) => (
                        <div
                            key={index}
                            className="text-center p-6"
                        >
                            <div
                                className="text-4xl md:text-5xl font-bold mb-2"
                                style={{ color: accentColor }}
                            >
                                {stat.value}{stat.suffix}
                            </div>
                            <div className="text-sm opacity-70 uppercase tracking-wide">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default V2StatsGrid;
