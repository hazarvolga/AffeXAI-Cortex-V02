'use client';

/**
 * V2 CTA Banner Block
 * Schema-validated call-to-action banner
 * Supports inline editing
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface V2CtaBannerProps {
    heading?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonVariant?: 'default' | 'outline' | 'secondary';
    alignment?: 'left' | 'center' | 'right';
    className?: string;
    // Inline editing
    isEditing?: boolean;
    onPropChange?: (key: string, value: any) => void;
}

export function V2CtaBanner({
    heading = 'Ready to Get Started?',
    description = 'Join thousands of satisfied customers today.',
    buttonText = 'Start Free Trial',
    buttonLink = '#',
    backgroundColor = '#4f46e5',
    textColor = '#ffffff',
    buttonVariant = 'secondary',
    alignment = 'center',
    className,
    isEditing = false,
    onPropChange,
}: V2CtaBannerProps) {
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
            minWidth: '50px',
        },
    } : {};

    return (
        <section
            className={cn('py-16 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className={cn(
                'container mx-auto flex flex-col gap-4 max-w-3xl',
                alignmentClasses[alignment]
            )}>
                <h2
                    className={cn(
                        "text-2xl md:text-3xl lg:text-4xl font-bold",
                        isEditing && "hover:ring-2 hover:ring-white/50 rounded px-2 -mx-2"
                    )}
                    onBlur={handleBlur('heading')}
                    {...editableProps}
                >
                    {heading}
                </h2>

                <p
                    className={cn(
                        "text-lg opacity-90 max-w-xl",
                        isEditing && "hover:ring-2 hover:ring-white/50 rounded px-2 -mx-2"
                    )}
                    onBlur={handleBlur('description')}
                    {...editableProps}
                >
                    {description || (isEditing ? 'Click to add description...' : '')}
                </p>

                {(buttonText || isEditing) && (
                    <div className="mt-2">
                        {isEditing ? (
                            <Button size="lg" variant={buttonVariant} className="pointer-events-none">
                                <span
                                    className="hover:ring-2 hover:ring-primary/50 rounded px-1"
                                    onBlur={handleBlur('buttonText')}
                                    {...editableProps}
                                    style={{ ...editableProps.style, pointerEvents: 'auto' }}
                                >
                                    {buttonText || 'Button text...'}
                                </span>
                            </Button>
                        ) : (
                            buttonLink && (
                                <Link href={buttonLink}>
                                    <Button size="lg" variant={buttonVariant}>
                                        {buttonText}
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

export default V2CtaBanner;
