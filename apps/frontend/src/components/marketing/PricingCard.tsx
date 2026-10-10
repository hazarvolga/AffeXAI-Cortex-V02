'use client';

import React from 'react';
import { Check, Lock } from 'lucide-react';
import { Product } from '@/lib/mock-data/products';

interface PricingCardProps {
    product: Product;
    onPurchase: (product: Product) => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({ product, onPurchase }) => {
    const isGold = product.highlight;

    return (
        <div className={`
            flex flex-col h-full p-8 border hover:bg-[#1a1a1a]/50 transition-colors
            ${isGold
                ? 'border-[#f9bc06]/50 bg-[#f9bc06]/[0.03] relative overflow-hidden'
                : 'border-[#3a3527] bg-[#1a1a1a]/30'
            }
        `}>
            {isGold && (
                <div className="absolute top-0 right-0 p-4">
                    <span className="text-[10px] font-mono text-[#f9bc06] uppercase bg-[#f9bc06]/10 px-2 py-1">
                        Recommended
                    </span>
                </div>
            )}

            <div className="mb-8">
                <span className={`text-xs font-mono uppercase ${isGold ? 'text-[#f9bc06]' : 'text-[#554e3a]'}`}>
                    {product.id}
                </span>
                <h3 className="text-xl font-bold uppercase mt-2 text-white">
                    {product.name}
                </h3>
                <p className="text-xs font-light text-[#bbb39b] mt-2 min-h-[40px]">
                    {product.description}
                </p>
            </div>

            <ul className="space-y-4 mb-12 flex-1">
                {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-[#bbb39b] font-light">
                        <Check className={`size-4 mt-0.5 ${isGold ? 'text-[#f9bc06]' : 'text-[#bbb39b]'}`} />
                        <span className="text-white/80">{feature}</span>
                    </li>
                ))}

                {/* Visual Filler for visual balance */}
                {!isGold && (
                    <li className="flex items-start gap-3 text-sm text-[#554e3a] font-light pt-2 opacity-50">
                        <Lock className="size-4 mt-0.5 text-[#f9bc06]/20" />
                        <span>Advanced Neural Nodes</span>
                    </li>
                )}
            </ul>

            <div className="pt-6 border-t border-[#3a3527]">
                <div className="flex justify-between items-end mb-4">
                    <p className={`text-2xl font-mono tracking-tighter ${isGold ? 'text-[#f9bc06]' : 'text-white'}`}>
                        {product.price}
                    </p>
                </div>

                <button
                    onClick={() => onPurchase(product)}
                    className={`
                        w-full py-3 text-xs font-bold uppercase tracking-widest transition-all
                        ${isGold
                            ? 'bg-[#f9bc06] text-black hover:bg-white hover:scale-[1.02]'
                            : 'bg-transparent border border-[#3a3527] text-[#bbb39b] hover:border-white hover:text-white'
                        }
                    `}
                >
                    {product.cta}
                </button>
            </div>
        </div>
    );
};
