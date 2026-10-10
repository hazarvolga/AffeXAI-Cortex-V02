'use client';

import { useState, useEffect } from 'react';
import { httpClient } from '@/lib/api/http-client';
import { ticketsService, type Ticket, type TicketStats, TicketStatus, TicketPriority } from '@/lib/api/ticketsService';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Circle,
  CheckCircle2,
  XCircle,
  Book,
  Activity,
  Check,
  Clock,
  Zap,
  AlertTriangle,
  BarChart3,
  FileText,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTicketNotifications } from '@/hooks/useTicketNotifications';
import { Badge as ConnectionBadge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

const getStatusIcon = (status: Ticket['status']) => {
  switch (status) {
    case TicketStatus.OPEN:
      return <ArrowRight className="h-4 w-4 text-blue-500" />;
    case TicketStatus.PENDING_INTERNAL:
      return <Circle className="h-4 w-4 text-yellow-500 animate-pulse" />;
    case TicketStatus.RESOLVED:
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case TicketStatus.CLOSED:
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    case TicketStatus.PENDING_CUSTOMER:
      return <Clock className="h-4 w-4 text-orange-500" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
};

const getPriorityIcon = (priority: Ticket['priority']) => {
  switch (priority) {
    case TicketPriority.URGENT:
    case TicketPriority.HIGH:
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    case TicketPriority.MEDIUM:
      return <ArrowRight className="h-4 w-4 text-yellow-500" />;
    case TicketPriority.LOW:
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    default:
      return <ArrowRight className="h-4 w-4" />;
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    [TicketStatus.OPEN]: 'Açık',
    [TicketStatus.PENDING_INTERNAL]: 'İşlemde',
    [TicketStatus.RESOLVED]: 'Çözüldü',
    [TicketStatus.CLOSED]: 'Kapalı',
    [TicketStatus.PENDING_CUSTOMER]: 'Müşteri Bekliyor',
  };
  return labels[status] || status;
};

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    [TicketPriority.LOW]: 'Düşük',
    [TicketPriority.MEDIUM]: 'Orta',
    [TicketPriority.HIGH]: 'Yüksek',
    [TicketPriority.URGENT]: 'Acil',
  };
  return labels[priority] || priority;
};

const getInitials = (firstName?: string, lastName?: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
};

const formatTime = (hours: number) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}dk`;
  }
  return `${hours.toFixed(1)}s`;
};

// ... imports
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { AiCoPilot } from '@/components/brand/ai/AiCoPilot';
import { BccHudTile } from "@/components/brand/BccHudTile";

import { useParams } from "next/navigation";

// ... existing interfaces ...

// ... existing helpers ...

export default function SupportDashboardPage() {
  const params = useParams();
  const tenant = params?.tenant as string || 'default';
  const { isConnected } = useTicketNotifications();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch tickets using ticketsService
      const fetchedTickets = await ticketsService.getTickets();

      // Sort and limit on frontend
      const latestTickets = [...fetchedTickets]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setTickets(latestTickets);

      // Fetch stats using service method
      const fetchedStats = await ticketsService.getStats();
      setStats(fetchedStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { title: 'Açık Talepler', value: stats?.openTickets || 0, icon: 'pending_actions' },
    { title: 'İşlemde', value: stats?.inProgressTickets || 0, icon: 'schedule' },
    { title: 'Çözüldü', value: stats?.resolvedTickets || 0, icon: 'check_circle' },
    { title: 'Kapandı', value: stats?.closedTickets || 0, icon: 'cancel' },
  ];

  return (
    <BccEditorialWrapper
      headerTitle="Support"
      headerSubtitle="Customer assistance and ticket management."
      headerBadge="Help"
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Destek Paneli</h2>
              <p className="text-muted-foreground">Destek taleplerine genel bir bakış.</p>
            </div>
            <ConnectionBadge
              variant={isConnected ? 'default' : 'secondary'}
              className="flex items-center gap-1"
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Canlı
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Bağlantı Kesildi
                </>
              )}
            </ConnectionBadge>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/${tenant}/admin/support/new`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni Talep Oluştur
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${tenant}/admin/support/analytics`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analitikler
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${tenant}/admin/support/templates`}>
                <FileText className="mr-2 h-4 w-4" />
                Şablonlar
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${tenant}/admin/support/categories`}>
                <Book className="mr-2 h-4 w-4" />
                Kategoriler
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {statCards.map((stat) => (
            <BccHudTile key={stat.title} title={stat.title} subtitle="METRIC_SIGNAL" icon={stat.icon}>
              <div className="text-3xl font-bold font-mono tracking-tighter text-[#9df425]">{stat.value}</div>
            </BccHudTile>
          ))}
        </div>

        {/* SLA Metrics Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <BccHudTile title="PROTOCOL_COMPLIANCE" subtitle="SLA ADHERENCE" icon="verified">
            <div>
              <div className="text-3xl font-bold font-mono tracking-tighter text-white">{stats?.slaCompliance || 0}%</div>
              <p className="text-[10px] uppercase tracking-widest text-[#9df425] mt-1">TARGET: 95%+</p>
            </div>
          </BccHudTile>

          <BccHudTile title="RESPONSE_VELOCITY" subtitle="AVG_RESPONSE" icon="schedule">
            <div>
              <div className="text-3xl font-bold font-mono tracking-tighter text-white">
                {formatTime(stats?.averageResponseTime || 0)}
              </div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">THRESHOLD: &lt;4s</p>
            </div>
          </BccHudTile>

          <BccHudTile title="RESOLUTION_CYCLE" subtitle="AVG_RESOLUTION" icon="bolt">
            <div>
              <div className="text-3xl font-bold font-mono tracking-tighter text-white">
                {formatTime(stats?.averageResolutionTime || 0)}
              </div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">THRESHOLD: &lt;24s</p>
            </div>
          </BccHudTile>

          <BccHudTile title="PROTOCOL_BREACHES" subtitle="SLA VIOLATIONS" icon="warning">
            <div>
              <div className="text-3xl font-bold font-mono tracking-tighter text-[#ff0000]">{stats?.slaBreaches || 0}</div>
              <p className="text-[10px] uppercase tracking-widest text-[#ff0000]/60 mt-1">CURRENT_CYCLE</p>
            </div>
          </BccHudTile>
        </div>

        <div className="border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div>
              <div className="text-[14px] font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#9df425]" />
                Incoming_Transmissions
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">
                Recent Support Signals
              </div>
            </div>
          </div>

          <div className="p-0">
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-white/[0.01]">
                <div className="text-[10px] uppercase tracking-widest text-white/20">Frequency Clear</div>
                <div className="text-[9px] uppercase tracking-widest text-white/10 mt-1">No active signals detected</div>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[9px] uppercase tracking-widest text-[#9df425] font-mono py-2">Signal ID</TableHead>
                    <TableHead className="text-[9px] uppercase tracking-widest text-white/40 font-bold py-2">Subject</TableHead>
                    <TableHead className="text-[9px] uppercase tracking-widest text-white/40 font-bold py-2">Source</TableHead>
                    <TableHead className="text-[9px] uppercase tracking-widest text-white/40 font-bold py-2">Phase</TableHead>
                    <TableHead className="text-[9px] uppercase tracking-widest text-white/40 font-bold py-2">Priority</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-white/5 hover:bg-white/[0.04] transition-colors group">
                      <TableCell className="font-mono text-[10px] text-[#9df425]/80 group-hover:text-[#9df425]">
                        #{ticket.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/${tenant}/admin/support/${ticket.id}`}
                          className="hover:text-[#9df425] transition-colors text-[13px] text-white"
                        >
                          {ticket.subject}
                        </Link>
                        <div className="text-[9px] uppercase tracking-widest text-white/30 mt-0.5">
                          {ticket.category?.name || 'Unclassified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 rounded-none border border-white/10">
                            <AvatarFallback className="rounded-none bg-white/5 text-[9px] text-white/60">
                              {getInitials(ticket.user?.firstName, ticket.user?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-[11px] text-white/80 font-medium">
                              {ticket.user?.firstName || 'Unknown'} {ticket.user?.lastName || 'User'}
                            </div>
                            <div className="text-[9px] font-mono text-white/30">
                              {ticket.user?.email || 'No Signal'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-none border-white/10 bg-transparent text-[9px] uppercase tracking-wider font-mono h-6 px-2',
                            ticket.status === TicketStatus.OPEN && 'text-blue-400 border-blue-400/20 bg-blue-400/5',
                            ticket.status === TicketStatus.PENDING_INTERNAL && 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
                            ticket.status === TicketStatus.RESOLVED && 'text-[#9df425] border-[#9df425]/20 bg-[#9df425]/5',
                            ticket.status === TicketStatus.PENDING_CUSTOMER && 'text-orange-400 border-orange-400/20 bg-orange-400/5',
                            ticket.status === TicketStatus.CLOSED && 'text-white/20 border-white/10'
                          )}
                        >
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1.5">{getStatusLabel(ticket.status)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-white/60">
                          {getPriorityIcon(ticket.priority)}
                          {getPriorityLabel(ticket.priority)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-white/10 rounded-none">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-3 w-3 text-white/40" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black border border-white/10 rounded-none">
                            <DropdownMenuItem asChild className="text-[10px] uppercase tracking-widest text-white/80 focus:bg-white/10 focus:text-white rounded-none cursor-pointer">
                              <Link href={`/${tenant}/admin/support/${ticket.id}`}>
                                VIEW_TRANSMISSION
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="text-[10px] uppercase tracking-widest text-white/80 focus:bg-white/10 focus:text-white rounded-none cursor-pointer">
                              <Link href={`/${tenant}/admin/users/${ticket.userId}`}>
                                INSPECT_PERSONNEL
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex items-center justify-between p-4 border-t border-white/5 bg-white/[0.01]">
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
              Total_Signals: <span className="text-white/60">{stats?.totalTickets || 0}</span>
            </p>
            <Button variant="outline" size="sm" asChild className="h-7 text-[10px] uppercase tracking-widest bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 rounded-none transition-all">
              <Link href={`/${tenant}/admin/support/tickets`}>Access_Full_Registry</Link>
            </Button>
          </div>
        </div>
      </div>
      {/* Neural Grid Synapse */}
      <AiCoPilot context="customer_support" />
    </BccEditorialWrapper>

  );
}
