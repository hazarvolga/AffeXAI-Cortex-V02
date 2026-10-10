'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, PlusCircle, FileUp, Filter, Folder, Database, BarChart3, Trash2, ChevronDown, X, MoreHorizontal, Edit, CheckCircle, XCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import subscribersService, { Subscriber } from '@/lib/api/subscribersService';
import segmentsService, { Segment } from '@/lib/api/segmentsService';
import groupsService, { Group } from '@/lib/api/groupsService';
import CustomFieldsManager from '@/components/admin/email-marketing/custom-fields-manager';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';
import { NeuralBadge } from '@/components/email/NeuralBadge';
import { cn } from '@/lib/utils';

// Define sorting types
type SortField = 'email' | 'sent' | 'opens' | 'clicks' | 'subscribedAt' | 'location' | 'mailerCheckResult';
type SortDirection = 'asc' | 'desc';

export default function SubscribersManagementPage() {
  const params = useParams();
  const tenant = params?.tenant as string || 'default';
  const [activeTab, setActiveTab] = useState('all');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('subscribedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modal states
  const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false);
  const [isRemoveFromGroupModalOpen, setIsRemoveFromGroupModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);

  // Form states
  const [addGroupName, setAddGroupName] = useState('');
  const [removeGroupName, setRemoveGroupName] = useState('');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // Sort subscribers based on current sort settings
  const sortedSubscribers = useMemo(() => {
    return [...subscribers].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'sent':
          aValue = a.sent || 0;
          bValue = b.sent || 0;
          break;
        case 'opens':
          aValue = a.opens || 0;
          bValue = b.opens || 0;
          break;
        case 'clicks':
          aValue = a.clicks || 0;
          bValue = b.clicks || 0;
          break;
        case 'subscribedAt':
          aValue = new Date(a.subscribedAt).getTime();
          bValue = new Date(b.subscribedAt).getTime();
          break;
        case 'location':
          aValue = (a.location || '').toLowerCase();
          bValue = (b.location || '').toLowerCase();
          break;
        case 'mailerCheckResult':
          aValue = (a.mailerCheckResult || '').toLowerCase();
          bValue = (b.mailerCheckResult || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [subscribers, sortField, sortDirection]);

  // Toggle sort direction when clicking on the same column
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort indicator for table headers
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Get icon for mailerCheckResult status
  const getMailerCheckIcon = (result: string | undefined) => {
    if (!result) return <HelpCircle className="h-4 w-4 text-muted-foreground" />;

    switch (result.toLowerCase()) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'risky':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data from API...');

        // Fetch data separately to better identify errors
        const subscribersData = await subscribersService.getAll();
        console.log('Subscribers data fetched:', subscribersData);

        const segmentsData = await segmentsService.getAll();
        console.log('Segments data fetched:', segmentsData);

        const groupsData = await groupsService.getAll();
        console.log('Groups data fetched:', groupsData);

        setSubscribers(subscribersData);
        setSegments(segmentsData);
        setGroups(groupsData);
        // Update availableGroups with real data
        setAvailableGroups(groupsData.map((group: Group) => group.name));
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        // Log more detailed error information
        if (err instanceof Error) {
          console.error('Error name:', err.name);
          console.error('Error message:', err.message);
          console.error('Error stack:', err.stack);
        }
        setError('Veri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSubscriberSelection = (id: string) => {
    setSelectedSubscribers(prev =>
      prev.includes(id)
        ? prev.filter(subscriberId => subscriberId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSubscribers.length === sortedSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(sortedSubscribers.map(s => s.id));
    }
  };

  const handleAction = (action: string) => {
    if (selectedSubscribers.length === 0) return;

    switch (action) {
      case 'add-to-group':
        setIsAddToGroupModalOpen(true);
        break;
      case 'remove-from-group':
        setIsRemoveFromGroupModalOpen(true);
        break;
      case 'delete':
        setIsDeleteConfirmModalOpen(true);
        break;
      case 'unsubscribe':
        handleUnsubscribe();
        break;
      case 'export-csv':
        exportToCSV(selectedSubscribers);
        break;
      case 'export-excel':
        exportToCSV(selectedSubscribers, true);
        break;
      default:
        console.log(`Action ${action} not implemented yet`);
    }
  };

  const handleAddToGroup = async () => {
    if (!addGroupName || selectedSubscribers.length === 0) return;

    try {
      // Update each selected subscriber
      await Promise.all(
        selectedSubscribers.map(id => {
          const subscriber = sortedSubscribers.find(s => s.id === id);
          if (subscriber) {
            const updatedGroups = [...subscriber.groups, addGroupName];
            return subscribersService.update(id, { groups: updatedGroups });
          }
          return Promise.resolve();
        })
      );

      // Refresh the subscriber list
      const data = await subscribersService.getAll();
      setSubscribers(data);

      // Reset form and close modal
      setAddGroupName('');
      setIsAddToGroupModalOpen(false);
      setSelectedSubscribers([]);
    } catch (err) {
      console.error('Error adding subscribers to group:', err);
      setError('Gruba abone eklenirken bir hata oluştu.');
    }
  };

  const handleRemoveFromGroup = async () => {
    if (!removeGroupName || selectedSubscribers.length === 0) return;

    try {
      // Update each selected subscriber
      await Promise.all(
        selectedSubscribers.map(id => {
          const subscriber = sortedSubscribers.find(s => s.id === id);
          if (subscriber) {
            const updatedGroups = subscriber.groups.filter((group: string) => group !== removeGroupName);
            return subscribersService.update(id, { groups: updatedGroups });
          }
          return Promise.resolve();
        })
      );

      // Refresh the subscriber list
      const data = await subscribersService.getAll();
      setSubscribers(data);

      // Reset form and close modal
      setRemoveGroupName('');
      setIsRemoveFromGroupModalOpen(false);
      setSelectedSubscribers([]);
    } catch (err) {
      console.error('Error removing subscribers from group:', err);
      setError('Gruptan abone çıkarılırken bir hata oluştu.');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      // Update each selected subscriber
      await Promise.all(
        selectedSubscribers.map(id =>
          subscribersService.update(id, { status: 'unsubscribed' })
        )
      );

      // Update local state
      setSubscribers(prev =>
        prev.map(s =>
          selectedSubscribers.includes(s.id)
            ? { ...s, status: 'unsubscribed' }
            : s
        )
      );

      setSelectedSubscribers([]);
    } catch (err) {
      console.error('Error unsubscribing subscribers:', err);
      setError('Abonelerin aboneliği iptal edilirken bir hata oluştu.');
    }
  };

  const handleDelete = async () => {
    try {
      // Delete selected subscribers
      await Promise.all(
        selectedSubscribers.map(id => subscribersService.delete(id))
      );

      // Refresh the list
      setSubscribers(prev => prev.filter(s => !selectedSubscribers.includes(s.id)));
      setSelectedSubscribers([]);
      setIsDeleteConfirmModalOpen(false);
    } catch (err) {
      console.error('Error deleting subscribers:', err);
      setError('Aboneler silinirken bir hata oluştu.');
    }
  };

  const exportToCSV = (ids: string[], excelFormat = false) => {
    const selectedData = sortedSubscribers.filter(s => ids.includes(s.id));
    const headers = ['Email', 'Status', 'Subscribed At', 'Last Updated'];
    const rows = selectedData.map(s => [
      s.email,
      s.status,
      s.subscribedAt,
      s.lastUpdated
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', excelFormat ? 'subscribers.xlsx' : 'subscribers.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'subscribed':
        return (
          <Badge variant="outline" className="rounded-none border-[#9df425]/20 bg-[#9df425]/5 text-[#9df425] text-[8px] uppercase tracking-widest px-2 py-0.5">
            RESONATING
          </Badge>
        );
      case 'unsubscribed':
        return (
          <Badge variant="outline" className="rounded-none border-red-500/20 bg-red-500/5 text-red-500 text-[8px] uppercase tracking-widest px-2 py-0.5">
            DISCONNECTED
          </Badge>
        );
      case 'cleaned':
        return (
          <Badge variant="outline" className="rounded-none border-white/10 text-white/20 text-[8px] uppercase tracking-widest px-2 py-0.5">
            PURGED
          </Badge>
        );
      default:
        return <Badge variant="outline" className="rounded-none border-white/10 text-[8px] uppercase tracking-widest px-2">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <BccEditorialWrapper
      headerTitle="Identity Registry"
      headerBadge="Database"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "TOTAL_NODES", value: subscribers.length.toString() },
        { label: "RESONANCE_ACTIVE", value: subscribers.filter(s => s.status === 'subscribed').length.toString() },
        { label: "REGISTRY_HEALTH", value: "99.8%" },
        { label: "BOUNCE_LATENCY", value: "LOW" }
      ]}
    >
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Global Registry Actions */}
        <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Registry_Operations</h2>
            <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold">Node Acquisition and Manual Injection</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild className="rounded-none border-white/5 bg-white/5 hover:border-[#ff8c00]/40 text-[9px] font-bold uppercase tracking-[0.2em] h-10 px-6 transition-all">
              <Link href={`/${tenant}/admin/email/subscribers/import`}>
                <FileUp className="mr-2 h-4 w-4 opacity-40" /> IMPORT_REGISTRY
              </Link>
            </Button>
            <Button asChild className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold text-[9px] tracking-[0.2em] uppercase px-8 h-10 transition-all">
              <Link href={`/${tenant}/admin/email/subscribers/new`}>
                <PlusCircle className="mr-2 h-4 w-4" /> INJECT_NODE
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="bg-[#0a0a0a] border border-white/5 p-1 rounded-none h-auto flex flex-wrap">
            {[
              { id: 'all', label: 'IDENTITY_POOL', icon: Users },
              { id: 'segments', label: 'DYNAMIC_NEURAL', icon: Filter },
              { id: 'groups', label: 'STATIC_CLUSTERS', icon: Folder },
              { id: 'fields', label: 'METADATA_EXT', icon: Database },
              { id: 'stats', label: 'TELEMETRY_DENSE', icon: BarChart3 },
              { id: 'cleanup', label: 'PURGE_PROTOCOL', icon: Trash2 },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-none border-none py-3 px-6 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 data-[state=active]:text-[#ff8c00] data-[state=active]:bg-[#ff8c00]/5 hover:text-white/60 transition-all"
              >
                <tab.icon className="h-3.5 w-3.5 mr-3 opacity-40" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0 outline-none">
            <BccHudTile
              title="REGISTRY_LIVE_FEED"
              subtitle={`Total identity nodes synchronized: ${sortedSubscribers.length}`}
              icon="memory"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-none border-white/10 bg-white/5 text-[9px] uppercase tracking-widest h-8 font-bold" disabled={selectedSubscribers.length === 0}>
                        BULK_OPERATIONS ({selectedSubscribers.length})
                        <ChevronDown className="ml-2 h-3 w-3 opacity-40" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase text-[9px] min-w-[200px]">
                      <DropdownMenuItem onSelect={() => handleAction('add-to-group')} className="hover:bg-white/5 cursor-pointer">
                        <Folder className="mr-3 h-3.5 w-3.5 opacity-40" /> MAP_TO_CLUSTER
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleAction('remove-from-group')} className="hover:bg-white/5 cursor-pointer">
                        <X className="mr-3 h-3.5 w-3.5 opacity-40" /> UNMAP_FROM_CLUSTER
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem onSelect={() => handleAction('unsubscribe')} className="hover:bg-white/5 cursor-pointer">
                        <Users className="mr-3 h-3.5 w-3.5 opacity-40" /> CUT_RESONANCE
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleAction('delete')} className="text-red-500 hover:bg-red-500/10 cursor-pointer">
                        <Trash2 className="mr-3 h-3.5 w-3.5" /> ERASE_IDENTITY
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem onSelect={() => handleAction('export-csv')} className="hover:bg-white/5 cursor-pointer">
                        <FileUp className="mr-3 h-3.5 w-3.5 opacity-40" /> EXPORT_RAW_CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="h-4 w-px bg-white/10" />
                  <div className="text-[9px] text-white/20 uppercase tracking-widest font-mono">
                    SORT_FIELD: <span className="text-[#ff8c00]">{sortField.toUpperCase()}</span> // DIR: <span className="text-[#ff8c00]">{sortDirection.toUpperCase()}</span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ff8c00]">Accessing Node Registry...</div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="text-[10px] font-mono text-red-500 uppercase tracking-widest">{error}</div>
                    <Button variant="outline" className="rounded-none border-white/10 text-[9px] uppercase tracking-widest" onClick={() => window.location.reload()}>
                      RETRY_SYNC
                    </Button>
                  </div>
                ) : sortedSubscribers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
                    <Users className="h-10 w-10 text-white/10" />
                    <div className="text-center space-y-2">
                      <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Zero active nodes</h3>
                      <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                        Registry is currently empty. Initialize a sync or inject nodes manually.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-white/5 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="w-[50px] px-6">
                            <Checkbox
                              checked={selectedSubscribers.length === sortedSubscribers.length && sortedSubscribers.length > 0}
                              onCheckedChange={toggleSelectAll}
                              className="border-white/20 data-[state=checked]:bg-[#ff8c00] data-[state=checked]:border-[#ff8c00]"
                            />
                          </TableHead>
                          <TableHead className="cursor-pointer py-4 text-white/40 uppercase tracking-[0.2em] text-[9px]" onClick={() => handleSort('email')}>
                            Identity{getSortIndicator('email')}
                          </TableHead>
                          <TableHead className="cursor-pointer py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center" onClick={() => handleSort('mailerCheckResult')}>
                            Verify{getSortIndicator('mailerCheckResult')}
                          </TableHead>
                          <TableHead className="cursor-pointer py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center">
                            Neural_Status
                          </TableHead>
                          <TableHead className="cursor-pointer py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center">
                            Res_Status
                          </TableHead>
                          <TableHead className="cursor-pointer py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center" onClick={() => handleSort('sent')}>
                            Pulses{getSortIndicator('sent')}
                          </TableHead>
                          <TableHead className="cursor-pointer py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center" onClick={() => handleSort('opens')}>
                            Open_Res{getSortIndicator('opens')}
                          </TableHead>
                          <TableHead className="cursor-pointer py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center" onClick={() => handleSort('clicks')}>
                            Click_Res{getSortIndicator('clicks')}
                          </TableHead>
                          <TableHead className="cursor-pointer py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-right px-6" onClick={() => handleSort('subscribedAt')}>
                            Epoch_Sync{getSortIndicator('subscribedAt')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedSubscribers.map((subscriber) => (
                          <TableRow key={subscriber.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group text-[11px]">
                            <TableCell className="px-6">
                              <Checkbox
                                checked={selectedSubscribers.includes(subscriber.id)}
                                onCheckedChange={() => toggleSubscriberSelection(subscriber.id)}
                                className="border-white/20 data-[state=checked]:bg-[#ff8c00] data-[state=checked]:border-[#ff8c00]"
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <Link
                                href={`/${tenant}/admin/email/subscribers/${subscriber.id}/detail`}
                                className="text-white hover:text-[#ff8c00] transition-colors font-bold uppercase tracking-tight"
                              >
                                {subscriber.email}
                              </Link>
                              <div className="text-[8px] text-white/20 font-mono mt-0.5 uppercase">NODE_ID: {subscriber.id.split('-')[0]}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                {getMailerCheckIcon(subscriber.mailerCheckResult || undefined)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-1">
                                {subscriber.customFields?.neuralResonance !== undefined && (
                                  <NeuralBadge type="resonance" score={subscriber.customFields.neuralResonance} compact />
                                )}
                                {subscriber.customFields?.neuralSentiment !== undefined && (
                                  <NeuralBadge type="sentiment" score={subscriber.customFields.neuralSentiment} compact />
                                )}
                                {!subscriber.customFields?.neuralResonance && !subscriber.customFields?.neuralSentiment && (
                                  <span className="text-[9px] text-white/20">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono">
                              {getStatusBadge(subscriber.status)}
                            </TableCell>
                            <TableCell className="text-center font-mono text-white/60">{subscriber.sent || 0}</TableCell>
                            <TableCell className="text-center font-mono">
                              <span className={cn(
                                "px-1.5 py-0.5 border border-white/5",
                                (subscriber.opens || 0) > 1 ? "text-[#9df425] bg-[#9df425]/5 border-[#9df425]/10" : "text-white/40 bg-white/5"
                              )}>
                                {subscriber.opens || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-mono">
                              <span className="text-white/40 px-1.5 py-0.5 border border-white/5 bg-white/5">
                                {subscriber.clicks || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-right px-6 text-[10px] font-mono text-white/40 tabular-nums uppercase">
                              {new Date(subscriber.subscribedAt).toLocaleDateString('en-GB')}
                              <div className="text-[8px] opacity-40 mt-0.5">{subscriber.location || 'GLOBAL'}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </BccHudTile>
          </TabsContent>

          <TabsContent value="segments" className="mt-0 outline-none">
            <BccHudTile
              title="NEURAL_SEGMENTATION"
              subtitle="Dynamic clustering based on behavioral transmission data"
              icon="tune"
              headerAction={
                <Button asChild className="rounded-none bg-[#ff8c00] text-black hover:bg-[#e67e00] font-bold text-[8px] tracking-[0.2em] uppercase h-7 px-4">
                  <Link href={`/${tenant}/admin/email/segments`}>
                    <PlusCircle className="mr-2 h-3.5 w-3.5" /> DEFINE_PATTERN
                  </Link>
                </Button>
              }
            >
              {segments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
                  <Filter className="h-10 w-10 text-white/10" />
                  <div className="text-center space-y-2">
                    <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Zero active filters</h3>
                    <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                      Define your first neural segment to partition your identity registry.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-white/5 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-white/5">
                        <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] px-6">Segment_Identity</TableHead>
                        <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center">Node_Density</TableHead>
                        <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center">Open_Res</TableHead>
                        <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center">Click_Res</TableHead>
                        <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-right px-6">Epoch_Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {segments.map((segment) => (
                        <TableRow key={segment.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group text-[11px]">
                          <TableCell className="py-4 px-6 font-medium">
                            <Link href={`/${tenant}/admin/email/segments/${segment.id}`} className="text-white hover:text-[#ff8c00] transition-colors font-bold uppercase tracking-tight">
                              {segment.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center font-mono text-white/60">
                            {segment.subscriberCount.toLocaleString('en-GB')}
                          </TableCell>
                          <TableCell className="text-center font-mono text-[#9df425]">
                            {typeof segment.openRate === 'number' ? segment.openRate.toFixed(2) : '0.00'}%
                          </TableCell>
                          <TableCell className="text-center font-mono text-white/40">
                            {typeof segment.clickRate === 'number' ? segment.clickRate.toFixed(2) : '0.00'}%
                          </TableCell>
                          <TableCell className="text-right px-6 text-[10px] font-mono text-white/40 tabular-nums uppercase">
                            {new Date(segment.createdAt).toLocaleDateString('en-GB')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </BccHudTile>
          </TabsContent>

          <TabsContent value="groups" className="mt-0 outline-none">
            <BccHudTile
              title="STATIC_CLUSTER_LOG"
              subtitle="Manual identity grouping for focused transmission"
              icon="hub"
              headerAction={
                <Button asChild className="rounded-none bg-[#ff8c00] text-black hover:bg-[#e67e00] font-bold text-[8px] tracking-[0.2em] uppercase h-7 px-4">
                  <Link href={`/${tenant}/admin/email/groups`}>
                    <PlusCircle className="mr-2 h-3.5 w-3.5" /> CREATE_CLUSTER
                  </Link>
                </Button>
              }
            >
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
                  <Folder className="h-10 w-10 text-white/10" />
                  <div className="text-center space-y-2">
                    <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Zero active clusters</h3>
                    <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                      Create clusters to organize your identity reservoir manually.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-white/5 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-white/5">
                        <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] px-6">Cluster_Alias</TableHead>
                        <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px]">Functional_Description</TableHead>
                        <TableHead className="py-4 text-white/40 uppercase tracking-[0.2em] text-[9px] text-center px-6">Node_Density</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group) => (
                        <TableRow key={group.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group text-[11px]">
                          <TableCell className="py-4 px-6 font-medium">
                            <Link href={`/${tenant}/admin/email/groups/${group.id}`} className="text-white hover:text-[#ff8c00] transition-colors font-bold uppercase tracking-tight">
                              {group.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-white/40 py-4 uppercase tracking-widest text-[9px] max-w-sm truncate text-pretty">
                            {group.description}
                          </TableCell>
                          <TableCell className="text-center px-6">
                            <Badge variant="outline" className="rounded-none border-[#9df425]/20 bg-[#9df425]/5 text-[#9df425] text-[10px] tabular-nums flex items-center gap-1.5 mx-auto w-fit px-3 py-1">
                              <Users className="h-3 w-3 opacity-60" />
                              {group.subscriberCount}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </BccHudTile>
          </TabsContent>

          <TabsContent value="fields" className="mt-0 outline-none">
            <BccHudTile
              title="METADATA_EXTENSIONS"
              subtitle="Configure custom identity attributes and neural mapping"
              icon="storage"
            >
              <div className="p-4 bg-white/[0.01] border border-white/5">
                <CustomFieldsManager />
              </div>
            </BccHudTile>
          </TabsContent>

          <TabsContent value="stats" className="mt-0 outline-none">
            <BccHudTile
              title="IDENTITY_TELEMETRY"
              subtitle="High-fidelity analytics on registry growth and resonance"
              icon="query_stats"
            >
              <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
                <BarChart3 className="h-10 w-10 text-white/10" />
                <div className="text-center space-y-2">
                  <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Telemetry_Sync_Pending</h3>
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                    Dense statistics are currently being calculated in the background cluster.
                  </p>
                </div>
              </div>
            </BccHudTile>
          </TabsContent>

          <TabsContent value="cleanup" className="mt-0 outline-none">
            <BccHudTile
              title="PURGE_PROTOCOL"
              subtitle="Automated identifies and erases inactive or invalid nodes"
              icon="auto_delete"
            >
              <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/5 bg-white/[0.01]">
                <Trash2 className="h-10 w-10 text-white/10" />
                <div className="text-center space-y-2">
                  <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60 font-bold">Clean_Cycle_Standby</h3>
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">
                    Initiate protocol to optimize registry integrity and transmission health.
                  </p>
                </div>
                <Button className="rounded-none border border-red-500/40 bg-red-500/5 text-red-500 font-bold text-[9px] tracking-[0.2em] uppercase px-6">
                  ACTIVATE_PURGE_SEQUENCE
                </Button>
              </div>
            </BccHudTile>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add to Group Modal */}
      <Dialog open={isAddToGroupModalOpen} onOpenChange={setIsAddToGroupModalOpen}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-xs tracking-[0.2em] font-bold">MAP_TO_CLUSTER</DialogTitle>
            <DialogDescription className="text-[9px] text-white/40 tracking-widest mt-2">
              Inject <span className="text-[#ff8c00] font-bold">{selectedSubscribers.length}</span> nodes into target identity cluster.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="group-name" className="text-[9px] tracking-widest text-white/40">CLUSTER_ID / ALIAS</Label>
              <Input
                id="group-name"
                value={addGroupName}
                onChange={(e) => setAddGroupName(e.target.value)}
                placeholder="ENTER CLUSTER NAME"
                className="rounded-none bg-white/5 border-white/10 text-[10px]"
              />
            </div>
            {availableGroups.length > 0 && (
              <div className="space-y-3">
                <p className="text-[8px] text-white/20 tracking-widest">DETECTED_CLUSTERS:</p>
                <div className="flex flex-wrap gap-2">
                  {availableGroups.map((group) => (
                    <Button
                      key={group}
                      variant="outline"
                      size="sm"
                      className="h-6 rounded-none border-white/5 bg-white/[0.02] text-[8px] text-white/40 hover:text-white transition-all"
                      onClick={() => setAddGroupName(group)}
                    >
                      {group.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-white/5 pt-4">
            <Button variant="ghost" onClick={() => setIsAddToGroupModalOpen(false)} className="rounded-none text-[9px] uppercase tracking-widest h-9 border-white/5 hover:bg-white/5">
              ABORT
            </Button>
            <Button onClick={handleAddToGroup} disabled={!addGroupName} className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] font-bold text-[9px] tracking-[0.2em] uppercase px-6 h-9 transition-all">
              INITIALIZE_MAPPING
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove from Group Modal */}
      <Dialog open={isRemoveFromGroupModalOpen} onOpenChange={setIsRemoveFromGroupModalOpen}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-xs tracking-[0.2em] font-bold">UNMAP_FROM_CLUSTER</DialogTitle>
            <DialogDescription className="text-[9px] text-white/40 tracking-widest mt-2">
              Extract <span className="text-[#ff8c00] font-bold">{selectedSubscribers.length}</span> nodes from selected transmission cluster.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-2">
            <Label htmlFor="remove-group-name" className="text-[9px] tracking-widest text-white/40">CLUSTER_PROTOCOL</Label>
            <Select onValueChange={setRemoveGroupName} value={removeGroupName}>
              <SelectTrigger className="rounded-none bg-white/5 border-white/10 text-[10px] h-10">
                <SelectValue placeholder="SELECT TARGET CLUSTER" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-none text-white font-mono uppercase text-[9px]">
                {availableGroups.map((group) => (
                  <SelectItem key={group} value={group} className="focus:bg-white/5 hover:bg-white/5">
                    {group.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="border-t border-white/5 pt-4">
            <Button variant="ghost" onClick={() => setIsRemoveFromGroupModalOpen(false)} className="rounded-none text-[9px] uppercase tracking-widest h-9 border-white/5 hover:bg-white/5">
              ABORT
            </Button>
            <Button
              onClick={handleRemoveFromGroup}
              disabled={!removeGroupName}
              className="rounded-none bg-red-600 text-white hover:bg-red-700 font-bold text-[9px] tracking-[0.2em] uppercase px-6 h-9 transition-all"
            >
              EXECUTE_UNMAPPING
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmModalOpen} onOpenChange={setIsDeleteConfirmModalOpen}>
        <DialogContent className="max-w-md bg-[#0f0f0f] border-white/10 rounded-none text-white font-mono uppercase">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-xs tracking-[0.2em] font-bold text-red-500">INITIATE_ERASE_SEQUENCE?</DialogTitle>
            <DialogDescription className="text-[9px] text-white/40 tracking-widest mt-2 uppercase">
              Warning: <span className="text-red-400 font-bold">{selectedSubscribers.length}</span> identities will be permanently purged from the registry.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="max-h-[160px] overflow-y-auto border border-white/5 bg-white/[0.01] p-3 scrollbar-thin scrollbar-thumb-white/10">
              <div className="space-y-1 text-[9px] text-white/20 uppercase tracking-widest">
                {sortedSubscribers
                  .filter(s => selectedSubscribers.includes(s.id))
                  .map(s => (
                    <div key={s.id} className="truncate">
                      NODE_ENTRY: [{s.email}]
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/5 pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmModalOpen(false)} className="rounded-none text-[9px] uppercase tracking-widest h-9 border-white/5 hover:bg-white/5">
              ABORT
            </Button>
            <Button onClick={handleDelete} className="rounded-none bg-red-600 text-white hover:bg-red-700 font-bold text-[9px] tracking-[0.2em] uppercase px-6 h-9 transition-all">
              CONFIRM_PURGE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BccEditorialWrapper>
  );
}