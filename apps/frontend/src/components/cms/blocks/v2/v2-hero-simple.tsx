'use client';

/**
 * V2 Hero Simple Block
 * Schema-validated simple hero with title, subtitle, and CTA
 * Supports inline editing when isEditing=true
 */

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface V2HeroSimpleProps {
    title?: string;
    subtitle?: string;
    alignment?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    textColor?: string;
    ctaText?: string;
    ctaLink?: string;
    ctaVariant?: 'default' | 'outline' | 'secondary';
    className?: string;
    // Inline editing props
    isEditing?: boolean;
    onPropChange?: (key: string, value: any) => void;
}

export function V2HeroSimple({
    title = 'Welcome to Our Platform',
    subtitle = 'Discover amazing features and possibilities.',
    alignment = 'center',
    backgroundColor = '#1a1a2e',
    textColor = '#ffffff',
    ctaText = 'Get Started',
    ctaLink = '#',
    ctaVariant = 'default',
    className,
    isEditing = false,
    onPropChange,
}: V2HeroSimpleProps) {
    const alignmentClasses = {
        left: 'text-left items-start',
        center: 'text-center items-center',
        right: 'text-right items-end',
    };

    const handleBlur = (key: string) => (e: React.FocusEvent<HTMLElement>) => {
        if (onPropChange && isEditing) {
            onPropChange(key, e.currentTarget.textContent || '');
        }
    };

    const editableProps = isEditing ? {
        contentEditable: true,
        suppressContentEditableWarning: true,
        style: {
            outline: 'none',
            cursor: 'text',
            minWidth: '100px',
        },
    } : {};

    return (
        <section
            className={cn('py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className={cn('container mx-auto flex flex-col gap-6', alignmentClasses[alignment])}>
                <h1
                    className={cn(
                        "text-4xl md:text-5xl lg:text-6xl font-bold max-w-4xl leading-tight",
                        isEditing && "hover:ring-2 hover:ring-primary/50 rounded px-2 -mx-2 transition-all"
                    )}
                    onBlur={handleBlur('title')}
                    {...editableProps}
                >
                    {title}
                </h1>

                <p
                    className={cn(
                        "text-lg md:text-xl opacity-80 max-w-2xl",
                        isEditing && "hover:ring-2 hover:ring-primary/50 rounded px-2 -mx-2 transition-all"
                    )}
                    onBlur={handleBlur('subtitle')}
                    {...editableProps}
                >
                    {subtitle || (isEditing ? 'Click to add subtitle...' : '')}
                </p>

                {(ctaText || isEditing) && (
                    <div className="mt-4">
                        {isEditing ? (
                            <Button
                                size="lg"
                                variant={ctaVariant}
                                className="pointer-events-none"
                            >
                                <span
                                    className="hover:ring-2 hover:ring-white/50 rounded px-1 -mx-1"
                                    onBlur={handleBlur('ctaText')}
                                    {...editableProps}
                                    style={{ ...editableProps.style, pointerEvents: 'auto' }}
                                >
                                    {ctaText || 'Button text...'}
                                </span>
                            </Button>
                        ) : (
                            ctaLink && (
                                <Link href={ctaLink}>
                                    <Button size="lg" variant={ctaVariant}>
                                        {ctaText}
                                    </Button>
                                </Link>
                            )
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

export default V2HeroSimple;
