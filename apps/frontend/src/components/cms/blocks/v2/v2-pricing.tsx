'use client';

/**
 * V2 Pricing Block
 * Pricing table display
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface PricingPlan {
    name?: string;
    price?: string;
    period?: string;
    description?: string;
    features?: string[];
    ctaText?: string;
    ctaLink?: string;
    featured?: boolean;
}

export interface V2PricingProps {
    heading?: string;
    subheading?: string;
    plans?: PricingPlan[];
    backgroundColor?: string;
    textColor?: string;
    className?: string;
}

export function V2Pricing({
    heading = 'Simple, Transparent Pricing',
    subheading = 'Choose the plan that works best for you',
    plans = [
        {
            name: 'Starter',
            price: '$29',
            period: '/month',
            description: 'Perfect for small teams',
            features: ['5 users', '10GB storage', 'Email support'],
            ctaText: 'Get Started',
            ctaLink: '/signup?plan=starter',
            featured: false,
        },
        {
            name: 'Professional',
            price: '$79',
            period: '/month',
            description: 'Best for growing businesses',
            features: ['Unlimited users', '100GB storage', 'Priority support', 'Advanced analytics'],
            ctaText: 'Get Started',
            ctaLink: '/signup?plan=pro',
            featured: true,
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            description: 'For large organizations',
            features: ['Unlimited everything', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
            ctaText: 'Contact Sales',
            ctaLink: '/contact',
            featured: false,
        },
    ],
    backgroundColor = '#ffffff',
    textColor = '#1a1a2e',
    className,
}: V2PricingProps) {
    return (
        <section
            className={cn('py-16 md:py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto">
                {/* Header */}
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

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans?.map((plan, index) => (
                        <div
                            key={index}
                            className={cn(
                                'relative rounded-2xl p-8 border transition-shadow',
                                plan.featured
                                    ? 'border-primary shadow-xl scale-105 bg-primary/5'
                                    : 'border-gray-200 hover:shadow-lg'
                            )}
                        >
                            {plan.featured && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">{plan.period}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features?.map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href={plan.ctaLink || '#'} className="block">
                                <Button
                                    className="w-full"
                                    variant={plan.featured ? 'default' : 'outline'}
                                    size="lg"
                                >
                                    {plan.ctaText}
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default V2Pricing;
