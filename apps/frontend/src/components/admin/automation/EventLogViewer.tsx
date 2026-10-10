'use client';

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
import { BccHudTile } from '@/components/brand/BccHudTile';
import { RefreshCw, Search, Filter, Activity, Clock, Zap, Cpu, SearchCode, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { integrationService } from '@/lib/api/integrationService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PlatformEvent {
  id: string;
  source: string;
  eventType: string;
  payload: Record<string, any>;
  triggeredRules: string[];
  metadata?: Record<string, any>;
  createdAt: string;
}

const sourceLabels: Record<string, string> = {
  events: 'ETKİNLİK_ENGINE',
  'email-marketing': 'EP_MATRİSİ',
  cms: 'CMS_NODES',
  certificates: 'CERT_SIGNAL',
  media: 'MEDYA_STREAM',
};

const sourceColors: Record<string, string> = {
  events: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
  'email-marketing': 'text-purple-400 border-purple-400/20 bg-purple-400/5',
  cms: 'text-green-400 border-green-400/20 bg-green-400/5',
  certificates: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
  media: 'text-pink-400 border-pink-400/20 bg-pink-400/5',
};

export default function EventLogViewer() {
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvents();
  }, [selectedSource]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      let data: PlatformEvent[];

      if (selectedSource === 'all') {
        data = await integrationService.getEvents(100);
      } else {
        data = await integrationService.getEventsBySource(
          selectedSource as any,
          100
        );
      }

      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Olay spektrumu senkronize edilemedi');
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    try {
      setRefreshing(true);
      await loadEvents();
      toast.success('System_Resonant: Olaylar güncellendi');
    } catch (error) {
      // Handled in loadEvents
    } finally {
      setRefreshing(false);
    }
  };

  const filteredEvents = events?.filter(event => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      event.eventType.toLowerCase().includes(search) ||
      event.source.toLowerCase().includes(search) ||
      JSON.stringify(event.payload).toLowerCase().includes(search)
    );
  }) || [];

  const eventsWithAutomation = events?.filter(e => e.triggeredRules.length > 0) || [];

  return (
    <div className="space-y-6">
      {/* HUD Matrix */}
      <div className="grid gap-4 md:grid-cols-3">
        <BccHudTile title="TOTAL_TELEMETRY" subtitle="Event Counter" icon={Activity} accentColor="rgba(255,255,255,0.4)">
          <div className="text-3xl font-mono tracking-tighter text-white/40">{events?.length || 0}</div>
        </BccHudTile>

        <BccHudTile title="TRIGGER_RESONANCE" subtitle="Automation Linked" icon={Zap} accentColor="#ff8c00">
          <div className="text-3xl font-mono tracking-tighter text-[#ff8c00]">{eventsWithAutomation?.length || 0}</div>
        </BccHudTile>

        <BccHudTile title="LAST_NEURAL_PULSE" subtitle="Active Signal" icon={Clock} accentColor="#9df425">
          <div className="text-2xl font-mono tracking-tighter text-[#9df425]">
            {(events?.length || 0) > 0 && events?.[0]
              ? new Date(events[0].createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'NULL_STATE'
            }
          </div>
        </BccHudTile>
      </div>

      {/* Filters & Control Mesh */}
      <Card className="bg-black/40 border-white/5 backdrop-blur-sm rounded-none bcc-glass overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#9df425]" />
        <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/80">Neural_Process_Matrix</CardTitle>
              <CardDescription className="text-white/40 text-[10px] font-mono mt-1 uppercase tracking-widest leading-relaxed">
                Platform genelindeki tüm neural olay akışı ve spektrum analizi
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshEvents}
              disabled={refreshing}
              className="h-8 border-white/10 bg-transparent text-white/60 hover:bg-white/5 hover:text-white rounded-none text-[10px] font-mono uppercase tracking-widest"
            >
              <RefreshCw className={cn("h-3 w-3 mr-2", refreshing && "animate-spin")} />
              Sync_Stream
            </Button>
          </div>

          <div className="flex gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
              <Input
                placeholder="SEARCH_SIGNAL_PATTERN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-black/50 border-white/5 rounded-none text-white/60 font-mono text-[11px] placeholder:text-white/10 focus-visible:ring-white/5"
              />
            </div>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[220px] h-9 bg-black/50 border-white/5 rounded-none text-white/40 font-mono text-[10px] uppercase tracking-widest focus:ring-white/5">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue placeholder="SOURCE_FILTER" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-none text-white/60 font-mono">
                <SelectItem value="all" className="text-[10px] uppercase">:: ALL_SIGNAL_SOURCES</SelectItem>
                <SelectItem value="events" className="text-[10px] uppercase">:: ETKİNLİK_ENGINE</SelectItem>
                <SelectItem value="email-marketing" className="text-[10px] uppercase">:: EP_MATRİSİ</SelectItem>
                <SelectItem value="cms" className="text-[10px] uppercase">:: CMS_NODES</SelectItem>
                <SelectItem value="certificates" className="text-[10px] uppercase">:: CERT_SIGNAL</SelectItem>
                <SelectItem value="media" className="text-[10px] uppercase">:: MEDYA_STREAM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-[#9df425]/20 border-t-[#9df425] rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-[#9df425] animate-pulse uppercase tracking-[0.4em]">Decoding_Neural_Stream...</span>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 relative">
                <Cpu className="h-8 w-8 text-white/10" />
              </div>
              <p className="text-[12px] font-mono text-white/60 uppercase tracking-[0.3em]">Neural_Silence</p>
              <p className="text-[10px] font-mono text-white/30 mt-2 uppercase tracking-widest">Hiçbir olay sinyali yakalanamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.02] border-b border-white/5">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="w-[180px] text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10">TS_SIGNAL</TableHead>
                    <TableHead className="w-[150px] text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10">SOURCE_NODE</TableHead>
                    <TableHead className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10">ACTION_TYPE</TableHead>
                    <TableHead className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10">PAYLOAD_JSON</TableHead>
                    <TableHead className="w-[120px] text-right text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10">RESONANCE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                      <TableCell className="font-mono text-[10px] text-white/40 group-hover:text-white/60 transition-colors py-3">
                        {new Date(event.createdAt).toLocaleString('tr-TR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        }).toUpperCase()}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={cn("rounded-none border text-[9px] font-mono tracking-widest px-2 py-0.5 uppercase", sourceColors[event.source] || 'text-white/40 border-white/10 bg-white/5')}>
                          {sourceLabels[event.source] || event.source.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-white/80 group-hover:text-[#9df425] transition-colors uppercase tracking-widest">{event.eventType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs py-3">
                        <div className="truncate font-mono text-[10px] text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-tight">
                          {JSON.stringify(event.payload)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        {event.triggeredRules.length > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#ff8c00]/10 border border-[#ff8c00]/20 text-[#ff8c00] text-[9px] font-mono tracking-widest uppercase">
                            <Zap className="h-2.5 w-2.5" />
                            {event.triggeredRules.length}_LINKS
                          </div>
                        ) : (
                          <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest">NO_LINK</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {/* Matrix Footer */}
        <div className="border-t border-white/5 bg-white/[0.01] p-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] font-mono text-white/20 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Database className="w-2.5 h-2.5" /> DB_STATUS: HYDRATED</span>
            <span className="flex items-center gap-1.5"><SearchCode className="w-2.5 h-2.5" /> LOG_RETAIN: 30D</span>
          </div>
          <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
            PAGE_SIGNAL: 1_OF_10
          </div>
        </div>
      </Card>
    </div>
  );
}
