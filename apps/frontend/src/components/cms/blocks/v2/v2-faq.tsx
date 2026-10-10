'use client';

/**
 * V2 FAQ Block
 * FAQ accordion
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FaqItem {
    question?: string;
    answer?: string;
}

export interface V2FaqProps {
    heading?: string;
    subheading?: string;
    faqs?: FaqItem[];
    backgroundColor?: string;
    textColor?: string;
    className?: string;
}

export function V2Faq({
    heading = 'Frequently Asked Questions',
    subheading = 'Find answers to common questions',
    faqs = [
        { question: 'How do I get started?', answer: 'Simply sign up for an account and follow our quick start guide.' },
        { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and bank transfers.' },
        { question: 'Is there a free trial?', answer: 'Yes, we offer a 14-day free trial with full access to all features.' },
        { question: 'Can I cancel anytime?', answer: 'Absolutely. You can cancel your subscription at any time with no penalties.' },
    ],
    backgroundColor = '#ffffff',
    textColor = '#1a1a2e',
    className,
}: V2FaqProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section
            className={cn('py-16 md:py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto max-w-3xl">
                {/* Header */}
                <div className="text-center mb-12">
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

                {/* FAQ Items */}
                <div className="space-y-4">
                    {faqs?.map((faq, index) => (
                        <div
                            key={index}
                            className="border rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() => toggle(index)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                            >
                                <span className="font-medium pr-4">{faq.question}</span>
                                <ChevronDown
                                    className={cn(
                                        'w-5 h-5 flex-shrink-0 transition-transform',
                                        openIndex === index && 'rotate-180'
                                    )}
                                />
                            </button>

                            {openIndex === index && (
                                <div className="px-5 pb-5 pt-0">
                                    <p className="text-muted-foreground leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default V2Faq;
