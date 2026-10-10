'use client';

import { useState } from 'react';
import { useWizardStore } from './wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import {
    CheckCircle2,
    AlertTriangle,
    ArrowLeft,
    Rocket,
    Cpu,
    GitBranch,
    Zap,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { automationApi } from '@/lib/api/automation';
import { useToast } from '@/hooks/use-toast';

export function ActivationConsole() {
    const router = useRouter();
    const { toast } = useToast();
    const { draftData, setDraftData, setStep, resetWizard } = useWizardStore();
    const [isDeploying, setIsDeploying] = useState(false);

    // Mock validation checks
    const validations = [
        { id: 1, label: 'TRIGGER_VECTOR_LOCKED', status: 'pass', icon: Zap },
        { id: 2, label: 'NODE_INTEGRITY_CHECK', status: 'pass', icon: GitBranch },
        { id: 3, label: 'LOGIC_GATE_VALIDATION', status: 'pass', icon: Cpu },
        { id: 4, label: 'EMAIL_TEMPLATE_ASSETS', status: 'warn', message: '2 Templates using placeholder content', icon: Info },
    ];

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            // In a real app, we would construct the full DTO from wizard state
            // For now, we simulate the API call
            await automationApi.create({
                name: draftData.name || 'Untitled Automation',
                description: draftData.description,
                isActive: (draftData as any).isActive,
                // steps: ... (would come from builder state)
                trigger: (draftData as any).trigger,
            } as any);

            toast({
                title: "SYSTEM_ACTIVATED",
                description: "Automation neural lattice deployed successfully.",
                className: "bg-[#9df425] text-black border-none font-mono uppercase tracking-widest",
            });

            // Navigate back to list
            router.push('../automations');
            resetWizard(); // Clean up state
        } catch (error) {
            toast({
                variant: "destructive",
                title: "DEPLOYMENT_FAILURE",
                description: "Neural handshake failed. Check console telemetry.",
            });
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto w-full relative">
            <div className="p-8 pb-4">
                <h2 className="text-[20px] font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-3">
                    <Rocket className="w-5 h-5 text-[#9df425]" />
                    Pre-Flight Activation Console
                </h2>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                    Final system validation before automated execution commencement.
                </p>
            </div>

            <div className="flex-1 flex gap-8 px-8 pb-32 overflow-hidden">
                {/* Left: Settings */}
                <div className="flex-1 space-y-8 overflow-y-auto pr-4">
                    <div className="space-y-6 bg-white/[0.02] border border-white/5 p-6">
                        <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest border-b border-white/5 pb-2">
                            Identity_Parameters
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[9px] uppercase tracking-widest text-[#9df425]">System Name</Label>
                                <Input
                                    value={draftData.name || ''}
                                    onChange={(e) => setDraftData({ name: e.target.value })}
                                    className="bg-black/40 border-white/10 text-white font-mono text-[11px] h-10 rounded-none focus:border-[#9df425]/50 focus:ring-0"
                                    placeholder="ENTER_SYSTEM_DESIGNATOR"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[9px] uppercase tracking-widest text-white/40">Operational Brief (Description)</Label>
                                <Textarea
                                    value={draftData.description || ''}
                                    onChange={(e) => setDraftData({ description: e.target.value })}
                                    className="bg-black/40 border-white/10 text-white font-mono text-[11px] min-h-[80px] rounded-none focus:border-[#9df425]/50 focus:ring-0 resize-none"
                                    placeholder="DESCRIBE_OBJECTIVE_PARAMETERS"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 bg-white/[0.02] border border-white/5 p-6">
                        <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest border-b border-white/5 pb-2">
                            State_Control
                        </h3>

                        <div className="flex items-center justify-between p-4 border border-white/5 bg-black/20">
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-white uppercase tracking-widest">Active Status</div>
                                <div className="text-[9px] text-white/40 font-mono">
                                    {(draftData as any).isActive ? 'SYSTEM_ONLINE' : 'SYSTEM_OFFLINE (DRAFT)'}
                                </div>
                            </div>
                            <Switch
                                checked={(draftData as any).isActive}
                                onCheckedChange={(checked) => setDraftData({ isActive: checked } as any)}
                                className="data-[state=checked]:bg-[#9df425]"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Validation Log */}
                <div className="w-80 border-l border-white/5 pl-8 flex flex-col">
                    <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4">
                        System_Diagnostics
                    </h3>

                    <div className="flex-1 space-y-3">
                        {validations.map((v) => {
                            const Icon = v.icon;
                            return (
                                <div key={v.id} className="flex items-start gap-3 p-3 bg-white/[0.01] border border-white/5">
                                    <div className={cn(
                                        "mt-0.5",
                                        v.status === 'pass' ? "text-[#9df425]" :
                                            v.status === 'warn' ? "text-[#ff8c00]" : "text-red-500"
                                    )}>
                                        {v.status === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                    </div>
                                    <div>
                                        <div className={cn(
                                            "text-[9px] font-bold uppercase tracking-widest",
                                            v.status === 'pass' ? "text-white/80" : "text-white"
                                        )}>
                                            {v.label}
                                        </div>
                                        {v.message && (
                                            <div className="text-[8px] font-mono text-white/40 mt-1 uppercase">
                                                {v.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pt-6 pb-6 border-t border-white/5 bg-black/80 backdrop-blur-xl flex justify-between z-50">
                <Button
                    variant="ghost"
                    onClick={() => setStep('workflow')}
                    className="text-white/40 hover:text-white uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                    <ArrowLeft className="w-3 h-3" />
                    Revise_Workflow
                </Button>
                <Button
                    onClick={handleDeploy}
                    disabled={!draftData.name || isDeploying}
                    className={cn(
                        "rounded-none text-black transition-all font-bold text-[10px] tracking-[0.2em] uppercase h-10 px-8 shadow-lg",
                        isDeploying
                            ? "bg-[#9df425]/50 cursor-wait"
                            : "bg-[#9df425] hover:bg-[#86d11f] shadow-[#9df425]/10"
                    )}
                >
                    {isDeploying ? 'INITIALIZING...' : 'INITIATE_DEPLOYMENT'}
                </Button>
            </div>
        </div>
    );
}
