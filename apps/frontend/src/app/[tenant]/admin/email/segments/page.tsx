'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Filter, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import segmentsService, { CreateSegmentDto, Segment } from '@/lib/api/segmentsService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

import { useParams } from 'next/navigation';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';

export default function SegmentsManagementPage() {
  const params = useParams();
  const tenant = params?.tenant as string || 'default';
  const [isCreating, setIsCreating] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSegment, setNewSegment] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const data = await segmentsService.getAll();
      setSegments(data);
    } catch (err) {
      console.error('Error fetching segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSegment = async () => {
    try {
      await segmentsService.create({
        name: newSegment.name,
        description: newSegment.description,
      });

      setNewSegment({
        name: '',
        description: '',
      });

      fetchSegments();
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating segment:', err);
    }
  };

  const handleDeleteSegment = async (id: string) => {
    try {
      await segmentsService.delete(id);
      fetchSegments();
    } catch (err) {
      console.error('Error deleting segment:', err);
    }
  };

  if (loading) {
    return (
      <BccEditorialWrapper
        headerTitle="Segment_Registry"
        headerBadge="Registry"
        moduleNav={<EmailModuleNav />}
        telemetryData={[
          { label: "INDEX_SYNC", value: "INITIALIZING" },
          { label: "NODE_PROPAGATION", value: "PENDING" },
        ]}
      >
        <div className="flex items-center justify-center py-32">
          <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] animate-pulse">Synchronizing Segment Lattices...</div>
        </div>
      </BccEditorialWrapper>
    );
  }

  return (
    <BccEditorialWrapper
      headerTitle="Segment_Registry"
      headerBadge="Registry"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "TOTAL_SEGMENTS", value: segments.length.toString() },
        { label: "NODE_INTEGRITY", value: "VERIFIED" },
        { label: "REGISTRY_LOCKED", value: "STABLE" },
        { label: "DATA_FEED", value: "LIVE" }
      ]}
    >
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Registry Operations Bar */}
        <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Registry_Controls</h2>
            <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold">Dynamic Node Segmentation</p>
          </div>
          <Button
            disabled={isCreating}
            onClick={() => setIsCreating(true)}
            className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold text-[9px] tracking-[0.2em] uppercase px-8 h-10 transition-all shadow-lg shadow-[#9df425]/10"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> INITIALIZE_NEW_SEGMENT
          </Button>
        </div>

        {isCreating && (
          <BccHudTile title="SEGMENT_INITIALIZATION" icon="hub" subtitle="Define node selection parameters">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="segment-name" className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Lattice Identifier</Label>
                  <Input
                    id="segment-name"
                    value={newSegment.name}
                    onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                    placeholder="ENTER_IDENTIFIER..."
                    className="h-10 rounded-none bg-white/5 border-white/10 text-[10px] font-mono uppercase tracking-widest focus-visible:ring-[#9df425]/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segment-description" className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Protocol Description</Label>
                  <Input
                    id="segment-description"
                    value={newSegment.description}
                    onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                    placeholder="DEFINE_SCOPE..."
                    className="h-10 rounded-none bg-white/5 border-white/10 text-[10px] font-mono uppercase tracking-widest focus-visible:ring-[#9df425]/40"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreating(false)} className="rounded-none border-white/10 text-white/60 hover:bg-white/5 text-[9px] tracking-[0.2em] uppercase h-10 px-8">
                  TERMINATE
                </Button>
                <Button
                  onClick={handleCreateSegment}
                  disabled={!newSegment.name}
                  className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] text-[9px] tracking-[0.2em] uppercase h-10 px-8 font-bold shadow-lg shadow-[#9df425]/10"
                >
                  INITIALIZE_SEGMENT
                </Button>
              </div>
            </div>
          </BccHudTile>
        )}

        <BccHudTile title="ACTIVE_LATTICES" subtitle="Managed subscriber segments and node groups" icon="hub">
          {segments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
              <div className="p-4 bg-white/5 rounded-full border border-white/10">
                <Filter className="h-8 w-8 text-white/20" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-[12px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Registry holds zero nodes</h3>
                <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] max-w-xs mx-auto text-center leading-relaxed">
                  Initialize segment protocols to begin grouping subscribers based on high-fidelity performance metrics.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden border border-white/5 bg-white/[0.01]">
              <Table>
                <TableHeader className="bg-white/[0.02] border-b border-white/5">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] h-12">IDENTIFIER</TableHead>
                    <TableHead className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] h-12">PROTOCOL_SCOPE</TableHead>
                    <TableHead className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] h-12 text-center">NODE_STRENGTH</TableHead>
                    <TableHead className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] h-12 text-right">OPERATIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((segment) => (
                    <TableRow key={segment.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white uppercase tracking-widest">{segment.name}</span>
                          <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter mt-0.5">LATTICE_{segment.id.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[10px] text-white/40 uppercase tracking-wide leading-relaxed">
                          {segment.description || 'PROTOCOL_UNDEFINED'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white/5 border border-white/5 rounded-none">
                          <span className="text-xs font-bold text-white tabular-nums">{segment.subscriberCount.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-none border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">
                              <span className="text-white/40 text-lg">⋮</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase text-[9px]">
                            <DropdownMenuItem className="focus:bg-white/5 group-hover:text-white">
                              <Edit className="mr-2 h-3.5 w-3.5 opacity-40" /> PROBE_LINK
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-500 focus:bg-red-500/5">
                                  <Trash2 className="mr-2 h-3.5 w-3.5 opacity-40" /> PURGE_LATTICE
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-md font-bold tracking-widest">Protocol Override Required</AlertDialogTitle>
                                  <AlertDialogDescription className="text-[10px] text-white/40 tracking-widest leading-relaxed">
                                    Lattice identifier "{segment.name}" will be permanently purged from central registry.
                                    Synchronized nodal steps may lose integrity. Proceed?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="pt-6">
                                  <AlertDialogCancel className="rounded-none border-white/10 bg-transparent text-white/60 hover:bg-white/5 text-[9px] tracking-widest">ABORT</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSegment(segment.id)}
                                    className="rounded-none bg-red-600 text-white hover:bg-red-700 text-[9px] tracking-widest font-bold"
                                  >
                                    PURGE_DATA
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </BccHudTile>
      </div>
    </BccEditorialWrapper>
  );
}
