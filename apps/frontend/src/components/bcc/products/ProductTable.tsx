import React from 'react';
import { MoreHorizontal, Edit, Archive, Copy } from 'lucide-react';

interface ProductTableProps {
    products: any[];
}

export const ProductTable: React.FC<ProductTableProps> = ({ products }) => {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-[#161B22]/50 backdrop-blur-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40 font-bold border-b border-white/5">
                    <tr>
                        <th className="py-4 px-6">SKU Name</th>
                        <th className="py-4 px-6">Price Point</th>
                        <th className="py-4 px-6">Active Subs</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {products.map((product, i) => (
                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6">
                                <div className="font-bold text-white">{product.name}</div>
                                <div className="text-[10px] text-white/30 font-mono">{product.id || `SKU-00${i + 1}`}</div>
                            </td>
                            <td className="py-4 px-6 font-mono text-white/80">
                                {product.price} <span className="text-white/30 text-xs">/ {product.period}</span>
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex items-center space-x-2">
                                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00f0ff]" style={{ width: `${Math.min(product.activeTenants, 100)}%` }}></div>
                                    </div>
                                    <span className="text-xs text-white/60 font-mono">{product.activeTenants}</span>
                                </div>
                            </td>
                            <td className="py-4 px-6">
                                <span className={`text-[10px] uppercase font-bold tracking-widest ${product.status === 'active' ? 'text-[#9df425]' :
                                        product.status === 'draft' ? 'text-[#ff8c00]' :
                                            'text-white/20'
                                    }`}>
                                    {product.status}
                                </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                                <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Edit">
                                        <Edit className="w-3 h-3" />
                                    </button>
                                    <button className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-white" title="Duplicate">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                    <button className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-[#ff1a1a]" title="Archive">
                                        <Archive className="w-3 h-3" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
