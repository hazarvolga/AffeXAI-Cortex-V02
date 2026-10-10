'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, PlusCircle, FileUp, Filter, Folder, Database, BarChart3, Trash2, ChevronDown, X, MoreHorizontal, Edit, CheckCircle, XCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
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

// Define sorting types
type SortField = 'email' | 'sent' | 'opens' | 'clicks' | 'subscribedAt' | 'location' | 'mailerCheckResult';
type SortDirection = 'asc' | 'desc';

export default function SubscribersManagementPage() {
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
        const subscribersData = await subscribersService.getAllSubscribers();
        console.log('Subscribers data fetched:', subscribersData);
        
        const segmentsData = await segmentsService.getAllSegments();
        console.log('Segments data fetched:', segmentsData);
        
        const groupsData = await groupsService.getAllGroups();
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
            return subscribersService.updateSubscriber(id, { groups: updatedGroups });
          }
          return Promise.resolve();
        })
      );
      
      // Refresh the subscriber list
      const data = await subscribersService.getAllSubscribers();
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
            return subscribersService.updateSubscriber(id, { groups: updatedGroups });
          }
          return Promise.resolve();
        })
      );
      
      // Refresh the subscriber list
      const data = await subscribersService.getAllSubscribers();
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
          subscribersService.updateSubscriber(id, { status: 'unsubscribed' })
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
        selectedSubscribers.map(id => subscribersService.deleteSubscriber(id))
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

  // Get selected subscriber emails for display
  const getSelectedSubscriberEmails = () => {
    return sortedSubscribers
      .filter(s => selectedSubscribers.includes(s.id))
      .map(s => s.email)
      .join(', ');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/newsletter">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aboneleri Yönet</h1>
          <p className="text-muted-foreground">Bülten abonelerinizi görüntüleyin, düzenleyin ve yönetin.</p>
        </div>
      </div>

      {/* Subscriber Actions - Added at the top */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/newsletter/subscribers/import">
            <FileUp className="mr-2 h-4 w-4" />
            Toplu İçe Aktar
          </Link>
        </Button>
        <Button asChild>
          <Link href="/admin/newsletter/subscribers/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Abone Ekle
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>All subscribers</span>
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Segments</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            <span>Groups</span>
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Fields</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Stats</span>
          </TabsTrigger>
          <TabsTrigger value="cleanup" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            <span>Clean up</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>All Subscribers</CardTitle>
                  <div className="flex items-center gap-4 mt-2">
                    <CardDescription>
                      Showing subscribers {sortedSubscribers.length}
                    </CardDescription>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={selectedSubscribers.length === 0}>
                          Actions
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onSelect={() => handleAction('add-to-group')}>
                          <Folder className="mr-2 h-4 w-4" />
                          Add to group
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('remove-from-group')}>
                          <Folder className="mr-2 h-4 w-4" />
                          Remove from group
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleAction('unsubscribe')}>
                          <Users className="mr-2 h-4 w-4" />
                          Move to unsubscribed
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => handleAction('delete')}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleAction('export-csv')}>
                          <FileUp className="mr-2 h-4 w-4" />
                          Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('export-excel')}>
                          <FileUp className="mr-2 h-4 w-4" />
                          Export CSV for Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {/* Removed duplicate buttons from here since they're now at the top */}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Aboneler yükleniyor...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-sm text-red-500">{error}</p>
                    <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                      Tekrar Dene
                    </Button>
                  </div>
                </div>
              ) : sortedSubscribers.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">Henüz abone yok</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Abonelerinizi burada görüntüleyebileceksiniz.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedSubscribers.length === sortedSubscribers.length && sortedSubscribers.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                          Subscriber{getSortIndicator('email')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('sent')}>
                          Sent{getSortIndicator('sent')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('opens')}>
                          Opens{getSortIndicator('opens')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('clicks')}>
                          Clicks{getSortIndicator('clicks')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('subscribedAt')}>
                          Subscribed{getSortIndicator('subscribedAt')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('location')}>
                          Location{getSortIndicator('location')}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('mailerCheckResult')}>
                          Validation{getSortIndicator('mailerCheckResult')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSubscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSubscribers.includes(subscriber.id)}
                              onCheckedChange={() => toggleSubscriberSelection(subscriber.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <Link 
                              href={`/admin/newsletter/subscribers/${subscriber.id}/detail`} 
                              className="hover:underline"
                            >
                              {subscriber.email}
                            </Link>
                          </TableCell>
                          <TableCell>{subscriber.sent || 0}</TableCell>
                          <TableCell>{subscriber.opens || 0}</TableCell>
                          <TableCell>{subscriber.clicks || 0}</TableCell>
                          <TableCell>
                            {new Date(subscriber.subscribedAt).toLocaleString('tr-TR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{subscriber.location || 'TR'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getMailerCheckIcon(subscriber.mailerCheckResult)}
                              <span className="capitalize">
                                {subscriber.mailerCheckResult || 'Unknown'}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="segments" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Segments</CardTitle>
                  <CardDescription>
                    Abonelerinizi segmentlere ayırarak hedefli kampanyalar oluşturun.
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href="/admin/newsletter/segments">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Segment Oluştur
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {segments.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">Henüz segment yok</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Segmentler oluşturarak abonelerinizi gruplandırın.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Segment Adı</TableHead>
                        <TableHead>Oluşturulma Tarihi</TableHead>
                        <TableHead>Abone Sayısı</TableHead>
                        <TableHead>Açılış Oranı</TableHead>
                        <TableHead>Tıklama Oranı</TableHead>
                        <TableHead><span className="sr-only">Eylemler</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {segments.map((segment) => (
                        <TableRow key={segment.id}>
                          <TableCell className="font-medium">
                            <Link href={`/admin/newsletter/segments/${segment.id}`} className="hover:underline">
                              {segment.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {new Date(segment.createdAt).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>{segment.subscriberCount.toLocaleString('tr-TR')}</TableCell>
                          <TableCell>{segment.openRate.toFixed(2)}%</TableCell>
                          <TableCell>{segment.clickRate.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Menüyü aç</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" /> Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="groups" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Groups</CardTitle>
                  <CardDescription>
                    Abonelerinizi gruplara ayırarak organize edin.
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href="/admin/newsletter/groups">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Grup Oluştur
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">Henüz grup yok</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Gruplar oluşturarak abonelerinizi organize edin.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grup Adı</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Abone Sayısı</TableHead>
                        <TableHead><span className="sr-only">Eylemler</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">
                            <Link href={`/admin/newsletter/groups/${group.id}`} className="hover:underline">
                              {group.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{group.description}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                              <Users className="h-3 w-3" />
                              {group.subscriberCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Menüyü aç</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" /> Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fields" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
              <CardDescription>
                Aboneleriniz için özel alanlar tanımlayın.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">Henüz özel alan yok</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aboneleriniz hakkında daha fazla bilgi toplamak için özel alanlar oluşturun.
                  </p>
                  <div className="mt-6">
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Yeni Alan Oluştur
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>
                Aboneleriniz ve etkileşimleriniz hakkında istatistikler.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">İstatistikler yükleniyor</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Abonelerinizin etkileşim istatistikleri burada görünecek.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cleanup" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Clean Up</CardTitle>
              <CardDescription>
                İnaktif veya geçersiz aboneleri temizleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">Temizlik gerekiyor</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    İnaktif aboneleri temizlemek için araçlar burada olacak.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add to Group Modal */}
      <Dialog open={isAddToGroupModalOpen} onOpenChange={setIsAddToGroupModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gruba Ekle</DialogTitle>
            <DialogDescription>
              Seçili aboneleri bir gruba ekleyin. Seçili aboneler: {getSelectedSubscriberEmails()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right">
                Grup Adı
              </Label>
              <div className="col-span-3">
                <Input
                  id="group-name"
                  value={addGroupName}
                  onChange={(e) => setAddGroupName(e.target.value)}
                  placeholder="Grup adını girin"
                />
                {availableGroups.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">Mevcut gruplar:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableGroups.map((group) => (
                        <Button
                          key={group}
                          variant="outline"
                          size="sm"
                          onClick={() => setAddGroupName(group)}
                        >
                          {group}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddToGroupModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddToGroup} disabled={!addGroupName}>
              Gruba Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Remove from Group Modal */}
      <Dialog open={isRemoveFromGroupModalOpen} onOpenChange={setIsRemoveFromGroupModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gruptan Çıkar</DialogTitle>
            <DialogDescription>
              Seçili aboneleri bir gruptan çıkarın. Seçili aboneler: {getSelectedSubscriberEmails()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="remove-group-name" className="text-right">
                Grup Adı
              </Label>
              <div className="col-span-3">
                <Select onValueChange={setRemoveGroupName} value={removeGroupName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir grup seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveFromGroupModalOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={handleRemoveFromGroup} 
              disabled={!removeGroupName}
              variant="destructive"
            >
              Gruptan Çıkar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmModalOpen} onOpenChange={setIsDeleteConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aboneleri Sil</DialogTitle>
            <DialogDescription>
              Seçili aboneleri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              <br />
              <br />
              Seçili aboneler: {getSelectedSubscriberEmails()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}