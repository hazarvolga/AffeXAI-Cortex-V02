'use client';

/**
 * V2 Feature Grid Block
 * Schema-validated feature grid with icons
 * Supports inline editing
 */

import React from 'react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

export interface FeatureItem {
    icon?: string;
    title?: string;
    description?: string;
}

export interface V2FeatureGridProps {
    heading?: string;
    subheading?: string;
    columns?: 2 | 3 | 4;
    features?: FeatureItem[];
    backgroundColor?: string;
    textColor?: string;
    className?: string;
    // Inline editing
    isEditing?: boolean;
    onPropChange?: (key: string, value: any) => void;
}

export function V2FeatureGrid({
    heading = 'Why Choose Us',
    subheading = 'Discover the features that make us stand out',
    columns = 3,
    features = [
        { icon: 'Zap', title: 'Fast Performance', description: 'Lightning-fast load times' },
        { icon: 'Shield', title: 'Secure', description: 'Enterprise-grade security' },
        { icon: 'Users', title: 'Collaborative', description: 'Built for teams' },
    ],
    backgroundColor = '#ffffff',
    textColor = '#1a1a2e',
    className,
    isEditing = false,
    onPropChange,
}: V2FeatureGridProps) {
    const columnClasses = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-2 lg:grid-cols-3',
        4: 'md:grid-cols-2 lg:grid-cols-4',
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
            className={cn('py-16 md:py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto">
                {/* Header */}
                <div className="text-center mb-12 max-w-2xl mx-auto">
                    <h2
                        className={cn(
                            "text-3xl md:text-4xl font-bold mb-4",
                            isEditing && "hover:ring-2 hover:ring-primary/50 rounded px-2 -mx-2"
                        )}
                        onBlur={handleBlur('heading')}
                        {...editableProps}
                    >
                        {heading}
                    </h2>
                    <p
                        className={cn(
                            "text-lg opacity-70",
                            isEditing && "hover:ring-2 hover:ring-primary/50 rounded px-2 -mx-2"
                        )}
                        onBlur={handleBlur('subheading')}
                        {...editableProps}
                    >
                        {subheading || (isEditing ? 'Click to add subheading...' : '')}
                    </p>
                </div>

                {/* Features Grid */}
                <div className={cn('grid gap-8', columnClasses[columns])}>
                    {features?.map((feature, index) => {
                        const IconComponent = feature.icon
                            ? (LucideIcons as any)[feature.icon] || LucideIcons.Star
                            : LucideIcons.Star;

                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center text-center p-6 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
                            >
                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <IconComponent className="w-7 h-7 text-primary" />
                                </div>

                                <h3 className="text-xl font-semibold mb-2">
                                    {feature.title || 'Feature'}
                                </h3>

                                <p className="text-sm opacity-70">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default V2FeatureGrid;
