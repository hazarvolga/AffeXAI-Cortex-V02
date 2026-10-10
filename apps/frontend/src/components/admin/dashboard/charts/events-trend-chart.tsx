'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { eventsService } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendData {
  date: string;
  participants: number | null;
  events: number;
}

export function EventsTrendChart() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const allEvents = await eventsService.getAll().catch(() => []);

      // Generate trend data from real events
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const trendData: TrendData[] = last7Days.map((date, index) => {
        const dayEvents = allEvents.filter(e => {
          const eventDate = new Date(e.startDate);
          return eventDate.toDateString() === date.toDateString();
        });

        // The list endpoint does not return registration counts. Unknown is not zero.
        const participants = null;

        return {
          date: index === 6 ? 'Bugün' : date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
          participants: participants,
          events: dayEvents.length,
        };
      });

      setData(trendData);


    } catch (error) {
      console.error('Error loading events trend data:', error);
      // Fallback to empty data on error
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold mb-1">{payload[0].payload.date}</p>
          {payload.map((entry: { dataKey: string; name: string; value: number }) => (
            <p key={entry.dataKey} className="text-xs text-purple-600">
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Etkinlik Trendi
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Etkinlik Trendi
          </CardTitle>

        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Son 7 günün etkinlikleri. Katılımcı verisi henüz sağlanmıyor.
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="participants"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              name="Katılımcı"
              dot={{ fill: 'hsl(217, 91%, 60%)', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
            <Line
              type="monotone"
              dataKey="events"
              stroke="hsl(271, 91%, 65%)"
              strokeWidth={2}
              name="Etkinlik"
              dot={{ fill: 'hsl(271, 91%, 65%)', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/affexai/admin/events">
            Detaylı Analiz <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
