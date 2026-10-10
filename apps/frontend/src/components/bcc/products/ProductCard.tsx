import React from 'react';
import { Package, CheckCircle2 } from 'lucide-react';
import { BccHudTile } from '@/components/brand/BccHudTile';
import type { Product } from '@/lib/api/commerceService';
import { activePriceLabels } from './product-contract';

interface ProductCardProps {
    product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { name, features } = product;
    const status = product.active ? 'active' : 'inactive';
    const prices = activePriceLabels(product.prices);

    // Determine accent color based on status
    const accentColor =
        status === 'active' ? '#9df425' :
            '#ffffff40';

    return (
        <BccHudTile
            title={status}
            subtitle={`SKU: ${name ? name.toUpperCase().replace(' ', '_') : 'UNKNOWN'}`}
            accentColor={accentColor}
            className="h-full flex flex-col"
            icon={Package}
            headerAction={
                <div className="flex items-baseline text-white">
                    <div className="text-sm font-bold tracking-tight">
                        {prices.length ? prices.map((price, index) => <div key={index}>{price}</div>) : "No active price"}
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                <p className="text-xs text-white/60">{product.description}</p>
                <p className="text-[10px] uppercase tracking-wide text-white/40">
                    {product.isPublic ? 'Public catalog' : 'Private catalog'}
                </p>

                {/* Feature List */}
                <div className="space-y-3 min-h-[80px]">
                    {(features ?? []).slice(0, 3).map((feature, i) => (
                        <div key={i} className="flex items-center space-x-3 text-[10px] text-white/60">
                            <CheckCircle2 className="w-3 h-3 opacity-50" style={{ color: accentColor }} />
                            <span className="uppercase tracking-wide">{feature}</span>
                        </div>
                    ))}
                    {(features?.length ?? 0) > 3 && (
                        <div className="text-[9px] text-white/20 pl-6 uppercase tracking-widest">
                            +{features!.length - 3} ADDITIONAL_MODULES
                        </div>
                    )}
                </div>
            </div>
        </BccHudTile>
    );
};

