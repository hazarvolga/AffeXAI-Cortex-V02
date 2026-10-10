'use client';

/**
 * V2 Logo Cloud Block
 * Partner/client logo display with optional marquee animation
 */

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface LogoItem {
    name?: string;
    logo?: string;
    url?: string;
}

export interface V2LogoCloudProps {
    heading?: string;
    subheading?: string;
    logos?: LogoItem[];
    variant?: 'grid' | 'marquee' | 'simple';
    columns?: 3 | 4 | 5 | 6;
    grayscale?: boolean;
    backgroundColor?: string;
    textColor?: string;
    className?: string;
}

export function V2LogoCloud({
    heading = 'Güvenilir İş Ortaklarımız',
    subheading = 'Sektör liderleri tarafından tercih ediliyoruz',
    logos = [
        { name: 'Company 1', logo: '', url: '#' },
        { name: 'Company 2', logo: '', url: '#' },
        { name: 'Company 3', logo: '', url: '#' },
        { name: 'Company 4', logo: '', url: '#' },
        { name: 'Company 5', logo: '', url: '#' },
        { name: 'Company 6', logo: '', url: '#' },
    ],
    variant = 'grid',
    columns = 6,
    grayscale = true,
    backgroundColor = '#f8fafc',
    textColor = '#1a1a2e',
    className,
}: V2LogoCloudProps) {
    const columnClasses = {
        3: 'grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
        5: 'grid-cols-2 md:grid-cols-5',
        6: 'grid-cols-3 md:grid-cols-6',
    };

    const LogoComponent = ({ logo, index }: { logo: LogoItem; index: number }) => {
        const content = (
            <div
                className={cn(
                    'h-16 md:h-20 flex items-center justify-center p-4 transition-all duration-300',
                    grayscale && 'grayscale hover:grayscale-0',
                    'opacity-60 hover:opacity-100'
                )}
            >
                {logo.logo ? (
                    <Image
                        src={logo.logo}
                        alt={logo.name || `Logo ${index + 1}`}
                        width={120}
                        height={48}
                        className="max-h-full w-auto object-contain"
                    />
                ) : (
                    <div className="bg-gray-200 rounded-lg px-6 py-3 text-gray-500 font-medium text-sm">
                        {logo.name || `Logo ${index + 1}`}
                    </div>
                )}
            </div>
        );

        if (logo.url && logo.url !== '#') {
            return (
                <a
                    href={logo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={index}
                >
                    {content}
                </a>
            );
        }

        return <div key={index}>{content}</div>;
    };

    return (
        <section
            className={cn('py-12 md:py-16 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto">
                {/* Header */}
                {(heading || subheading) && (
                    <motion.div
                        className="text-center mb-10 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        {heading && (
                            <h2 className="text-xl md:text-2xl font-semibold mb-2">
                                {heading}
                            </h2>
                        )}
                        {subheading && (
                            <p className="text-sm opacity-60">
                                {subheading}
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Grid Variant */}
                {variant === 'grid' && (
                    <motion.div
                        className={cn('grid gap-4 items-center', columnClasses[columns])}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {logos?.map((logo, index) => (
                            <LogoComponent key={index} logo={logo} index={index} />
                        ))}
                    </motion.div>
                )}

                {/* Simple Variant - Horizontal line */}
                {variant === 'simple' && (
                    <motion.div
                        className="flex flex-wrap justify-center items-center gap-8 md:gap-12"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {logos?.map((logo, index) => (
                            <LogoComponent key={index} logo={logo} index={index} />
                        ))}
                    </motion.div>
                )}

                {/* Marquee Variant - Infinite scroll */}
                {variant === 'marquee' && (
                    <div className="relative overflow-hidden">
                        <div className="flex animate-marquee">
                            {/* Duplicate logos for seamless loop */}
                            {[...logos, ...logos].map((logo, index) => (
                                <div key={index} className="flex-shrink-0 mx-8">
                                    <LogoComponent logo={logo} index={index} />
                                </div>
                            ))}
                        </div>

                        {/* Gradient overlays */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-current to-transparent pointer-events-none"
                            style={{ color: backgroundColor }}
                        />
                        <div
                            className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-current to-transparent pointer-events-none"
                            style={{ color: backgroundColor }}
                        />
                    </div>
                )}
            </div>

            {/* Marquee animation style */}
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </section>
    );
}

export default V2LogoCloud;
