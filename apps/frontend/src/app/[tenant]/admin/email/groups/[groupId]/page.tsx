'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { subscribers, groups } from '@/lib/newsletter-data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder, Users, Layers, Shield, Database, Activity } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef, use } from "react";
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const unwrappedParams = use(params);
  const { groupId } = unwrappedParams;
  const routeParams = useParams();
  const tenant = routeParams?.tenant as string || 'default';

  const router = useRouter();
  const [group, setGroup] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedGroup = useRef(false);

  useEffect(() => {
    if (hasFetchedGroup.current) return;
    hasFetchedGroup.current = true;

    const fetchGroup = async () => {
      try {
        setLoading(true);
        const groupData = groups.find(s => s.id === groupId);
        if (!groupData) {
          notFound();
          return;
        }
        setGroup(groupData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching group:', err);
        setError('CLUSTER_SYNC_FAILURE');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  if (loading) {
    return (
      <BccEditorialWrapper
        headerTitle="Cluster_Probe"
        headerBadge="Probe"
        moduleNav={<EmailModuleNav />}
        telemetryData={[
          { label: "SYNC_STATE", value: "INITIALIZING" },
          { label: "MAPPING_SEARCH", value: "PENDING" },
        ]}
      >
        <div className="flex items-center justify-center py-32">
          <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] animate-pulse">Probing Nodal Cluster...</div>
        </div>
      </BccEditorialWrapper>
    );
  }

  if (error || !group) {
    return (
      <BccEditorialWrapper
        headerTitle="Probe_Error"
        headerBadge="Critical"
        moduleNav={<EmailModuleNav />}
      >
        <div className="text-center text-red-500/60 font-mono py-32 uppercase tracking-widest text-[10px]">{error || 'CLUSTER_NOT_FOUND'}</div>
      </BccEditorialWrapper>
    );
  }

  const groupSubscribers = subscribers.filter(sub => sub.groups.includes(group.id));

  return (
    <BccEditorialWrapper
      headerTitle={group.name.toUpperCase().replace(/\s+/g, '_')}
      headerBadge="Cluster"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "CLUSTER_DENSITY", value: groupSubscribers.length.toString() },
        { label: "MAPPING_TYPE", value: "STATIC" },
        { label: "NODE_INTEGRITY", value: "VERIFIED" },
        { label: "PROBE_STATE", value: "ACTIVE" }
      ]}
    >
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Navigation & Info */}
        <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-none border-white/10 bg-transparent text-white/40 hover:bg-white/5 hover:text-white transition-all h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
              <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Cluster_Metadata</h2>
              <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold">{group.description || 'Organizational Profile Undefined'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-none border-white/10 text-white/60 hover:bg-white/5 text-[9px] tracking-[0.2em] uppercase h-10 px-6">
              REFRESH_MAPPING
            </Button>
            <Button className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] text-[9px] tracking-[0.2em] uppercase h-10 px-6 font-bold shadow-lg shadow-[#9df425]/10">
              PROBE_LINK
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscriber List Details */}
          <div className="lg:col-span-2">
            <BccHudTile title="MAPPED_NODES" subtitle="Subscribers assigned to this static cluster" icon="folder">
              <div className="overflow-hidden border border-white/5 bg-white/[0.01]">
                <Table>
                  <TableHeader className="bg-white/[0.02] border-b border-white/5">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] h-12 px-6">SUBSCRIBER_ID</TableHead>
                      <TableHead className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] h-12 px-6">MAPPING_TIMESTAMP</TableHead>
                      <TableHead className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] h-12 px-6 text-right">NODE_STATE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupSubscribers.length > 0 ? groupSubscribers.map(sub => (
                      <TableRow key={sub.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                        <TableCell className="py-4 px-6">
                          <span className="text-[11px] font-bold text-white uppercase tracking-widest">{sub.email}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                            {new Date(sub.subscribedAt).toISOString().split('T')[0].replace(/-/g, '.')}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <Badge className={`rounded-none px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest border-none ${sub.status === 'aktif' ? 'bg-[#9df425]/20 text-[#9df425]' : 'bg-white/10 text-white/40'
                            }`}>
                            {sub.status === 'aktif' ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-48 border-none">
                          <div className="flex flex-col items-center gap-3">
                            <Layers className="h-6 w-6 text-white/10 animate-pulse" />
                            <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">Cluster mapping holds zero nodes</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </BccHudTile>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <BccHudTile title="CLUSTER_TELEMETRY" subtitle="Distribution and integrity metrics" icon="layers">
              <div className="space-y-6">
                {[
                  { label: "Index Stability", value: "94%", icon: Shield, color: "text-[#9df425]" },
                  { label: "Relational Mapping", value: "STATIC", icon: Activity, color: "text-blue-500" },
                  { label: "Cluster Volume", value: "OPTIMAL", icon: Database, color: "text-[#ff8c00]" }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 border border-white/5">
                        <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                      </div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-white tracking-widest font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </BccHudTile>

            <BccHudTile title="ORGANIZATIONAL_OPS" subtitle="Cluster management protocols" icon="folder">
              <div className="space-y-3">
                <Button variant="outline" className="w-full rounded-none border-white/5 bg-white/[0.01] text-white/40 hover:bg-white/5 text-[8px] tracking-[0.2em] font-bold uppercase transition-all h-10">
                  ADD_SUBSCRIBERS
                </Button>
                <Button variant="outline" className="w-full rounded-none border-white/5 bg-white/[0.01] text-white/40 hover:bg-white/5 text-[8px] tracking-[0.2em] font-bold uppercase transition-all h-10">
                  EXPORT_CLUSTER
                </Button>
                <Button variant="outline" className="w-full rounded-none border-red-500/20 bg-red-500/5 text-red-500/60 hover:bg-red-500/10 text-[8px] tracking-[0.2em] font-bold uppercase transition-all h-10">
                  PURGE_CLUSTER
                </Button>
              </div>
            </BccHudTile>
          </div>
        </div>
      </div>
    </BccEditorialWrapper>
  );
}
