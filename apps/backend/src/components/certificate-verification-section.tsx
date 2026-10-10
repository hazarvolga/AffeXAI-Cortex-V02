
'use client';

import React from 'react';
import { Award } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

const certificateService = {
    icon: Award,
    title: 'Instantly Verify Your Allplan Certificate',
    description: 'Quickly check the validity of your Allplan certificates in real-time.',
    ctaText: 'Check Now',
    ctaLink: 'https://sertifikasorgulama.aluplan.com.tr/',
};

export function CertificateVerificationSection() {
    return (
        <section className="py-8 bg-secondary/30 border-y">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-foreground font-headline">
                            {certificateService.title}
                        </h3>
                        <p className="text-muted-foreground mt-1">
                            {certificateService.description}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                         <Button
                            asChild
                            className="bg-accent text-accent-foreground hover:bg-accent/90 transition-transform duration-300 hover:scale-105"
                            size="lg"
                        >
                            <Link href={certificateService.ctaLink}>
                                <certificateService.icon className="mr-2 h-5 w-5" />
                                {certificateService.ctaText}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
