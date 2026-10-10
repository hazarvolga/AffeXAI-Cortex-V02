'use client';
import * as React from 'react';
import { Activity } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface PermissionMatrixProps {
    roles: Array<{
        id: string;
        name: string;
        description: string;
        userCount: number;
        permissions: Record<string, boolean> | string[]; // Support both formats
    }>;
    resources: Array<{
        id: string;
        name: string;
        category: string;
        description: string;
    }>;
    onPermissionToggle: (roleId: string, resourceId: string) => void;
    onRoleSelect: (role: any) => void;
    readOnly?: boolean;
}

export function PermissionMatrix({
    roles,
    resources,
    onPermissionToggle,
    onRoleSelect,
    readOnly = false,
}: PermissionMatrixProps) {
    // Group resources by category
    const resourcesByCategory = resources.reduce((acc, resource) => {
        if (!acc[resource.category]) {
            acc[resource.category] = [];
        }
        acc[resource.category].push(resource);
        return acc;
    }, {} as Record<string, typeof resources>);

    const hasPermission = (role: any, resourceId: string) => {
        if (Array.isArray(role.permissions)) {
            return role.permissions.includes(resourceId);
        }
        return !!role.permissions[resourceId];
    };

    return (
        <div className="border border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-white/[0.03] border-b border-white/5 p-5 flex items-center justify-between">
                <div>
                    <div className="text-[14px] font-bold uppercase tracking-[0.3em] text-white flex items-center gap-3">
                        <div className="w-1 h-4 bg-[#9df425]" />
                        Access Matrix
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1.5 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#9df425] animate-pulse" />
                        Live Security Grid System
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#9df425]" />
                        <span className="text-[10px] uppercase font-mono text-white/40">Authorized</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-white/20" />
                        <span className="text-[10px] uppercase font-mono text-white/20">Restricted</span>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto relative scrollbar-hide">
                <table className="w-full border-collapse">
                    <thead className="bg-[#0a0a0a] sticky top-0 z-20">
                        <tr className="border-b border-white/10">
                            <th className="text-left p-4 text-[11px] uppercase tracking-[0.2em] text-white/40 font-mono min-w-[300px] border-r border-white/5">
                                Resource Node
                            </th>
                            {roles.map(role => (
                                <th
                                    key={role.id}
                                    className={cn(
                                        "text-center p-4 text-[11px] uppercase tracking-[0.2em] text-white/60 font-mono transition-all min-w-[160px]",
                                        !readOnly && "cursor-pointer hover:bg-white/[0.02]",
                                    )}
                                    onClick={() => !readOnly && onRoleSelect(role)}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-white hover:text-[#9df425] transition-colors">{role.name}</span>
                                        <span className="text-[9px] text-white/20 font-normal">
                                            [SEGMENT_{role.userCount}]
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(resourcesByCategory).map(([category, categoryResources]) => (
                            <React.Fragment key={`category-group-${category}`}>
                                {/* Category Header */}
                                <tr className="bg-white/[0.02]">
                                    <td
                                        colSpan={roles.length + 1}
                                        className="p-3 text-[11px] uppercase tracking-[0.4em] text-[#ff8c00] font-black border-y border-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="opacity-50 font-mono">::</span>
                                            {category}
                                            <span className="flex-1 h-[1px] bg-[#ff8c00]/10" />
                                        </div>
                                    </td>
                                </tr>

                                {/* Resources in Category */}
                                {categoryResources.map(resource => (
                                    <tr
                                        key={resource.id}
                                        className="border-b border-white/5 hover:bg-white/[0.01] transition-all group"
                                    >
                                        <td className="p-4 border-r border-white/5">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full border border-white/10 group-hover:bg-white/20" />
                                                <div>
                                                    <div className="text-[12px] text-white/90 font-semibold tracking-wide">
                                                        {resource.name}
                                                    </div>
                                                    <div className="text-[10px] text-white/30 mt-1 font-mono leading-relaxed max-w-[280px]">
                                                        {resource.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {roles.map(role => {
                                            const active = hasPermission(role, resource.id);
                                            return (
                                                <td key={`${role.id}-${resource.id}`} className="p-4 text-center">
                                                    <div className="flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                                        <Switch
                                                            checked={active}
                                                            onCheckedChange={() => onPermissionToggle(role.id, resource.id)}
                                                            disabled={readOnly}
                                                            className={cn(
                                                                "data-[state=checked]:bg-[#9df425] data-[state=unchecked]:bg-white/10",
                                                                "border border-white/5"
                                                            )}
                                                        />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="bg-white/[0.02] border-t border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-mono flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        Grid_Sync: Synchronized
                    </div>
                    <div className="h-3 w-[1px] bg-white/10" />
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-mono">
                        Density: {resources.length} Nodes × {roles.length} Vectors
                    </div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono italic">
                    [Access Matrix v4.28 (Phase-4c)]
                </div>
            </div>
        </div>
    );
}
