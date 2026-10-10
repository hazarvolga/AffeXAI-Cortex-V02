"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BccHudTileProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    headerAction?: ReactNode;
    footer?: ReactNode;
    icon?: string | React.ElementType; // Material Icon name or Lucide Component
    accentColor?: string;
}

export const BccHudTile = ({
    title,
    subtitle,
    children,
    className,
    headerAction,
    footer,
    icon,
    accentColor = "#ff8c00"
}: BccHudTileProps) => {
    return (
        <div className={cn(
            "relative bg-[#0a0a0a]/40 border border-white/5 backdrop-blur-md rounded-none overflow-hidden transition-all duration-300 hover:border-white/10 group",
            className
        )}>
            {/* Decorative Accent Line */}
            <div className="absolute top-0 left-0 w-full h-px opacity-20 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accentColor }}></div>
            <div className="absolute top-0 left-0 w-px h-12 opacity-20 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accentColor }}></div>

            {/* Header */}
            {(title || subtitle || icon || headerAction) && (
                <div className="p-6 border-b border-white/5 flex justify-between items-start pt-8">
                    <div className="flex items-start space-x-4">
                        {icon && (
                            typeof icon === 'string' ? (
                                <span className="material-icons text-white/40 text-lg group-hover:text-white transition-colors" style={{ color: accentColor }}>{icon}</span>
                            ) : (
                                <div className="text-white/40 group-hover:text-white transition-colors" style={{ color: accentColor }}>
                                    {React.createElement(icon as React.ElementType, { size: 18 })}
                                </div>
                            )
                        )}
                        <div>
                            {title && (
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1 group-hover:text-white transition-colors">
                                    {title}
                                </h3>
                            )}
                            {subtitle && (
                                <p className="text-[9px] text-white/20 uppercase tracking-widest font-mono">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {headerAction && (
                        <div className="flex items-center">
                            {headerAction}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-6 text-white/80 font-mono text-xs">
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    {footer}
                </div>
            )}
        </div>
    );
};
