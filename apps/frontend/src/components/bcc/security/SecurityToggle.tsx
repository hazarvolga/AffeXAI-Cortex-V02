'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';

interface SecurityToggleProps {
    label: string;
    description: string;
    isActive: boolean;
    onToggle: (newState: boolean) => void;
    locked?: boolean;
}

export const SecurityToggle: React.FC<SecurityToggleProps> = ({
    label,
    description,
    isActive,
    onToggle,
    locked = false
}) => {
    return (
        <div className={`
            relative p-6 rounded-none border border-white/5 bg-[#0a0a0a]/40 backdrop-blur-md overflow-hidden group hover:border-[#9df425]/30 transition-all duration-300
            ${locked ? 'opacity-50 pointer-events-none' : ''}
        `}>
            {/* Background Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#9df425]/5 to-transparent -skew-x-12 translate-x-[-200%] group-hover:animate-shine pointer-events-none"></div>

            <div className="flex justify-between items-start">
                <div className="pr-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                        {isActive ? <Lock className="w-3 h-3 text-[#9df425]" /> : <Unlock className="w-3 h-3 text-[#ff1a1a]" />}
                        {label}
                    </h3>
                    <p className="text-[10px] text-white/40 font-mono leading-relaxed max-w-[200px]">
                        {description}
                    </p>
                </div>

                {/* Cyber Switch */}
                <div
                    onClick={() => !locked && onToggle(!isActive)}
                    className="cursor-pointer relative"
                >
                    {/* Switch Track */}
                    <div className={`
                        w-12 h-6 rounded-full border transition-colors duration-300
                        ${isActive
                            ? 'bg-[#9df425]/20 border-[#9df425]'
                            : 'bg-white/5 border-white/10'
                        }
                    `}></div>

                    {/* Switch Handle */}
                    <motion.div
                        initial={false}
                        animate={{
                            x: isActive ? 24 : 2,
                            backgroundColor: isActive ? '#9df425' : '#666666'
                        }}
                        className="absolute top-1 left-0 w-4 h-4 rounded-full shadow-lg"
                    />
                </div>
            </div>

            {/* Status Line */}
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] uppercase tracking-widest font-mono">
                <span className="text-white/20">Protocol Status</span>
                <span className={`${isActive ? 'text-[#9df425]' : 'text-[#ff1a1a]'}`}>
                    {isActive ? 'ARMED' : 'DISARMED'}
                </span>
            </div>
        </div>
    );
};
