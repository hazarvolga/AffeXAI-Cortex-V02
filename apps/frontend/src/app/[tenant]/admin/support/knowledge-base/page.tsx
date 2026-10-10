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
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ThumbsUp,
  Star,
  Loader2,
  CheckCircle2,
  XCircle,
  Archive,
  FileText,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { HelpCategoryMappings } from '@/components/admin/support/help-category-mappings';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function KnowledgeBaseAdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredArticles(filtered);
    } else {
      setFilteredArticles(articles);
    }
  }, [searchQuery, articles]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/knowledge-base');

      if (response.ok) {
        const data = await response.json();
        setArticles(data || []);
        setFilteredArticles(data || []);
      } else {
        // Fallback or empty state if API fails
        setArticles([]);
        setFilteredArticles([]);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      setArticles([]);
      setFilteredArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/knowledge-base/${articleToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchArticles();
        setDeleteDialogOpen(false);
        setArticleToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (article: Article) => {
    try {
      const response = await fetch(`/api/admin/knowledge-base/${article.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });

      if (response.ok) {
        await fetchArticles();
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const handleToggleFeatured = async (article: Article) => {
    try {
      const response = await fetch(`/api/admin/knowledge-base/${article.id}/featured`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFeatured: !article.isFeatured }),
      });

      if (response.ok) {
        await fetchArticles();
      }
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-[#9df425] font-mono text-xs uppercase tracking-widest">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading_Archive_Index...
      </div>
    );
  }

  // Calculate stats
  const totalArticles = articles.length;
  const publishedCount = articles.filter(a => a.isPublished).length;
  const featuredCount = articles.filter(a => a.isFeatured).length;
  const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0);

  return (
    <BccEditorialWrapper
      headerTitle="INTELLIGENCE_ARCHIVE"
      headerSubtitle="Centralized knowledge repository and documentation index."
      headerBadge="ARCHIVE"
      telemetryData={[
        { label: "INDEX_SIZE", value: totalArticles.toString() },
        { label: "PUBLIC_NODES", value: publishedCount.toString() },
        { label: "TOTAL_ACCESS", value: totalViews.toLocaleString() },
        { label: "SYNC_STATE", value: "OPTIMAL" }
      ]}
    >
      <div className="space-y-8">
        {/* Action Button */}
        <div className="flex justify-end">
          <Link href="/admin/support/knowledge-base/new">
            <Button variant="outline" className="h-8 text-[10px] uppercase tracking-widest border-[#9df425]/50 text-[#9df425] hover:bg-[#9df425]/10 bg-transparent">
              <Plus className="mr-2 h-3 w-3" />
              NEW_ENTRY
            </Button>
          </Link>
        </div>

        <HelpCategoryMappings />

        {/* HUD Tiles */}
        {/* HUD Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BccHudTile title="TOTAL_ENTRIES" subtitle="Indexed Articles" icon="book">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">{totalArticles}</div>
            <div className="text-[10px] uppercase tracking-widest text-[#9df425] mt-1">
              DATABASE_ACTIVE
            </div>
          </BccHudTile>

          <BccHudTile title="PUBLISHED_NODES" subtitle="Live Content" icon="verified">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">{publishedCount}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
              PUBLIC_ACCESS
            </div>
          </BccHudTile>

          <BccHudTile title="FEATURED_DOCS" subtitle="Priority Content" icon="star">
            <div className="text-3xl font-bold font-mono tracking-tighter text-[#ff8c00]">{featuredCount}</div>
            <div className="text-[10px] uppercase tracking-widest text-[#ff8c00]/60 mt-1">
              PINNED_ITEMS
            </div>
          </BccHudTile>

          <BccHudTile title="ACCESS_LOGS" subtitle="Total View Count" icon="visible">
            <div className="text-3xl font-bold font-mono tracking-tighter text-white">{totalViews.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-widest text-[#9df425] mt-1">
              CUMULATIVE_HITS
            </div>
          </BccHudTile>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="text"
              placeholder="SEARCH_REPOSITORY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white font-mono text-xs h-10 placeholder:text-white/20 focus-visible:ring-[#9df425]/50"
            />
          </div>
        </div>

        {/* Registry Table */}
        <div className="border border-white/5 bg-white/[0.02]">
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10">DOCUMENT_TITLE</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10">CATEGORY</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10">AUTHOR</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10">STATUS</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10 text-right">METRICS</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono h-10 text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="text-xs font-mono uppercase tracking-widest text-white/20">NO_ENTRIES_FOUND</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles.map((article) => (
                  <TableRow key={article.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-start gap-3">
                        <FileText className={`h-4 w-4 mt-0.5 ${article.isFeatured ? 'text-[#ff8c00]' : 'text-white/40'}`} />
                        <div>
                          <p className="font-mono text-sm text-white font-medium group-hover:text-[#9df425] transition-colors">
                            {article.title}
                          </p>
                          <p className="text-[10px] text-white/40 mt-1 line-clamp-1 font-mono">
                            {article.summary}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-none border-white/10 text-white/60 text-[10px] uppercase tracking-tight font-mono bg-white/5">
                        {article.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-white/60 uppercase">
                        {article.author.firstName} {article.author.lastName?.charAt(0)}.
                      </span>
                    </TableCell>
                    <TableCell>
                      {article.isPublished ? (
                        <div className="flex items-center gap-2 text-[#9df425]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#9df425] animate-pulse" />
                          <span className="text-[10px] uppercase tracking-widest font-bold">LIVE</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-white/40">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                          <span className="text-[10px] uppercase tracking-widest font-bold">DRAFT</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col gap-1 text-[10px] font-mono text-white/60">
                        <span className="flex items-center justify-end gap-1.5">
                          {article.viewCount.toLocaleString()}
                          <Eye className="h-3 w-3 opacity-50" />
                        </span>
                        <span className="flex items-center justify-end gap-1.5 text-[#9df425]/80">
                          {article.helpfulCount}
                          <ThumbsUp className="h-3 w-3 opacity-50" />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-white/10 hover:text-white"
                          onClick={() => handleToggleFeatured(article)}
                          title={article.isFeatured ? 'Demote' : 'Feature'}
                        >
                          <Star className={`h-4 w-4 ${article.isFeatured ? 'fill-[#ff8c00] text-[#ff8c00]' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-white/10 hover:text-white"
                          onClick={() => handleTogglePublish(article)}
                          title={article.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          <Activity className={`h-4 w-4 ${article.isPublished ? 'text-[#9df425]' : 'text-white/40'}`} />
                        </Button>
                        <Link href={`/admin/support/knowledge-base/${article.id}/edit`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 hover:text-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
                          onClick={() => {
                            setArticleToDelete(article);
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

      {/* Delete Confirmation Dialog - Styled */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-mono uppercase tracking-tight flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete_Protocol
            </DialogTitle>
            <DialogDescription className="text-white/60 font-mono text-xs">
              Confirm permanent deletion of the following node. This action is irreversible.
            </DialogDescription>
          </DialogHeader>

          {articleToDelete && (
            <div className="py-4 px-4 bg-white/5 border border-white/10 rounded-none my-2">
              <p className="font-bold text-[#9df425] font-mono text-sm">{articleToDelete.title}</p>
              <p className="text-xs text-white/40 mt-1 font-mono truncate">{articleToDelete.summary}</p>
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
                'Execute_Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BccEditorialWrapper>
  );
}
