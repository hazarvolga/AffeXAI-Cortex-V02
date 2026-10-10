'use client';

import { STRATEGIC_TEMPLATES, StrategicTemplate } from './strategic-templates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GitBranch, Zap, Trophy, Users, ArrowRight } from 'lucide-react';

interface TemplateGalleryProps {
    onSelect: (template: StrategicTemplate) => void;
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'ONBOARDING': return <Zap className="h-4 w-4 text-[#9df425]" />;
            case 'RETENTION': return <Users className="h-4 w-4 text-[#ff8c00]" />;
            case 'NURTURE': return <GitBranch className="h-4 w-4 text-blue-400" />;
            case 'VIP': return <Trophy className="h-4 w-4 text-purple-400" />;
            default: return <GitBranch className="h-4 w-4" />;
        }
    };

    return (
        <div className="grid gap-6 p-1">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {STRATEGIC_TEMPLATES.map((template) => (
                    <Card
                        key={template.id}
                        className="group relative bg-[#0a0a0a] border border-white/5 hover:border-[#9df425]/50 transition-all duration-300 cursor-pointer overflow-hidden"
                        onClick={() => onSelect(template)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#9df425]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <CardHeader className="relative space-y-3 pb-3">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 text-[9px] tracking-widest font-mono uppercase">
                                    {template.category}
                                </Badge>
                                {getCategoryIcon(template.category)}
                            </div>
                            <CardTitle className="text-sm font-bold tracking-wider uppercase text-white group-hover:text-[#9df425] transition-colors">
                                {template.name.replace(/_/g, ' ')}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="relative space-y-4">
                            <CardDescription className="text-[10px] uppercase tracking-wide text-white/40 line-clamp-3">
                                {template.description}
                            </CardDescription>

                            <div className="pt-2 flex items-center justify-between border-t border-white/5">
                                <span className="text-[9px] font-mono text-white/30 uppercase">
                                    {template.nodes.length} NODES
                                </span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[9px] uppercase tracking-widest text-[#9df425] hover:text-[#9df425] hover:bg-[#9df425]/10 p-0 px-2"
                                >
                                    INITIALIZE <ArrowRight className="ml-2 h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
