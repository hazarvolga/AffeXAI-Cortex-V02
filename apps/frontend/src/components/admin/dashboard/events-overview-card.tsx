'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowUpRight, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { eventsService } from "@/lib/api";
import type { Event, EventDashboardStats } from "@/lib/api/eventsService";

export function EventsOverviewCard() {
  const [stats, setStats] = useState<EventDashboardStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, allEvents] = await Promise.all([
        eventsService.getDashboardStats(),
        eventsService.getAll().catch(() => []),
      ]);

      setStats(statsData);
      const upcoming = allEvents.filter(e => new Date(e.startDate) >= new Date());
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Error loading events data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextEvent = upcomingEvents[0];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Etkinlikler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Etkinlikler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">{stats?.upcomingEvents || 0}</p>
            <p className="text-xs text-muted-foreground">Yaklaşan Etkinlik</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.totalParticipants || 0}</p>
            <p className="text-xs text-muted-foreground">Toplam Katılımcı</p>
          </div>
        </div>

        {nextEvent && (
          <div className="border-t pt-4">
            <p className="text-sm font-semibold">{nextEvent.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(nextEvent.startDate).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/admin/events">
            Tümünü Gör <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
