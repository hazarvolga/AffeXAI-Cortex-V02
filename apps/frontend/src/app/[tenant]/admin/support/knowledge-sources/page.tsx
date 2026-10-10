'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  FileText,
  Link as LinkIcon,
  Upload,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Archive,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';

interface KnowledgeSource {
  id: string;
  title: string;
  description?: string;
  sourceType: 'document' | 'url' | 'text';
  status: 'pending' | 'processing' | 'active' | 'failed' | 'archived';
  filePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  url?: string;
  extractedContent: string;
  tags?: string[];
  usageCount: number;
  helpfulCount: number;
  averageRelevanceScore: number;
  enableForFaqLearning: boolean;
  enableForChat: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  total: number;
  active: number;
  archived: number;
  byType: {
    document: number;
    url: number;
    text: number;
  };
}

export default function KnowledgeSourcesPage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    active: 0,
    archived: 0,
    byType: { document: 0, url: 0, text: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<'url' | 'document' | 'text'>('url');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Add forms
  const [urlForm, setUrlForm] = useState({
    url: '',
    title: '',
    description: '',
    tags: '',
    enableForFaqLearning: true,
    enableForChat: true,
  });

  const [textForm, setTextForm] = useState({
    title: '',
    description: '',
    content: '',
    tags: '',
    enableForFaqLearning: true,
    enableForChat: true,
  });

  const [fileForm, setFileForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    tags: '',
    enableForFaqLearning: true,
    enableForChat: true,
  });

  useEffect(() => {
    fetchSources();
    fetchStatistics();
  }, [statusFilter, typeFilter]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('sourceType', typeFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '50');

      const response = await fetch(`${API_URL}/knowledge-sources?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch sources');
      const result = await response.json();
      setSources(result.data || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast.error('Failed to load knowledge sources');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_URL}/knowledge-sources/stats/overview`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) return;
      const result = await response.json();
      if (result.data) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const addUrlSource = async () => {
    try {
      const requestBody = {
        title: urlForm.title,
        description: urlForm.description,
        sourceType: 'url',
        url: urlForm.url,
        tags: urlForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        enableForFaqLearning: urlForm.enableForFaqLearning,
        enableForChat: urlForm.enableForChat,
      };

      const response = await fetch(`${API_URL}/knowledge-sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Failed to add URL source');

      toast.success('URL source added successfully');
      setAddDialogOpen(false);
      setUrlForm({ url: '', title: '', description: '', tags: '', enableForFaqLearning: true, enableForChat: true });
      fetchSources();
      fetchStatistics();
    } catch (error) {
      console.error('Error adding URL source:', error);
      toast.error('Failed to add URL source');
    }
  };

  const addTextSource = async () => {
    try {
      const response = await fetch(`${API_URL}/knowledge-sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          title: textForm.title,
          description: textForm.description,
          sourceType: 'text',
          extractedContent: textForm.content,
          tags: textForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
          enableForFaqLearning: textForm.enableForFaqLearning,
          enableForChat: textForm.enableForChat,
        }),
      });

      if (!response.ok) throw new Error('Failed to add text source');

      toast.success('Text source added successfully');
      setAddDialogOpen(false);
      setTextForm({ title: '', description: '', content: '', tags: '', enableForFaqLearning: true, enableForChat: true });
      fetchSources();
      fetchStatistics();
    } catch (error) {
      console.error('Error adding text source:', error);
      toast.error('Failed to add text source');
    }
  };

  const addFileSource = async () => {
    if (!fileForm.file) {
      toast.error('Please select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileForm.file);
      formData.append('title', fileForm.title || fileForm.file.name);
      if (fileForm.description) formData.append('description', fileForm.description);
      if (fileForm.tags) {
        const tags = fileForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
        formData.append('tags', JSON.stringify(tags));
      }
      formData.append('enableForFaqLearning', String(fileForm.enableForFaqLearning));
      formData.append('enableForChat', String(fileForm.enableForChat));

      const response = await fetch(`${API_URL}/knowledge-sources/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');

      toast.success('File uploaded successfully');
      setAddDialogOpen(false);
      setFileForm({ file: null, title: '', description: '', tags: '', enableForFaqLearning: true, enableForChat: true });
      fetchSources();
      fetchStatistics();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const deleteSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge source?')) return;

    try {
      const response = await fetch(`/api/knowledge-sources/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete source');

      toast.success('Knowledge source deleted');
      fetchSources();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting source:', error);
      toast.error('Failed to delete source');
    }
  };

  const archiveSource = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge-sources/${id}/archive`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to archive source');

      toast.success('Knowledge source archived');
      fetchSources();
      fetchStatistics();
    } catch (error) {
      console.error('Error archiving source:', error);
      toast.error('Failed to archive source');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'outline', icon: Clock },
      processing: { variant: 'secondary', icon: RefreshCw },
      active: { variant: 'default', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: XCircle },
      archived: { variant: 'outline', icon: Archive },
    };

    const { variant, icon: Icon } = variants[status] || variants.pending;

    return (
      <Badge variant={variant as any} className="flex items-center gap-1 border-white/10 bg-white/5 text-white/70">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      document: FileText,
      url: LinkIcon,
      text: FileText,
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <BccEditorialWrapper
      headerTitle="KNOWLEDGE SOURCES"
      headerSubtitle="Manage AI knowledge sources for FAQ learning and chatbot responses"
      headerBadge="DATABASE"
      headerAction={
        <Button onClick={() => setAddDialogOpen(true)} className="bg-[#9df425] text-black hover:bg-[#82cb1e]">
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Statistics Tiles */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <BccHudTile title="TOTAL_SOURCES" subtitle="All Documents" icon="description">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">
              {statistics.total}
            </div>
          </BccHudTile>
          <BccHudTile title="ACTIVE_SOURCES" subtitle="Live Content" icon="verified">
            <div className="text-3xl font-bold font-mono tracking-tighter text-[#9df425]">
              {statistics.active}
            </div>
          </BccHudTile>
          <BccHudTile title="DOCUMENTS" subtitle="File Uploads" icon="article">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">
              {statistics.byType.document}
            </div>
          </BccHudTile>
          <BccHudTile title="URL_LINKS" subtitle="Web Resources" icon="link">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">
              {statistics.byType.url}
            </div>
          </BccHudTile>
        </div>

        {/* Filters */}
        <div className="border border-white/5 bg-white/[0.02] rounded-md p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Filters</h3>
              <Button onClick={fetchSources} variant="ghost" size="sm" className="h-8 text-white/40 hover:text-white">
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="search" className="text-xs text-white/40 mb-1">SEARCH</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status" className="text-xs text-white/40 mb-1">STATUS</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status" className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#09090b] border-white/10 text-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type" className="text-xs text-white/40 mb-1">TYPE</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type" className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#09090b] border-white/10 text-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="url">URLs</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Sources Table */}
        <div className="border border-white/5 bg-white/[0.02] rounded-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-[#9df425]" />
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-white/20 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No knowledge sources found</h3>
              <p className="text-white/40 mb-4">
                Get started by adding your first knowledge source
              </p>
              <Button onClick={() => setAddDialogOpen(true)} className="bg-[#9df425] text-black hover:bg-[#82cb1e]">
                <Plus className="mr-2 h-4 w-4" />
                Add Source
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-white/[0.02]">
                  <TableHead className="text-white/60">Type</TableHead>
                  <TableHead className="text-white/60">Title</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-white/60">Usage</TableHead>
                  <TableHead className="text-white/60">Score</TableHead>
                  <TableHead className="text-white/60">Created</TableHead>
                  <TableHead className="text-right text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(source.sourceType)}
                        <span className="text-xs text-muted-foreground">
                          {source.sourceType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">{source.title}</div>
                        {source.description && (
                          <div className="text-xs text-white/40 line-clamp-1">
                            {source.description}
                          </div>
                        )}
                        {source.tags && source.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {source.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs border-white/10 bg-white/5 text-white/70">
                                {tag}
                              </Badge>
                            ))}
                            {source.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs border-white/10 bg-white/5 text-white/70">
                                +{source.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(source.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-white">{source.usageCount} uses</div>
                        <div className="text-xs text-white/40">
                          {source.helpfulCount} helpful
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-[#9df425]">
                          {(source.averageRelevanceScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white/40">
                        {new Date(source.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-white/10 hover:text-white"
                          onClick={() => {
                            setSelectedSource(source);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-white/10 hover:text-white"
                          onClick={() => archiveSource(source.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-500/20 hover:text-red-400"
                          onClick={() => deleteSource(source.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Add Source Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#09090b] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Add Knowledge Source</DialogTitle>
              <DialogDescription className="text-white/60">
                Add a new knowledge source from URL, file, or text
              </DialogDescription>
            </DialogHeader>

            <Tabs value={addType} onValueChange={(v) => setAddType(v as any)}>
              <TabsList className="grid w-full grid-cols-3 bg-black/20 border border-white/10">
                <TabsTrigger value="url" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">URL</TabsTrigger>
                <TabsTrigger value="document" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Document</TabsTrigger>
                <TabsTrigger value="text" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Text</TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="url" className="text-white/80">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/article"
                    value={urlForm.url}
                    onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="url-title" className="text-white/80">Title</Label>
                  <Input
                    id="url-title"
                    placeholder="Article title"
                    value={urlForm.title}
                    onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="url-description" className="text-white/80">Description (optional)</Label>
                  <Textarea
                    id="url-description"
                    placeholder="Brief description..."
                    value={urlForm.description}
                    onChange={(e) => setUrlForm({ ...urlForm, description: e.target.value })}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="url-tags" className="text-white/80">Tags (comma-separated)</Label>
                  <Input
                    id="url-tags"
                    placeholder="tag1, tag2, tag3"
                    value={urlForm.tags}
                    onChange={(e) => setUrlForm({ ...urlForm, tags: e.target.value })}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="url-faq" className="text-white/80">Enable for FAQ Learning</Label>
                  <Switch
                    id="url-faq"
                    checked={urlForm.enableForFaqLearning}
                    onCheckedChange={(checked) =>
                      setUrlForm({ ...urlForm, enableForFaqLearning: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="url-chat" className="text-white/80">Enable for Chat</Label>
                  <Switch
                    id="url-chat"
                    checked={urlForm.enableForChat}
                    onCheckedChange={(checked) =>
                      setUrlForm({ ...urlForm, enableForChat: checked })
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="document" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="file" className="text-white/80">File (PDF, DOCX, TXT, MD)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={(e) => setFileForm({ ...fileForm, file: e.target.files?.[0] || null })}
                    className="bg-black/20 border-white/10 text-white cursor-pointer file:text-white file:bg-white/10 file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded-md file:cursor-pointer hover:file:bg-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="file-title" className="text-white/80">Title</Label>
                  <Input
                    id="file-title"
                    placeholder="Document title"
                    value={fileForm.title}
                    onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="file-description" className="text-white/80">Description (optional)</Label>
                  <Textarea
                    id="file-description"
                    placeholder="Brief description..."
                    value={fileForm.description}
                    onChange={(e) => setFileForm({ ...fileForm, description: e.target.value })}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="file-tags" className="text-white/80">Tags (comma-separated)</Label>
                  <Input
                    id="file-tags"
                    placeholder="tag1, tag2, tag3"
                    value={fileForm.tags}
                    onChange={(e) => setFileForm({ ...fileForm, tags: e.target.value })}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="file-faq" className="text-white/80">Enable for FAQ Learning</Label>
                  <Switch
                    id="file-faq"
                    checked={fileForm.enableForFaqLearning}
                    onCheckedChange={(checked) =>
                      setFileForm({ ...fileForm, enableForFaqLearning: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="file-chat" className="text-white/80">Enable for Chat</Label>
                  <Switch
                    id="file-chat"
                    checked={fileForm.enableForChat}
                    onCheckedChange={(checked) =>
                      setFileForm({ ...fileForm, enableForChat: checked })
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="text-title" className="text-white/80">Title</Label>
                  <Input
                    id="text-title"
                    placeholder="Knowledge title"
                    value={textForm.title}
                    onChange={(e) => setTextForm({ ...textForm, title: e.target.value })}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="text-description" className="text-white/80">Description (optional)</Label>
                  <Textarea
                    id="text-description"
                    placeholder="Brief description..."
                    value={textForm.description}
                    onChange={(e) => setTextForm({ ...textForm, description: e.target.value })}
                    rows={2}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="text-content" className="text-white/80">Content</Label>
                  <Textarea
                    id="text-content"
                    placeholder="Enter your knowledge content here..."
                    value={textForm.content}
                    onChange={(e) => setTextForm({ ...textForm, content: e.target.value })}
                    rows={8}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div>
                  <Label htmlFor="text-tags" className="text-white/80">Tags (comma-separated)</Label>
                  <Input
                    id="text-tags"
                    placeholder="tag1, tag2, tag3"
                    value={textForm.tags}
                    onChange={(e) => setTextForm({ ...textForm, tags: e.target.value })}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="text-faq" className="text-white/80">Enable for FAQ Learning</Label>
                  <Switch
                    id="text-faq"
                    checked={textForm.enableForFaqLearning}
                    onCheckedChange={(checked) =>
                      setTextForm({ ...textForm, enableForFaqLearning: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="text-chat" className="text-white/80">Enable for Chat</Label>
                  <Switch
                    id="text-chat"
                    checked={textForm.enableForChat}
                    onCheckedChange={(checked) =>
                      setTextForm({ ...textForm, enableForChat: checked })
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="border-white/10 bg-transparent text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (addType === 'url') addUrlSource();
                  else if (addType === 'document') addFileSource();
                  else addTextSource();
                }}
                className="bg-[#9df425] text-black hover:bg-[#82cb1e]"
              >
                Add Source
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Source Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#09090b] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>{selectedSource?.title}</DialogTitle>
              <DialogDescription className="text-white/60">
                {selectedSource?.sourceType} • Created{' '}
                {selectedSource?.createdAt && new Date(selectedSource.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            {selectedSource && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white/80">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSource.status)}</div>
                </div>

                {selectedSource.description && (
                  <div>
                    <Label className="text-white/80">Description</Label>
                    <p className="mt-1 text-sm text-white/60">{selectedSource.description}</p>
                  </div>
                )}

                {selectedSource.url && (
                  <div>
                    <Label className="text-white/80">URL</Label>
                    <a
                      href={selectedSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-400 hover:underline block"
                    >
                      {selectedSource.url}
                    </a>
                  </div>
                )}

                {selectedSource.fileName && (
                  <div>
                    <Label className="text-white/80">File</Label>
                    <p className="mt-1 text-sm text-white/60">
                      {selectedSource.fileName} ({selectedSource.fileType}) •{' '}
                      {selectedSource.fileSize ? `${(selectedSource.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                    </p>
                  </div>
                )}

                {selectedSource.tags && selectedSource.tags.length > 0 && (
                  <div>
                    <Label className="text-white/80">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedSource.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="border-white/10 bg-white/5 text-white/70">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">Usage Count</Label>
                    <p className="mt-1 text-2xl font-bold text-white">{selectedSource.usageCount}</p>
                  </div>
                  <div>
                    <Label className="text-white/80">Helpful Count</Label>
                    <p className="mt-1 text-2xl font-bold text-white">{selectedSource.helpfulCount}</p>
                  </div>
                  <div>
                    <Label className="text-white/80">Relevance Score</Label>
                    <p className="mt-1 text-2xl font-bold text-[#9df425]">
                      {(selectedSource.averageRelevanceScore * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80">FAQ Learning</Label>
                    <Badge variant={selectedSource.enableForFaqLearning ? 'default' : 'outline'} className={selectedSource.enableForFaqLearning ? 'bg-[#9df425] text-black hover:bg-[#82cb1e]' : 'border-white/10 text-white/60'}>
                      {selectedSource.enableForFaqLearning ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80">Chat</Label>
                    <Badge variant={selectedSource.enableForChat ? 'default' : 'outline'} className={selectedSource.enableForChat ? 'bg-[#9df425] text-black hover:bg-[#82cb1e]' : 'border-white/10 text-white/60'}>
                      {selectedSource.enableForChat ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                {selectedSource.extractedContent && (
                  <div>
                    <Label className="text-white/80">Extracted Content (Preview)</Label>
                    <div className="mt-1 p-3 bg-black/20 border border-white/10 rounded-md text-sm text-white/60 max-h-48 overflow-y-auto">
                      {selectedSource.extractedContent.substring(0, 500)}
                      {selectedSource.extractedContent.length > 500 && '...'}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="border-white/10 bg-transparent text-white hover:bg-white/10">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BccEditorialWrapper>
  );
}
