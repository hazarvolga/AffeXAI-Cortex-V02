'use client';

import React, { useState, useEffect } from 'react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { AiCoPilot } from '@/components/brand/ai/AiCoPilot';

import { SocialModuleNav } from '@/components/admin/social/SocialModuleNav';
import CreatePostModal from './components/CreatePostModal';
import { SocialPostMobileCard } from '@/components/social/SocialPostMobileCard';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { socialMediaService, SocialPost, SocialStats } from '@/lib/api/socialMediaService';
import Link from "next/link";
import {
  BarChart3,
  PenTool,
  Calendar,
  Send,
  Twitter,
  Linkedin,
  Instagram,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Search,
  PlusCircle,
  FileUp,
  Trash2,
  RefreshCw,
  Heart
} from 'lucide-react';

const SocialPostTable = ({
  postsToShow,
  onDelete,
  onSync,
  tenant
}: {
  postsToShow: SocialPost[];
  onDelete: (id: string) => void;
  onSync: (id: string) => void;
  tenant: string;
}) => {
  if (postsToShow.length === 0) {
    return <div className="text-center text-white/40 py-12 font-mono uppercase tracking-widest text-[10px]">No Active Signals Found</div>
  }

  return (
    <Table>
      <TableHeader className="border-white/5">
        <TableRow className="hover:bg-transparent border-white/5">
          <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Signal ID / Content</TableHead>
          <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Status</TableHead>
          <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Temporal Node</TableHead>
          <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Frequency</TableHead>
          <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Resonance / Reach</TableHead>
          <TableHead className="text-right"><span className="sr-only">Ops</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {postsToShow.map(post => {
          const postDate = new Date(post.scheduledDate || post.createdAt);
          const isPublished = post.status === 'published';
          const reach = post.stats?.reach || 0;

          return (
            <TableRow key={post.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
              <TableCell className="py-4 max-w-[300px]">
                <div className="text-white font-medium mb-1 truncate text-xs">{post.content}</div>
                <div className="text-[9px] text-[#ff8c00]/60 font-mono uppercase tracking-widest">ID: {post.id}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`rounded-none border-white/10 uppercase text-[8px] tracking-widest px-2 py-0.5 ${post.status === 'published' ? "bg-[#9df425]/10 text-[#9df425] border-[#9df425]/20" :
                  post.status === 'scheduled' ? "bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/20" :
                    "text-white/40"
                  }`}>
                  {post.status}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-white/60 text-[10px]">{postDate.toLocaleDateString('tr-TR')}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  {post.platforms.includes('twitter') && <Twitter className="w-3 h-3 text-blue-400" />}
                  {post.platforms.includes('linkedin') && <Linkedin className="w-3 h-3 text-blue-600" />}
                  {post.platforms.includes('instagram') && <Instagram className="w-3 h-3 text-pink-500" />}
                </div>
              </TableCell>
              <TableCell>
                {isPublished ? (
                  <div className="flex flex-col gap-1.5 w-24">
                    <Progress value={Math.min((reach / 5000) * 100, 100)} className="h-0.5 bg-white/5 rounded-none" />
                    <div className="flex justify-between text-[8px] font-mono tracking-widest text-white/40 uppercase">
                      <span>{reach} Rch</span>
                      <span>{post.stats?.likes || 0} Lks</span>
                    </div>
                    {/* Sentiment Indicator */}
                    {post.feedback && post.feedback.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Heart className={`w-3 h-3 ${post.feedback[0].sentimentLabel === 'POSITIVE' ? 'text-[#9df425]' : post.feedback[0].sentimentLabel === 'NEGATIVE' ? 'text-red-500' : 'text-white/40'}`} />
                        <span className="text-[8px] uppercase tracking-widest text-white/60">
                          {post.feedback[0].sentimentLabel === 'POSITIVE' ? 'Pos' : post.feedback[0].sentimentLabel === 'NEGATIVE' ? 'Neg' : 'Neu'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[8px] text-white/20 font-mono uppercase">Pending...</div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1 font-mono text-[9px] uppercase tracking-tighter">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/5 hover:text-[#13ecec]" onClick={() => onSync(post.id)} title="Sync Feedback">
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/5 hover:text-[#ff8c00]">
                    <PenTool className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/5 hover:text-red-500" onClick={() => onDelete(post.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

          )
        })}
      </TableBody>
    </Table>
  )
}

export default function SocialMediaDashboard() {
  const params = useParams();
  // Safe tenant extraction with fallback
  const tenant = (params.tenant as string) || 'default';

  const [stats, setStats] = useState<SocialStats | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, postsData] = await Promise.all([
          socialMediaService.getStats(),
          socialMediaService.getPosts()
        ]);
        setStats(statsData);
        setPosts(postsData);
      } catch (error) {
        console.error('Failed to load social media data', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, postsData] = await Promise.all([
        socialMediaService.getStats(),
        socialMediaService.getPosts()
      ]);
      setStats(statsData);
      setPosts(postsData);
    } catch (error) {
      console.error('Failed to load social media data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await socialMediaService.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      // Re-fetch stats as total posts might change
      const statsData = await socialMediaService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Delete failed:", id, error);
    }
  };

  const handleSync = async (id: string) => {
    try {
      await socialMediaService.syncComments(id);
      // Refresh data to show new sentiment
      loadData();
    } catch (error) {
      console.error("Sync failed:", id, error);
    }
  };

  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const publishedPosts = posts.filter(p => p.status === 'published');

  return (
    <BccEditorialWrapper
      headerTitle="Social Command"
      headerSubtitle="Omnichannel signal orchestration & velocity control."
      headerBadge="Live"
      moduleNav={<SocialModuleNav />}
      headerAction={<AiCoPilot context="social_scheduler" variant="inline" />}
    >
      {/* Channel Status Bar (Hybrid Header) */}
      <div className="w-full bg-[#121212] border-b border-white/10 px-8 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-700">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 opacity-100">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mr-2">Linkage:</span>
          </div>
          <div className={`flex items-center space-x-2 ${stats?.twitterConnected ? 'opacity-100' : 'opacity-30 grayscale'}`}>
            <Twitter className={`w-4 h-4 ${stats?.twitterConnected ? 'text-blue-400' : 'text-white'}`} />
            <span className="text-[10px] font-mono uppercase text-white/60">Twitter_X</span>
            {stats?.twitterConnected && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>}
          </div>
          <div className="h-3 w-px bg-white/10"></div>
          <div className={`flex items-center space-x-2 ${stats?.linkedInConnected ? 'opacity-100' : 'opacity-30 grayscale'}`}>
            <Linkedin className={`w-4 h-4 ${stats?.linkedInConnected ? 'text-blue-600' : 'text-white'}`} />
            <span className="text-[10px] font-mono uppercase text-white/60">LinkedIn_Corp</span>
            {stats?.linkedInConnected && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>}
          </div>
          <div className="h-3 w-px bg-white/10"></div>
          <div className={`flex items-center space-x-2 ${false ? 'opacity-100' : 'opacity-30 grayscale'}`}>
            <Instagram className="w-4 h-4 text-white" />
            <span className="text-[10px] font-mono uppercase text-white/60">Instagram</span>
          </div>
        </div>

        <Link href={`/${tenant}/admin/social/accounts`}>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase tracking-widest text-[#ff8c00] hover:bg-[#ff8c00]/10 border border-[#ff8c00]/30 hover:border-[#ff8c00]">
            <PlusCircle className="w-3 h-3 mr-2" />
            Manage Nodes
          </Button>
        </Link>
      </div>

      <div className="space-y-8 pb-20 animate-in fade-in duration-1000 mt-8">

        {/* 1. Velocity Overview (Stats) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BccHudTile title="Signal Reach" subtitle="Total Reach" icon="radar">
            <div className="text-3xl font-light tracking-tighter text-white">{stats?.totalReach?.toLocaleString() ?? '0'}</div>
            <div className="text-[10px] text-[#9df425] font-mono mt-1">+12% from last cycle</div>
          </BccHudTile>
          <BccHudTile title="Resonance" subtitle="Engagement Rate" icon="query_stats">
            <div className="text-3xl font-light tracking-tighter text-white">{stats?.engagementRate ?? '0'}%</div>
            <div className="text-[10px] text-white/40 font-mono mt-1">Benchmark: 3.8%</div>
          </BccHudTile>
          <BccHudTile title="Active Signals" subtitle="Total Posts" icon="podcasts">
            <div className="text-3xl font-light tracking-tighter text-white">{stats?.totalPosts ?? '0'}</div>
            <div className="text-[10px] text-white/40 font-mono mt-1">Across 3 frequencies</div>
          </BccHudTile>
          <BccHudTile title="Transmission" subtitle="Actions" icon="send">
            <Button
              className="w-full bg-[#ff8c00] hover:bg-[#e67e00] text-black font-bold tracking-widest uppercase rounded-none h-8 text-[10px]"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <PenTool className="w-3 h-3 mr-2" />
              Compose Signal
            </Button>
          </BccHudTile>
        </section>

        {/* 2. Main Content Area (Registry Style) */}
        <BccHudTile
          className="col-span-full"
          title="Signal Registry"
          subtitle="Live feed of social transmissions"
          headerAction={
            <div className="relative w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 group-hover:text-[#ff8c00] transition-colors" />
              <Input
                placeholder="SIGNAL SEARCH..."
                className="bg-white/5 border-white/10 rounded-none h-8 pl-9 text-[10px] uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-[#ff8c00] transition-all"
              />
            </div>
          }
        >
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-transparent border-b border-white/5 rounded-none h-12 p-0 w-full justify-start space-x-8 mb-8">
              <TabsTrigger value="all" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8c00] data-[state=active]:bg-transparent text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 data-[state=active]:text-white h-full px-4 transition-all">All Signals</TabsTrigger>
              <TabsTrigger value="scheduled" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8c00] data-[state=active]:bg-transparent text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 data-[state=active]:text-white h-full px-4 transition-all">Scheduled</TabsTrigger>
              <TabsTrigger value="published" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8c00] data-[state=active]:bg-transparent text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 data-[state=active]:text-white h-full px-4 transition-all">Published</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-0">
              <div className="hidden md:block">
                <SocialPostTable postsToShow={posts} onDelete={handleDelete} onSync={handleSync} tenant={tenant} />
              </div>
              <div className="block md:hidden space-y-3">
                {posts.map(post => (
                  <SocialPostMobileCard key={post.id} post={post} onDelete={handleDelete} onSync={handleSync} />
                ))}
                {posts.length === 0 && <div className="text-center text-white/40 py-8 text-xs font-mono">NO SIGNALS</div>}
              </div>
            </TabsContent>
            <TabsContent value="scheduled" className="mt-0">
              <div className="hidden md:block">
                <SocialPostTable postsToShow={scheduledPosts} onDelete={handleDelete} onSync={handleSync} tenant={tenant} />
              </div>
              <div className="block md:hidden space-y-3">
                {scheduledPosts.map(post => (
                  <SocialPostMobileCard key={post.id} post={post} onDelete={handleDelete} onSync={handleSync} />
                ))}
                {scheduledPosts.length === 0 && <div className="text-center text-white/40 py-8 text-xs font-mono">NO SCHEDULED SIGNALS</div>}
              </div>
            </TabsContent>
            <TabsContent value="published" className="mt-0">
              <div className="hidden md:block">
                <SocialPostTable postsToShow={publishedPosts} onDelete={handleDelete} onSync={handleSync} tenant={tenant} />
              </div>
              <div className="block md:hidden space-y-3">
                {publishedPosts.map(post => (
                  <SocialPostMobileCard key={post.id} post={post} onDelete={handleDelete} onSync={handleSync} />
                ))}
                {publishedPosts.length === 0 && <div className="text-center text-white/40 py-8 text-xs font-mono">NO PUBLISHED SIGNALS</div>}
              </div>
            </TabsContent>
          </Tabs>
        </BccHudTile>


        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={loadData}
        />
      </div>
    </BccEditorialWrapper>
  );
}

