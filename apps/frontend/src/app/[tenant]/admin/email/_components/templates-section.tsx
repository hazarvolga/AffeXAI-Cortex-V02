'use client';

import { useState, useEffect } from 'react';
import { CardFooter, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LayoutTemplate, Eye, Pen, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import templatesService, { EmailTemplate } from '@/lib/api/templatesService';

export function TemplatesSection() {
    const params = useParams();
    const tenant = params?.tenant as string || 'default';
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await templatesService.getAllTemplates();
                setTemplates(data);
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff8c00]">Accessing Blueprint Registry...</div>
            </div>
        );
    }

    if (!templates || templates.length === 0) {
        return (
            <div className="space-y-6">
                <div className="text-center py-16 border border-dashed border-white/5 bg-white/[0.01]">
                    <LayoutTemplate className="h-10 w-10 mx-auto mb-4 text-white/10" />
                    <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Registry_Empty</h3>
                    <p className="mt-2 text-[9px] text-white/20 uppercase tracking-[0.2em]">Zero transmission blueprints detected in current cluster.</p>
                </div>
                <div className="flex justify-center">
                    <Button className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold text-[9px] tracking-[0.2em] uppercase px-8">
                        <PlusCircle className="mr-2 h-4 w-4" /> Initialize_New_Blueprint
                    </Button>
                </div>
            </div>
        )
    }

    // Map templates to display format
    const allTemplates = templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description || 'No operational description provided.',
        thumbnailUrl: template.thumbnailUrl || '/placeholders/template-default.svg',
        createdAt: template.createdAt,
    }));

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader className="border-white/5 bg-white/[0.02]">
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="w-[140px] text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 px-6">Schematic</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Blueprint_ID</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Operational_Spec</TableHead>
                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] py-4">Epoch_Created</TableHead>
                        <TableHead className="text-right text-white/40 uppercase tracking-[0.2em] text-[9px] py-4 px-6">Ops</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allTemplates.map(template => (
                        <TableRow key={template.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                            <TableCell className="py-4 px-6">
                                <div className="relative aspect-[4/3] w-[120px] overflow-hidden border border-white/10 p-0.5 bg-[#0a0a0a]">
                                    <Image
                                        src={template.thumbnailUrl}
                                        alt={template.name}
                                        width={120}
                                        height={90}
                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </TableCell>
                            <TableCell className="py-4 font-medium">
                                <Link href={`/${tenant}/admin/email/templates/${template.id}/edit`} className="text-white hover:text-[#ff8c00] transition-colors uppercase tracking-tight text-xs">
                                    {template.name}
                                </Link>
                                <div className="text-[9px] text-white/20 font-mono mt-0.5 group-hover:text-white/40 transition-colors">T_SPEC: {template.id.split('-')[0]}</div>
                            </TableCell>
                            <TableCell className="text-white/40 text-[10px] font-mono leading-relaxed max-w-[240px] truncate uppercase tracking-widest text-pretty">
                                {template.description}
                            </TableCell>
                            <TableCell className="text-[10px] font-mono text-white/40 uppercase tracking-tighter tabular-nums">
                                {new Date(template.createdAt).toLocaleDateString('en-GB')}
                            </TableCell>
                            <TableCell className="text-right px-6">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" className="h-8 rounded-none border border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/5 text-[8px] uppercase tracking-widest px-3" asChild>
                                        <Link href={`/${tenant}/admin/email/templates/${template.id}/preview`} target="_blank">
                                            <Eye className="mr-2 h-3.5 w-3.5 opacity-40" /> PREVIEW
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 rounded-none border border-[#ff8c00]/20 bg-[#ff8c00]/5 text-[#ff8c00]/60 hover:text-[#ff8c00] hover:bg-[#ff8c00]/10 text-[8px] uppercase tracking-widest px-3" asChild>
                                        <Link href={`/${tenant}/admin/email/templates/${template.id}/edit`}>
                                            <Pen className="mr-2 h-3.5 w-3.5 opacity-40" /> CONFIGURE
                                        </Link>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-mono">
                    BLUEPRINT_STORAGE: <span className="text-white font-bold">{templates.length}</span> DEFINITIONS FOUND
                </div>
                <Button className="h-8 rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold text-[8px] tracking-[0.2em] uppercase px-4">
                    <PlusCircle className="mr-2 h-3.5 w-3.5" /> Initialize_New_Blueprint
                </Button>
            </div>
        </div>
    )
}