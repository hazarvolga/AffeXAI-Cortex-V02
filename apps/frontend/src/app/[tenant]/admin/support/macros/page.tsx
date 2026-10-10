'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Edit,
  Trash2,
  Play,
  Loader2,
  Plus,
  Wand2,
  Zap,
  TrendingUp,
  History
} from 'lucide-react';
import Link from 'next/link';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';

interface MacroAction {
  type: 'update_status' | 'assign' | 'set_priority' | 'add_category' | 'add_tags' | 'add_note' | 'send_email';
  value: string;
  label?: string;
}

interface Macro {
  id: string;
  name: string;
  description: string;
  actions: MacroAction[];
  usageCount: number;
  isPublic: boolean;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function MacrosAdminPage() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [filteredMacros, setFilteredMacros] = useState<Macro[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [macroToDelete, setMacroToDelete] = useState<Macro | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMacros();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = macros.filter(
        (macro) =>
          macro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          macro.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMacros(filtered);
    } else {
      setFilteredMacros(macros);
    }
  }, [searchQuery, macros]);

  const fetchMacros = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/macros');

      if (response.ok) {
        const data = await response.json();
        setMacros(data || []);
        setFilteredMacros(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch macros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!macroToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/macros/${macroToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMacros();
        setDeleteDialogOpen(false);
        setMacroToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete macro:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getActionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      update_status: 'Durum Değiştir',
      assign: 'Ata',
      set_priority: 'Öncelik Ayarla',
      add_category: 'Kategori Ekle',
      add_tags: 'Etiket Ekle',
      add_note: 'Not Ekle',
      send_email: 'Email Gönder',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-[#9df425] font-mono text-xs uppercase tracking-widest">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Initializing_Automation_Engine...
      </div>
    );
  }

  // Stats
  const totalMacros = macros.length;
  const publicMacros = macros.filter(m => m.isPublic).length;
  const totalUsage = macros.reduce((sum, m) => sum + m.usageCount, 0);

  return (
    <BccEditorialWrapper
      headerTitle="MAKRO YÖNETİMİ"
      headerSubtitle="Toplu işlem şablonları ve operasyonel otomasyon dizinleri."
      headerBadge="AUTOMATION"
      telemetryData={[
        { label: "ENGINE_STATE", value: "ACTIVE" },
        { label: "MACRO_NODES", value: totalMacros.toString() },
        { label: "PUBLIC_SCRIPTS", value: publicMacros.toString() },
        { label: "EXEC_COUNT", value: totalUsage.toLocaleString() }
      ]}
    >
      <div className="space-y-8">
        {/* HUD Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BccHudTile title="TOTAL_MACROS" subtitle="Automation Sequences" icon="wizard">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">{totalMacros}</div>
            <div className="text-[10px] uppercase tracking-widest text-[#9df425] mt-1">
              SCRIPTS_LOADED
            </div>
          </BccHudTile>

          <BccHudTile title="PUBLIC_ACCESS" subtitle="Shared Sequences" icon="zap">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">{publicMacros}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
              READY_TO_DEPLOY
            </div>
          </BccHudTile>

          <BccHudTile title="USAGE_LOGS" subtitle="Deployment Count" icon="trending_up">
            <div className="text-3xl font-bold font-mono tracking-tighter text-[#9df425]">{totalUsage.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-widest text-[#9df425]/60 mt-1">
              SYSTEM_EFFICIENCY
            </div>
          </BccHudTile>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-md">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="text"
              placeholder="SEARCH_SEQUENCES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white font-mono text-xs h-10 placeholder:text-white/20 focus-visible:ring-[#9df425]/50"
            />
          </div>
        </div>

        {/* Registry Table */}
        <div className="border border-white/5 bg-white/[0.02] rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10">SEQUENCE_NAME</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10">ACTIONS</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10">OPERATOR</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10 text-right">METRICS</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10 text-right">COMMANDS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMacros.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={5} className="text-center py-12">
                    <p className="text-xs font-mono uppercase tracking-widest text-white/20">NO_SEQUENCES_FOUND</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMacros.map((macro) => (
                  <TableRow key={macro.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-start gap-3">
                        <Wand2 className="h-4 w-4 mt-0.5 text-purple-400 opacity-60" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm text-white font-medium group-hover:text-[#9df425] transition-colors">
                              {macro.name}
                            </p>
                            {macro.isPublic && (
                              <Badge variant="outline" className="rounded-none border-blue-500/20 text-blue-400 text-[8px] uppercase tracking-widest px-1 h-3.5 bg-blue-500/5">
                                GLOBAL
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-white/40 mt-1 line-clamp-1 font-mono">
                            {macro.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {macro.actions.slice(0, 3).map((action, idx) => (
                          <Badge key={idx} variant="outline" className="rounded-none border-white/10 text-white/50 text-[9px] uppercase font-mono px-1.5 py-0">
                            {getActionTypeLabel(action.type)}
                          </Badge>
                        ))}
                        {macro.actions.length > 3 && (
                          <Badge variant="outline" className="rounded-none border-white/10 text-white/30 text-[9px] uppercase font-mono px-1">
                            +{macro.actions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-white/60 uppercase">
                        {macro.createdBy.firstName} {macro.createdBy.lastName?.charAt(0)}.
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 font-mono text-[10px] text-white/60">
                        <Play className="h-3 w-3 opacity-40 text-[#9df425]" />
                        {macro.usageCount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/support/macros/${macro.id}/edit`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 hover:text-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
                          onClick={() => {
                            setMacroToDelete(macro);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-mono uppercase tracking-tight flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              WIPE_SEQUENCE_CONFIRM
            </DialogTitle>
            <DialogDescription className="text-white/60 font-mono text-xs">
              This will permanently remove the automation sequence from the registry. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {macroToDelete && (
            <div className="py-4 px-4 bg-white/5 border border-white/10 rounded-none my-2">
              <p className="font-bold text-[#9df425] font-mono text-sm">{macroToDelete.name}</p>
              <p className="text-xs text-white/40 mt-1 font-mono">{macroToDelete.description}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 text-[10px] text-white/60 font-mono italic">
                <History className="h-3 w-3" />
                Previous Deployments: {macroToDelete.usageCount}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-white/10 hover:bg-white/5 hover:text-white text-white/60 font-mono text-xs uppercase tracking-wider rounded-none h-8"
            >
              Abort
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white font-mono text-xs uppercase tracking-wider rounded-none h-8"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Purging...
                </>
              ) : (
                'Purge_Sequence'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BccEditorialWrapper>
  );
}
