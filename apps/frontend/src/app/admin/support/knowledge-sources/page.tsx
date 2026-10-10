'use client';

import { useState, useEffect } from 'react';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Archive,
} from 'lucide-react';

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
  summary?: string;
  tags?: string[];
  keywords?: string[];
  metadata?: Record<string, any>;
  usageCount: number;
  helpfulCount: number;
  averageRelevanceScore: number;
  enableForFaqLearning: boolean;
  enableForChat: boolean;
  uploadedById: string;
  archivedAt?: string;
  archivedById?: string;
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

      console.log('🔍 Sending request to:', `${API_URL}/knowledge-sources`);
      console.log('🔍 Request body:', requestBody);
      console.log('🔍 Token:', localStorage.getItem('auth_token')?.substring(0, 20) + '...');

      const response = await fetch(`${API_URL}/knowledge-sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔍 Response status:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('🔍 Response text:', responseText);

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        console.error('❌ Backend error:', errorData);
        throw new Error((errorData as any).error?.message || (errorData as any).message || responseText || 'Failed to add URL source');
      }

      const result = JSON.parse(responseText);

      toast.success('URL source added successfully');
      setAddDialogOpen(false);
      setUrlForm({ url: '', title: '', description: '', tags: '', enableForFaqLearning: true, enableForChat: true });
      fetchSources();
      fetchStatistics();
    } catch (error) {
      console.error('Error adding URL source:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add URL source');
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
      console.log('🔍 Uploading file:', fileForm.file.name);

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

      console.log('🔍 Sending to:', `${API_URL}/knowledge-sources/upload`);

      const response = await fetch(`${API_URL}/knowledge-sources/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      console.log('🔍 Upload response:', response.status, response.statusText);

      const responseData = await response.json();
      console.log('🔍 Upload response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to upload file');
      }

      toast.success('File uploaded successfully');
      setAddDialogOpen(false);
      setFileForm({ file: null, title: '', description: '', tags: '', enableForFaqLearning: true, enableForChat: true });
      fetchSources();
      fetchStatistics();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
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
      <Badge variant={variant as any} className="flex items-center gap-1">
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Sources</h1>
          <p className="text-muted-foreground">
            Manage AI knowledge sources for FAQ learning and chatbot responses
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.byType.document}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">URLs</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.byType.url}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="url">URLs</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={fetchSources} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Sources</CardTitle>
          <CardDescription>
            {sources.length} source{sources.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No knowledge sources found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first knowledge source
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Source
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id}>
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
                          <div className="font-medium">{source.title}</div>
                          {source.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {source.description}
                            </div>
                          )}
                          {source.tags && source.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {source.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {source.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
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
                          <div>{source.usageCount} uses</div>
                          <div className="text-xs text-muted-foreground">
                            {source.helpfulCount} helpful
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {(source.averageRelevanceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(source.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
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
                            onClick={() => archiveSource(source.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Source Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Knowledge Source</DialogTitle>
            <DialogDescription>
              Add a new knowledge source from URL, file, or text
            </DialogDescription>
          </DialogHeader>

          <Tabs value={addType} onValueChange={(v) => setAddType(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="document">Document</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/article"
                  value={urlForm.url}
                  onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="url-title">Title</Label>
                <Input
                  id="url-title"
                  placeholder="Article title"
                  value={urlForm.title}
                  onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="url-description">Description (optional)</Label>
                <Textarea
                  id="url-description"
                  placeholder="Brief description..."
                  value={urlForm.description}
                  onChange={(e) => setUrlForm({ ...urlForm, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="url-tags">Tags (comma-separated)</Label>
                <Input
                  id="url-tags"
                  placeholder="tag1, tag2, tag3"
                  value={urlForm.tags}
                  onChange={(e) => setUrlForm({ ...urlForm, tags: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="url-faq">Enable for FAQ Learning</Label>
                <Switch
                  id="url-faq"
                  checked={urlForm.enableForFaqLearning}
                  onCheckedChange={(checked) =>
                    setUrlForm({ ...urlForm, enableForFaqLearning: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="url-chat">Enable for Chat</Label>
                <Switch
                  id="url-chat"
                  checked={urlForm.enableForChat}
                  onCheckedChange={(checked) =>
                    setUrlForm({ ...urlForm, enableForChat: checked })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="document" className="space-y-4">
              <div>
                <Label htmlFor="file">File (PDF, DOCX, TXT, MD)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => setFileForm({ ...fileForm, file: e.target.files?.[0] || null })}
                />
              </div>
              <div>
                <Label htmlFor="file-title">Title</Label>
                <Input
                  id="file-title"
                  placeholder="Document title"
                  value={fileForm.title}
                  onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="file-description">Description (optional)</Label>
                <Textarea
                  id="file-description"
                  placeholder="Brief description..."
                  value={fileForm.description}
                  onChange={(e) => setFileForm({ ...fileForm, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="file-tags">Tags (comma-separated)</Label>
                <Input
                  id="file-tags"
                  placeholder="tag1, tag2, tag3"
                  value={fileForm.tags}
                  onChange={(e) => setFileForm({ ...fileForm, tags: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="file-faq">Enable for FAQ Learning</Label>
                <Switch
                  id="file-faq"
                  checked={fileForm.enableForFaqLearning}
                  onCheckedChange={(checked) =>
                    setFileForm({ ...fileForm, enableForFaqLearning: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="file-chat">Enable for Chat</Label>
                <Switch
                  id="file-chat"
                  checked={fileForm.enableForChat}
                  onCheckedChange={(checked) =>
                    setFileForm({ ...fileForm, enableForChat: checked })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div>
                <Label htmlFor="text-title">Title</Label>
                <Input
                  id="text-title"
                  placeholder="Knowledge title"
                  value={textForm.title}
                  onChange={(e) => setTextForm({ ...textForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="text-description">Description (optional)</Label>
                <Textarea
                  id="text-description"
                  placeholder="Brief description..."
                  value={textForm.description}
                  onChange={(e) => setTextForm({ ...textForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="text-content">Content</Label>
                <Textarea
                  id="text-content"
                  placeholder="Enter your knowledge content here..."
                  value={textForm.content}
                  onChange={(e) => setTextForm({ ...textForm, content: e.target.value })}
                  rows={8}
                />
              </div>
              <div>
                <Label htmlFor="text-tags">Tags (comma-separated)</Label>
                <Input
                  id="text-tags"
                  placeholder="tag1, tag2, tag3"
                  value={textForm.tags}
                  onChange={(e) => setTextForm({ ...textForm, tags: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="text-faq">Enable for FAQ Learning</Label>
                <Switch
                  id="text-faq"
                  checked={textForm.enableForFaqLearning}
                  onCheckedChange={(checked) =>
                    setTextForm({ ...textForm, enableForFaqLearning: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="text-chat">Enable for Chat</Label>
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
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (addType === 'url') addUrlSource();
                else if (addType === 'document') addFileSource();
                else addTextSource();
              }}
            >
              Add Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Source Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSource?.title}</DialogTitle>
            <DialogDescription>
              {selectedSource?.sourceType} • Created{' '}
              {selectedSource?.createdAt && new Date(selectedSource.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedSource && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedSource.status)}</div>
              </div>

              {selectedSource.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedSource.description}</p>
                </div>
              )}

              {selectedSource.url && (
                <div>
                  <Label>URL</Label>
                  <a
                    href={selectedSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-blue-600 hover:underline block"
                  >
                    {selectedSource.url}
                  </a>
                </div>
              )}

              {selectedSource.fileName && (
                <div>
                  <Label>File</Label>
                  <p className="mt-1 text-sm">
                    {selectedSource.fileName} ({selectedSource.fileType}) •{' '}
                    {selectedSource.fileSize ? `${(selectedSource.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                  </p>
                </div>
              )}

              {selectedSource.tags && selectedSource.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedSource.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usage Count</Label>
                  <p className="mt-1 text-2xl font-bold">{selectedSource.usageCount}</p>
                </div>
                <div>
                  <Label>Helpful Count</Label>
                  <p className="mt-1 text-2xl font-bold">{selectedSource.helpfulCount}</p>
                </div>
                <div>
                  <Label>Relevance Score</Label>
                  <p className="mt-1 text-2xl font-bold">
                    {(selectedSource.averageRelevanceScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>FAQ Learning</Label>
                  <Badge variant={selectedSource.enableForFaqLearning ? 'default' : 'outline'}>
                    {selectedSource.enableForFaqLearning ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Chat</Label>
                  <Badge variant={selectedSource.enableForChat ? 'default' : 'outline'}>
                    {selectedSource.enableForChat ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              {selectedSource.extractedContent && (
                <div>
                  <Label>Extracted Content (Preview)</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-48 overflow-y-auto">
                    {selectedSource.extractedContent.substring(0, 500)}
                    {selectedSource.extractedContent.length > 500 && '...'}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
