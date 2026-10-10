'use client';

import { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  X,
  Settings,
  Mail,
  Clock,
  GitBranch,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Node } from '@xyflow/react';

import {
  SendEmailConfigForm,
  type SendEmailConfigData,
  DelayConfigForm,
  type DelayConfigData,
  ConditionConfigForm,
  type ConditionConfigData,
  BranchConfigForm,
  type BranchConfigData,
  TagConfigForm,
  type TagConfigData,
} from './workflow-config-forms';

interface ConfigurationPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdate?: (nodeId: string, data: any) => void;
}

export function ConfigurationPanel({
  selectedNode,
  onClose,
  onUpdate
}: ConfigurationPanelProps) {
  if (!selectedNode) {
    return null;
  }

  const getNodeIcon = () => {
    switch (selectedNode.type) {
      case 'startNode':
        return Settings;
      case 'sendEmailNode':
        return Mail;
      case 'delayNode':
        return Clock;
      case 'conditionNode':
        return GitBranch;
      case 'branchNode':
        return GitBranch;
      case 'tagNode':
        return Settings; // Or Tag icon if available, generic fallback for now or import Tag
      case 'exitNode':
        return CheckCircle2;
      default:
        return Settings;
    }
  };

  const getConfig = () => {
    switch (selectedNode.type) {
      case 'startNode':
        return { color: '#9df425', label: 'INITIAL_TRIGGER', bg: 'bg-[#9df425]/10' };
      case 'sendEmailNode':
        return { color: '#3b82f6', label: 'EMAIL_TRANSMIT', bg: 'bg-[#3b82f6]/10' };
      case 'delayNode':
        return { color: '#ff8c00', label: 'TEMPORAL_BUFFER', bg: 'bg-[#ff8c00]/10' };
      case 'conditionNode':
        return { color: '#8b5cf6', label: 'LOGIC_LATTICE', bg: 'bg-[#8b5cf6]/10' };
      case 'branchNode':
        return { color: '#8b5cf6', label: 'PATH_FORK', bg: 'bg-[#8b5cf6]/10' };
      case 'tagNode':
        return { color: '#06b6d4', label: 'METADATA_TAG', bg: 'bg-[#06b6d4]/10' };
      case 'exitNode':
        return { color: '#9df425', label: 'PATH_TERMINAL', bg: 'bg-[#9df425]/10' };
      default:
        return { color: '#ffffff44', label: 'GENERIC_NODE', bg: 'bg-white/5' };
    }
  };

  const nodeConfig = getConfig();
  const Icon = getNodeIcon();

  const handleFormUpdate = useCallback((data: any) => {
    if (onUpdate && selectedNode) {
      onUpdate(selectedNode.id, data);
    }
  }, [onUpdate, selectedNode]);

  const renderConfigurationForm = () => {
    if (!selectedNode) return null;

    switch (selectedNode.type) {
      case 'sendEmailNode':
        return (
          <SendEmailConfigForm
            data={selectedNode.data as SendEmailConfigData}
            onUpdate={handleFormUpdate}
          />
        );

      case 'delayNode':
        return (
          <DelayConfigForm
            data={selectedNode.data as DelayConfigData}
            onUpdate={handleFormUpdate}
          />
        );

      case 'conditionNode':
        return (
          <ConditionConfigForm
            data={selectedNode.data as ConditionConfigData}
            onUpdate={handleFormUpdate}
          />
        );

      case 'branchNode':
        return (
          <BranchConfigForm
            data={selectedNode.data as BranchConfigData}
            onUpdate={handleFormUpdate}
          />
        );

      case 'tagNode':
        return (
          <TagConfigForm
            data={selectedNode.data as TagConfigData}
            onUpdate={handleFormUpdate}
          />
        );

      case 'startNode':
        return (
          <div className="p-4 bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#9df425]" />
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Initialization Point</h4>
            </div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider leading-relaxed">
              This is the primary link establishing the workflow. Trigger parameters are locked to parent lattice settings.
            </p>
          </div>
        );

      case 'exitNode':
        return (
          <div className="p-4 bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#9df425]" />
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Termination Node</h4>
            </div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider leading-relaxed">
              Mapped nodes reaching this terminal will have their autonomous paths fulfilled and released.
            </p>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-white/[0.02] border border-white/5">
            <p className="text-[9px] text-white/30 uppercase font-mono tracking-widest">
              Lattice config profile undefined.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-none border border-white/5 ${nodeConfig.bg}`}>
              <Icon className="w-3.5 h-3.5" style={{ color: nodeConfig.color }} />
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">{nodeConfig.label}</h3>
              <p className="text-[8px] font-mono text-white/20 uppercase mt-1 tracking-widest">
                Node_Config_Probe
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-none border border-transparent hover:border-white/10 hover:bg-white/5 transition-all"
          >
            <X className="w-3.5 h-3.5 text-white/40" />
          </Button>
        </div>

        <div className="text-[7px] font-mono text-white/10 uppercase tracking-widest inline-block border border-white/5 px-2 py-0.5">
          LATTICE_ID: {selectedNode.id}
        </div>
      </div>

      {/* Configuration Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Dynamic Configuration Form */}
          <div className="space-y-4">
            <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Module_Profile</div>
            {renderConfigurationForm()}
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Node Data Display */}
          <div className="space-y-4">
            <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Neural_Telemetry</h4>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Type</label>
                  <div className="text-[10px] text-white/60 font-medium tracking-widest uppercase">
                    {selectedNode.type?.replace(/Node$/, '') || 'GENERIC'}
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Vector</label>
                  <div className="text-[10px] text-white/60 font-mono tracking-widest">
                    [{Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}]
                  </div>
                </div>
              </div>

              {selectedNode.data && Object.keys(selectedNode.data).length > 0 && (
                <div className="space-y-2">
                  <label className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Raw_Lattice_Data</label>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-none font-mono text-[8px] text-white/40 overflow-hidden leading-relaxed uppercase">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedNode.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Terminal_Ops</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none border-white/5 bg-white/[0.01] text-white/30 text-[8px] tracking-[0.2em] font-bold uppercase transition-all hover:bg-white/5"
                disabled
              >
                REPLICATE
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none border-red-500/20 bg-red-500/5 text-red-500/60 text-[8px] tracking-[0.2em] font-bold uppercase transition-all hover:bg-red-500/10"
                disabled
              >
                TERMINATE
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/5 bg-white/[0.01] space-y-2">
        <Button
          className="w-full rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] transition-all font-bold text-[9px] tracking-[0.2em] uppercase h-10 shadow-lg shadow-[#9df425]/10"
          size="sm"
          disabled
        >
          SYNC_CHANGES
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-none border-white/10 text-white/60 hover:bg-white/5 transition-all font-bold text-[9px] tracking-[0.2em] uppercase h-10"
          size="sm"
          onClick={onClose}
        >
          DISCONNECT_PROBE
        </Button>
      </div>
    </div>
  );
}
