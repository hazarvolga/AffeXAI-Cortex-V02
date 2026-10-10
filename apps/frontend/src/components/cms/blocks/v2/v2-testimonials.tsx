'use client';

/**
 * V2 Testimonials Block
 * Customer testimonials display
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface Testimonial {
    quote?: string;
    author?: string;
    role?: string;
    company?: string;
    avatar?: string;
}

export interface V2TestimonialsProps {
    heading?: string;
    subheading?: string;
    testimonials?: Testimonial[];
    backgroundColor?: string;
    textColor?: string;
    className?: string;
}

export function V2Testimonials({
    heading = 'What Our Clients Say',
    subheading = 'Trusted by companies worldwide',
    testimonials = [
        {
            quote: 'This platform has transformed our workflow. The results speak for themselves.',
            author: 'John Doe',
            role: 'CEO',
            company: 'TechCorp',
            avatar: '',
        },
        {
            quote: 'Incredible support team and amazing features. Highly recommended!',
            author: 'Jane Smith',
            role: 'Product Manager',
            company: 'StartupXYZ',
            avatar: '',
        },
    ],
    backgroundColor = '#f8f9fa',
    textColor = '#1a1a2e',
    className,
}: V2TestimonialsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const current = testimonials[currentIndex];

    return (
        <section
            className={cn('py-16 md:py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto max-w-4xl">
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

                {/* Testimonial Card */}
                <div className="relative bg-white rounded-2xl shadow-lg p-8 md:p-12">
                    <Quote className="w-12 h-12 text-primary/20 mb-6" />

                    <blockquote className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
                        "{current?.quote}"
                    </blockquote>

                    <div className="flex items-center gap-4">
                        {current?.avatar ? (
                            <Image
                                src={current.avatar}
                                alt={current.author || ''}
                                width={56}
                                height={56}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xl font-bold text-primary">
                                    {current?.author?.charAt(0) || 'A'}
                                </span>
                            </div>
                        )}

                        <div>
                            <div className="font-semibold">{current?.author}</div>
                            <div className="text-sm opacity-70">
                                {current?.role}{current?.company && `, ${current.company}`}
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    {testimonials.length > 1 && (
                        <div className="absolute bottom-8 right-8 flex gap-2">
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={prev}
                                className="h-10 w-10"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={next}
                                className="h-10 w-10"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Dots */}
                {testimonials.length > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={cn(
                                    'w-2 h-2 rounded-full transition-colors',
                                    index === currentIndex ? 'bg-primary' : 'bg-primary/30'
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default V2Testimonials;
