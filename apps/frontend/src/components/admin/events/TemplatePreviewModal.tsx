import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EventPreviewCard } from "./EventPreviewCard";
import { Check } from "lucide-react";

interface TemplatePreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: {
        id: string;
        name: string;
        color: string;
        pattern: string;
        description?: string;
    };
    onSelect: (templateId: string) => void;
}

export function TemplatePreviewModal({ open, onOpenChange, template, onSelect }: TemplatePreviewModalProps) {
    if (!template) return null;

    // Dummy data optimized for showing off the template
    const previewData = {
        title: "QUANTUM LEAP SUMMIT 2025",
        description: "Join the architectural revolution. Experience the convergence of AI, design, and human telemetry in a 3-day immersive singularity event. Secure your access node today.",
        templateId: template.id,
        startDate: new Date().toISOString(),
        metadata: {
            category: "SUMMIT",
            visual: {
                primaryColor: template.color,
                // Using a generic tech placeholder if no URL provided
                heroImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
            },
            ticketTypes: [{ quantity: 500 }]
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl bg-[#0f0f0f] border-white/10 p-0 overflow-hidden gap-0 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] h-[80vh] md:h-[600px]">

                    {/* Left: Preview Canvas */}
                    <div className="bg-black relative overflow-hidden flex items-center justify-center border-r border-white/10">
                        {/* Desktop Frame Mockup */}
                        <div className="w-full max-w-[400px] h-[90%] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
                            {/* Browser Bar */}
                            <div className="h-6 bg-zinc-800 flex items-center px-3 space-x-1.5 border-b border-white/5">
                                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                            </div>
                            <EventPreviewCard data={previewData} className="h-[calc(100%-24px)]" />
                        </div>
                    </div>

                    {/* Right: Details & Action */}
                    <div className="p-8 flex flex-col bg-[#0f0f0f]">
                        <DialogHeader className="mb-6">
                            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">Template Specs</div>
                            <DialogTitle className="text-2xl text-white font-bold tracking-tight uppercase font-mono">
                                {template.name}
                            </DialogTitle>
                            <DialogDescription className="text-white/50 text-xs font-mono mt-2 leading-relaxed">
                                High-performance visual matrix optimized for {template.name.toLowerCase()} events.
                                Includes auto-generated telemetry visualizations and responsive grid layouts.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-grow space-y-6">
                            <div className="space-y-2">
                                <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Recommended For</div>
                                <div className="flex flex-wrap gap-2">
                                    {["Launch", "Summit", "Keynote"].map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-white/5 text-white/60 text-[9px] uppercase rounded-sm border border-white/5">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Visual Signature</div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: template.color }}></div>
                                    <div className="text-xs text-white/60 font-mono">
                                        Primary: <span className="uppercase">{template.color}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-8 pt-8 border-t border-white/5">
                            <Button
                                onClick={() => onSelect(template.id)}
                                className="w-full bg-[#ff8c00] text-black hover:bg-[#ff8c00]/90 rounded-none h-12 uppercase font-bold tracking-widest text-xs"
                            >
                                <Check className="w-4 h-4 mr-2" /> Use This Template
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
