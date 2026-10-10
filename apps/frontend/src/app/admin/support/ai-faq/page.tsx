'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Archive,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Search,
  Filter,
  BarChart3,
} from 'lucide-react';

interface AiFaqEntry {
  id: string;
  question: string;
  answer: string;
  summary?: string;
  categoryId?: string;
  categoryName?: string;
  confidence: number;
  useCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  sourceTicketIds: string[];
  generatedBy: string;
  status: 'draft' | 'approved' | 'archived';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  archived: number;
  avgConfidence: number;
  totalUsage: number;
  avgHelpfulness: number;
}

export default function AIFaqPage() {
  const [faqs, setFaqs] = useState<AiFaqEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFaq, setSelectedFaq] = useState<AiFaqEntry | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchFaqs();
    fetchStats();
  }, [activeTab, categoryFilter]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('status', activeTab);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);

      const response = await fetch(`/api/ai-faq?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch FAQs');
      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ai-faq/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateFaqs = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/ai-faq/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
          limit: 10,
          minTickets: 3,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate FAQs');
      const data = await response.json();

      toast.success(
        `Successfully generated ${data.generated} FAQs from ${data.ticketsAnalyzed} tickets`
      );
      fetchFaqs();
      fetchStats();
    } catch (error) {
      console.error('Error generating FAQs:', error);
      toast.error('Failed to generate FAQs');
    } finally {
      setGenerating(false);
    }
  };

  const approveFaq = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-faq/${id}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to approve FAQ');
      toast.success('FAQ approved successfully');
      fetchFaqs();
      fetchStats();
    } catch (error) {
      console.error('Error approving FAQ:', error);
      toast.error('Failed to approve FAQ');
    }
  };

  const rejectFaq = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-faq/${id}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to reject FAQ');
      toast.success('FAQ rejected');
      fetchFaqs();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting FAQ:', error);
      toast.error('Failed to reject FAQ');
    }
  };

  const archiveFaq = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-faq/${id}/archive`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to archive FAQ');
      toast.success('FAQ archived');
      fetchFaqs();
      fetchStats();
    } catch (error) {
      console.error('Error archiving FAQ:', error);
      toast.error('Failed to archive FAQ');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline">
            <Archive className="w-3 h-3 mr-1" />
            Archived
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getHelpfulnessScore = (faq: AiFaqEntry) => {
    const total = faq.helpfulCount + faq.notHelpfulCount;
    if (total === 0) return 0;
    return Math.round((faq.helpfulCount / total) * 100);
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI FAQ Management</h1>
          <p className="text-muted-foreground">
            Auto-generated FAQs from resolved support tickets
          </p>
        </div>
        <Button onClick={generateFaqs} disabled={generating}>
          <Sparkles className="w-4 h-4 mr-2" />
          {generating ? 'Generating...' : 'Generate FAQs'}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total FAQs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Helpfulness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgHelpfulness.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FAQ Entries</CardTitle>
              <CardDescription>
                Review and manage AI-generated frequently asked questions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  className="pl-9 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredFaqs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No FAQs found. Click "Generate FAQs" to create new ones from resolved tickets.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Confidence</TableHead>
                      <TableHead className="text-center">Usage</TableHead>
                      <TableHead className="text-center">Helpful</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFaqs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell className="max-w-md">
                          <div className="font-medium line-clamp-2">{faq.question}</div>
                          {faq.summary && (
                            <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {faq.summary}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {faq.categoryName ? (
                            <Badge variant="outline">{faq.categoryName}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(faq.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 mr-1 text-muted-foreground" />
                            {faq.confidence}%
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{faq.useCount}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="flex items-center text-green-600">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              {faq.helpfulCount}
                            </span>
                            <span className="flex items-center text-red-600">
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              {faq.notHelpfulCount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFaq(faq);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {faq.status === 'draft' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => approveFaq(faq.id)}
                                  className="text-green-600"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => rejectFaq(faq.id)}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {faq.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => archiveFaq(faq.id)}
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>FAQ Details</DialogTitle>
            <DialogDescription>Full question and answer details</DialogDescription>
          </DialogHeader>
          {selectedFaq && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Question</label>
                <div className="mt-1 p-3 bg-muted rounded-md">{selectedFaq.question}</div>
              </div>

              <div>
                <label className="text-sm font-medium">Answer</label>
                <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedFaq.answer}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedFaq.status)}</div>
                </div>

                <div>
                  <label className="text-sm font-medium">Confidence</label>
                  <div className="mt-1">{selectedFaq.confidence}%</div>
                </div>

                <div>
                  <label className="text-sm font-medium">Usage Count</label>
                  <div className="mt-1">{selectedFaq.useCount} times</div>
                </div>

                <div>
                  <label className="text-sm font-medium">Helpfulness</label>
                  <div className="mt-1">{getHelpfulnessScore(selectedFaq)}%</div>
                </div>

                <div>
                  <label className="text-sm font-medium">Source Tickets</label>
                  <div className="mt-1">{selectedFaq.sourceTicketIds.length} tickets</div>
                </div>

                <div>
                  <label className="text-sm font-medium">Generated By</label>
                  <div className="mt-1">{selectedFaq.generatedBy}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedFaq?.status === 'draft' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    rejectFaq(selectedFaq.id);
                    setViewDialogOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    approveFaq(selectedFaq.id);
                    setViewDialogOpen(false);
                  }}
                >
                  Approve
                </Button>
              </>
            )}
            {selectedFaq?.status === 'approved' && (
              <Button
                variant="outline"
                onClick={() => {
                  archiveFaq(selectedFaq.id);
                  setViewDialogOpen(false);
                }}
              >
                Archive
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
