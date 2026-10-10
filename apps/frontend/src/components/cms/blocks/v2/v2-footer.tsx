'use client';

/**
 * V2 Footer Block
 * Page footer with columns
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface FooterLink {
    label?: string;
    href?: string;
}

export interface FooterColumn {
    title?: string;
    links?: FooterLink[];
}

export interface V2FooterProps {
    logo?: string;
    logoText?: string;
    description?: string;
    columns?: FooterColumn[];
    copyright?: string;
    socialLinks?: { icon: string; href: string }[];
    backgroundColor?: string;
    textColor?: string;
    className?: string;
}

export function V2Footer({
    logo = '',
    logoText = 'Your Company',
    description = 'Building amazing products for our customers.',
    columns = [
        {
            title: 'Products',
            links: [
                { label: 'Features', href: '/features' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Integrations', href: '/integrations' },
            ],
        },
        {
            title: 'Company',
            links: [
                { label: 'About', href: '/about' },
                { label: 'Blog', href: '/blog' },
                { label: 'Careers', href: '/careers' },
            ],
        },
        {
            title: 'Support',
            links: [
                { label: 'Help Center', href: '/help' },
                { label: 'Contact', href: '/contact' },
                { label: 'Privacy', href: '/privacy' },
            ],
        },
    ],
    copyright = '© 2024 Your Company. All rights reserved.',
    backgroundColor = '#1a1a2e',
    textColor = '#ffffff',
    className,
}: V2FooterProps) {
    return (
        <footer
            className={cn('py-12 md:py-16 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Column */}
                    <div className="md:col-span-1">
                        <div className="font-bold text-xl mb-4">{logoText}</div>
                        <p className="text-sm opacity-70 mb-4">{description}</p>
                    </div>

                    {/* Link Columns */}
                    {columns?.map((column, index) => (
                        <div key={index}>
                            <h4 className="font-semibold mb-4">{column.title}</h4>
                            <ul className="space-y-2">
                                {column.links?.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <Link
                                            href={link.href || '#'}
                                            className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/20">
                    <p className="text-sm opacity-70 text-center">
                        {copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default V2Footer;
