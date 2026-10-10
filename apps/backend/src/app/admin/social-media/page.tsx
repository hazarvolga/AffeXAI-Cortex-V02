
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Share2,
  Clock,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Calendar as CalendarIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { socialPosts, socialAccounts, getSourceContentName, getPlatformIcon } from '@/lib/social-media-data';
import { SocialPostStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ContentCalendar } from '@/components/admin/social-media/content-calendar';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const getStatusVariant = (status: SocialPostStatus) => {
  switch (status) {
    case 'Yayınlandı':
      return 'bg-green-500';
    case 'Planlandı':
      return 'bg-blue-500';
    case 'Hata':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};


export default function SocialMediaDashboardPage() {
  const connectedAccounts = socialAccounts.filter(a => a.isConnected).length;
  const scheduledPosts = socialPosts.filter(p => p.status === 'Planlandı').length;
  const publishedPosts = socialPosts.filter(p => p.status === 'Yayınlandı').length;
  const failedPosts = socialPosts.filter(p => p.status === 'Hata').length;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sosyal Medya Paneli</h1>
          <p className="text-muted-foreground">
            Planlanmış ve yayınlanmış gönderilerinize genel bir bakış.
          </p>
        </div>
        <Button asChild size="lg">
            <Link href="/admin/social-media/composer">
                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Gönderi Oluştur
            </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bağlı Hesaplar</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedAccounts} / {socialAccounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planlanmış Gönderiler</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yayınlanmış (Bu Ay)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedPosts}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hatalı Gönderiler</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{failedPosts}</div>
          </CardContent>
        </Card>
      </div>
      
       <div className="flex items-center justify-between gap-4 rounded-lg border bg-card text-card-foreground p-3 shadow-sm">
            <div className='flex items-center gap-2'>
                 <TooltipProvider>
                    {socialAccounts.map(account => {
                        const PlatformIcon = getPlatformIcon(account.platform);
                        return (
                            <Tooltip key={account.id}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className={cn(!account.isConnected && 'opacity-30 hover:opacity-100')}>
                                        <PlatformIcon className={cn('h-5 w-5', account.isConnected && 'text-primary')} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{account.username}</p>
                                    <p>{account.isConnected ? 'Bağlı' : 'Bağlı Değil'}</p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </TooltipProvider>
                <Button variant="outline" size="icon">
                    <PlusCircle className="h-5 w-5 text-muted-foreground"/>
                </Button>
            </div>
             <Collapsible open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                        {isCalendarOpen ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                        {isCalendarOpen ? 'Takvimi Gizle' : 'Takvimi Göster'}
                    </Button>
                </CollapsibleTrigger>
            </Collapsible>
        </div>


      <Collapsible open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <CollapsibleContent className="space-y-4 pt-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <ContentCalendar />
        </CollapsibleContent>
      </Collapsible>


      <Card>
        <CardHeader>
            <CardTitle>Son Gönderiler</CardTitle>
            <CardDescription>
                En son planlanan ve yayınlanan gönderileriniz.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>İçerik</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {socialPosts.map(post => {
                const account = socialAccounts.find(a => a.id === post.accountId);
                const PlatformIcon = account ? getPlatformIcon(account.platform) : Share2;
                const date = post.status === 'Yayınlandı' ? post.publishedAt : post.scheduledAt;

                return (
                <TableRow key={post.id}>
                    <TableCell>
                    {account && (
                        <div className="flex items-center gap-2">
                        <PlatformIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{account.platform}</span>
                        </div>
                    )}
                    </TableCell>
                    <TableCell>
                    <p className="font-medium line-clamp-1">{post.content}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <LinkIcon className="h-3 w-3"/>
                        {getSourceContentName(post.sourceContentType, post.sourceContentId)}
                    </span>
                    </TableCell>
                    <TableCell>
                    <Badge className={cn(getStatusVariant(post.status))}>
                        {post.status}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {isClient && date ? new Date(date).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour:'2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>
                </TableRow>
                )})}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
