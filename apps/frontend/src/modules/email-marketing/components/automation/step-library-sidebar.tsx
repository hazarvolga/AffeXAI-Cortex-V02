'use client';

import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Clock,
  GitBranch,
  CheckCircle2,
  GripVertical,
  Tag,
  GitFork,
} from 'lucide-react';

type StepType = 'sendEmail' | 'delay' | 'branch' | 'tag' | 'condition' | 'exit';

interface StepDefinition {
  type: StepType;
  label: string;
  description: string;
  icon: typeof Mail;
  color: string;
  bgColor: string;
}

const STEP_LIBRARY: StepDefinition[] = [
  {
    type: 'sendEmail',
    label: 'NODE_TRANSMISSION',
    description: 'Data packet broadcast to mapped nodes',
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    type: 'delay',
    label: 'TEMPORAL_MARK',
    description: 'Suspends stream for specified duration',
    icon: Clock,
    color: 'text-[#ff8c00]',
    bgColor: 'bg-[#ff8c00]/10',
  },
  {
    type: 'branch',
    label: 'PATH_FORK',
    description: 'Split stream via logic or A/B distribution',
    icon: GitFork,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    type: 'tag',
    label: 'METADATA_TAG',
    description: 'Append/Remove node identity markers',
    icon: Tag,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    type: 'condition',
    label: 'LOGIC_LATTICE',
    description: 'Branching path logic synchronization',
    icon: GitBranch,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    type: 'exit',
    label: 'PROCESS_TERMINAL',
    description: 'End transmission and release nodes',
    icon: CheckCircle2,
    color: 'text-[#9df425]',
    bgColor: 'bg-[#9df425]/10',
  },
];

interface StepLibrarySidebarProps {
  onDragStart?: (event: React.DragEvent, stepType: StepType) => void;
}

export function StepLibrarySidebar({ onDragStart }: StepLibrarySidebarProps) {
  const handleDragStart = (event: React.DragEvent, stepType: StepType) => {
    event.dataTransfer.setData('application/reactflow', stepType);
    event.dataTransfer.effectAllowed = 'move';

    if (onDragStart) {
      onDragStart(event, stepType);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/[0.01]">
        <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Module_Library</h3>
        <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold mt-1">Nodal Steps</p>
      </div>

      {/* Step Library */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Available_Ops</div>

            <div className="space-y-3">
              {STEP_LIBRARY.map((step) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, step.type)}
                    className="group cursor-move bg-white/[0.02] border border-white/5 p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2 rounded-none border border-white/5 ${step.bgColor} flex-shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="text-[10px] font-bold text-white tracking-widest uppercase">{step.label}</div>
                        <div className="text-[9px] text-white/30 mt-1 uppercase tracking-wider leading-relaxed">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="p-6 pt-0">
          <div className="bg-white/[0.01] border border-white/5 p-4 space-y-4">
            <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Protocol_Tips</div>
            <div className="space-y-3">
              {[
                "Drag components onto synthesize canvas",
                "Link nodes via neural connection points",
                "Probe nodes for configuration profile"
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[9px] font-mono text-white/10 uppercase">[{i + 1}]</span>
                  <span className="text-[9px] text-white/30 uppercase tracking-wider leading-tight">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
