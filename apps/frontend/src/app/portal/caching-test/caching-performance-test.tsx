'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Mail } from "lucide-react";
import usersService, { User } from '@/lib/api/usersService';
import eventsService, { Event } from '@/lib/api/eventsService';
import emailCampaignsService, { EmailCampaign } from '@/lib/api/emailCampaignsService';

export default function CachingPerformanceTest() {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    users: false,
    events: false,
    campaigns: false
  });
  const [timestamps, setTimestamps] = useState<{ [key: string]: number }>({
    users: 0,
    events: 0,
    campaigns: 0
  });

  const fetchUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    const startTime = Date.now();
    try {
      const data = await usersService.getAll();
      setUsers(data);
      setTimestamps(prev => ({ ...prev, users: Date.now() - startTime }));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchEvents = async () => {
    setLoading(prev => ({ ...prev, events: true }));
    const startTime = Date.now();
    try {
      const data = await eventsService.getAll();
      setEvents(data);
      setTimestamps(prev => ({ ...prev, events: Date.now() - startTime }));
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  };

  const fetchCampaigns = async () => {
    setLoading(prev => ({ ...prev, campaigns: true }));
    const startTime = Date.now();
    try {
      const data = await emailCampaignsService.getAll();
      setCampaigns(data);
      setTimestamps(prev => ({ ...prev, campaigns: Date.now() - startTime }));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchUsers();
    fetchEvents();
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Service</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {timestamps.users > 0 ? `Response time: ${timestamps.users}ms` : 'No data yet'}
            </p>
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={fetchUsers} 
                disabled={loading.users}
                size="sm"
              >
                {loading.users ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch Users'
                )}
              </Button>
              <Badge variant={timestamps.users > 50 ? "destructive" : "default"}>
                {timestamps.users > 50 ? "Slow" : "Fast"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Events Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Service</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              {timestamps.events > 0 ? `Response time: ${timestamps.events}ms` : 'No data yet'}
            </p>
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={fetchEvents} 
                disabled={loading.events}
                size="sm"
              >
                {loading.events ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch Events'
                )}
              </Button>
              <Badge variant={timestamps.events > 50 ? "destructive" : "default"}>
                {timestamps.events > 50 ? "Slow" : "Fast"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Email Campaigns Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {timestamps.campaigns > 0 ? `Response time: ${timestamps.campaigns}ms` : 'No data yet'}
            </p>
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={fetchCampaigns} 
                disabled={loading.campaigns}
                size="sm"
              >
                {loading.campaigns ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch Campaigns'
                )}
              </Button>
              <Badge variant={timestamps.campaigns > 50 ? "destructive" : "default"}>
                {timestamps.campaigns > 50 ? "Slow" : "Fast"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Caching Test Instructions</CardTitle>
          <CardDescription>
            How to test the caching performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">First Load (No Cache)</h3>
            <p className="text-sm text-muted-foreground">
              The first time you fetch data, it will be slower as it's coming directly from the database.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Subsequent Loads (With Cache)</h3>
            <p className="text-sm text-muted-foreground">
              After the first load, subsequent requests should be faster as they're served from the cache.
              The cache has a TTL of 30-60 seconds depending on the data type.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Cache Invalidation</h3>
            <p className="text-sm text-muted-foreground">
              When you create, update, or delete data, the cache is automatically invalidated to ensure data consistency.
            </p>
          </div>
          <div className="pt-4">
            <Button onClick={() => {
              fetchUsers();
              fetchEvents();
              fetchCampaigns();
            }}>
              Refresh All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}