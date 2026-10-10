'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, ArrowUpRight, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { ticketsService, TicketStatus } from "@/lib/api/ticketsService";

interface TicketStats {
  open: number;
  pending: number;
  resolved: number;
  avgResponseTime: number; // in hours
  slaTarget: number; // SLA target percentage
  currentSLA: number; // Current SLA achievement
}

interface HighPriorityTicket {
  id: string;
  title: string;
  priority: 'high' | 'urgent';
  age: string;
}

export function SupportGaugeChart() {
  const [stats, setStats] = useState<TicketStats>({
    open: 0,
    pending: 0,
    resolved: 0,
    avgResponseTime: 0,
    slaTarget: 95,
    currentSLA: 0,
  });
  const [highPriorityTickets, setHighPriorityTickets] = useState<HighPriorityTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get real ticket statistics
      const ticketStats = await ticketsService.getStats();

      // Get high priority tickets
      const allTickets = await ticketsService.getTickets({
        status: TicketStatus.OPEN
      }).catch(() => []);

      // Filter high priority tickets
      const highPriorityList = allTickets
        .filter(ticket => ticket.priority === 'high' || ticket.priority === 'urgent')
        .slice(0, 3)
        .map(ticket => {
          const createdDate = new Date(ticket.createdAt);
          const now = new Date();
          const hoursDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

          return {
            id: `#${ticket.id.substring(0, 8)}`,
            title: ticket.subject.length > 30 ? ticket.subject.substring(0, 30) + '...' : ticket.subject,
            priority: ticket.priority as 'high' | 'urgent',
            age: hoursDiff < 1 ? 'Az önce' : hoursDiff < 24 ? `${hoursDiff} saat` : `${Math.floor(hoursDiff / 24)} gün`,
          };
        });

      setHighPriorityTickets(highPriorityList.length > 0 ? highPriorityList : []);

      // Map stats to our format
      const openCount = ticketStats.openTickets;
      const inProgressCount = ticketStats.byStatus.open || 0;
      const waitingCount = ticketStats.byStatus.pendingCustomer || 0;
      const resolvedCount = (ticketStats.byStatus[TicketStatus.RESOLVED] || 0) +
        (ticketStats.byStatus[TicketStatus.CLOSED] || 0);

      setStats({
        open: openCount,
        pending: inProgressCount + waitingCount,
        resolved: resolvedCount,
        avgResponseTime: ticketStats.averageResponseTime || 0,
        slaTarget: 95,
        currentSLA: ticketStats.slaCompliance,
      });

    } catch (error) {
      console.error('Error loading support tickets data:', error);
      // Fallback to empty state
      setStats({
        open: 0,
        pending: 0,
        resolved: 0,
        avgResponseTime: 0,
        slaTarget: 95,
        currentSLA: 0,
      });
      setHighPriorityTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // Gauge data for RadialBarChart
  const gaugeData = [
    {
      name: 'SLA',
      value: stats.currentSLA,
      fill: stats.currentSLA >= stats.slaTarget ? 'hsl(142, 71%, 45%)' : stats.currentSLA >= 80 ? 'hsl(48, 96%, 53%)' : 'hsl(0, 84%, 60%)',
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Destek Performansı
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5" />
          Destek Performansı
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          SLA Hedefi: %{stats.slaTarget}
        </p>
      </CardHeader>
      <CardContent>
        {/* Gauge + Stats */}
        <div className="flex items-center gap-6">
          {/* Gauge Chart */}
          <div className="flex-shrink-0 relative">
            <ResponsiveContainer width={140} height={140}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold">{stats.currentSLA}%</p>
              <p className="text-[10px] text-muted-foreground">SLA Başarı</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
              <p className="text-xl font-bold text-red-600">{stats.open}</p>
              <p className="text-xs text-muted-foreground">Açık</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Beklemede</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
              <p className="text-xl font-bold text-green-600">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Çözüldü</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="text-xl font-bold text-blue-600">{stats.avgResponseTime}h</p>
              <p className="text-xs text-muted-foreground">Ort. Yanıt</p>
            </div>
          </div>
        </div>

        {/* High Priority Tickets List */}
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold">Yüksek Öncelikli</p>
          </div>
          <div className="space-y-2">
            {highPriorityTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{ticket.title}</p>
                  <p className="text-muted-foreground">{ticket.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{ticket.age}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ticket.priority === 'urgent'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                      }`}
                  >
                    {ticket.priority === 'urgent' ? 'ACİL' : 'YÜKSEK'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/affexai/admin/support">
            Tüm Talepler <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
