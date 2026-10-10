"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { AiCoPilot } from '@/components/brand/ai/AiCoPilot';
import { EventModuleNav } from "@/components/admin/events/EventModuleNav";

import { BccHudTile } from "@/components/brand/BccHudTile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    PlusCircle,
    Search,
    Calendar,
    Ticket,
    Users,
    TrendingUp,
    Trash2,
    BarChart2,
    FileUp
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import eventsService from "@/lib/api/eventsService";
import { EventWithUIData, EventDashboardStats } from '@affexai/shared-types';
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const EventTable = ({
    eventsToShow,
    onDelete,
    tenant
}: {
    eventsToShow: EventWithUIData[];
    onDelete: (id: string) => void;
    tenant: string;
}) => {
    if (eventsToShow.length === 0) {
        return <div className="text-center text-white/40 py-12 font-mono uppercase tracking-widest text-[10px]">No Active Deployments Found</div>
    }

    return (
        <Table>
            <TableHeader className="border-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Ident / Name</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Status</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Temporal Node</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Locus</TableHead>
                    <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px] font-bold">Resonance / Capacity</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Ops</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {eventsToShow.map(event => {
                    const eventDate = new Date(event.startDate);
                    const isPast = eventDate < new Date();
                    const ticketsSold = event.attendees?.length || 0;
                    const capacity = event.capacity || 150;
                    const progress = (ticketsSold / capacity) * 100;

                    return (
                        <TableRow key={event.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                            <TableCell className="py-4">
                                <div className="text-white font-medium mb-1 uppercase tracking-tight">{event.title}</div>
                                <div className="text-[9px] text-[#ff8c00]/60 font-mono uppercase tracking-widest">{event.category || 'Event_Core'}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn(
                                    "rounded-none border-white/10 uppercase text-[8px] tracking-widest px-2 py-0.5",
                                    !isPast ? "bg-[#9df425]/10 text-[#9df425] border-[#9df425]/20" : "text-white/40"
                                )}>
                                    {isPast ? 'Finalized' : 'Active'}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-white/60">{eventDate.toLocaleDateString('tr-TR')}</TableCell>
                            <TableCell className="text-white/60 uppercase text-[10px] tracking-tight">{event.isOnline ? "Virtual_Node" : (event.city || event.location)}</TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1.5 w-32">
                                    <Progress value={progress} className="h-0.5 bg-white/5 rounded-none" />
                                    <div className="flex justify-between text-[8px] font-mono tracking-widest text-white/40 uppercase">
                                        <span>{ticketsSold} units</span>
                                        <span>{capacity} cap</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-1 font-mono text-[9px] uppercase tracking-tighter">
                                    <Link
                                        href={`/${tenant}/admin/events/${event.slug || event.id}/control`}
                                        className="px-2 py-1 bg-white/5 border border-white/5 hover:border-[#ff8c00]/40 hover:text-[#ff8c00] transition-all"
                                    >
                                        CMD
                                    </Link>
                                    <Link
                                        href={`/${tenant}/admin/events/${event.slug || event.id}`}
                                        className="px-2 py-1 bg-white/5 border border-white/5 hover:border-[#ff8c00]/40 hover:text-[#ff8c00] transition-all"
                                    >
                                        MOD
                                    </Link>
                                    <button
                                        className="px-2 py-1 bg-white/5 border border-white/5 hover:border-[#9df425]/40 hover:text-[#9df425] transition-all"
                                    >
                                        TEL
                                    </button>
                                    <button
                                        onClick={() => onDelete(event.id)}
                                        className="px-2 py-1 bg-white/5 border border-white/5 hover:border-red-500/40 hover:text-red-500 transition-all"
                                    >
                                        PURGE
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )

}

export default function TenantEventsDashboard() {
    const params = useParams();
    const tenant = params?.tenant as string || "default";
    const router = useRouter();
    const { toast } = useToast();

    const [events, setEvents] = useState<EventWithUIData[]>([]);
    const [stats, setStats] = useState<EventDashboardStats>({
        upcomingEvents: 0,
        totalTicketSales: 0,
        totalParticipants: 0,
        monthlyRevenue: 0,
        revenueChange: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const backendEvents = await eventsService.getAll();
                const frontendEvents: EventWithUIData[] = backendEvents.map(event => ({
                    ...event,
                    imageUrl: 'https://picsum.photos/seed/event1/800/450',
                    isFavorite: false,
                    category: event.metadata?.category || 'General',
                    isOnline: event.metadata?.isOnline || false,
                    ticketTypes: event.metadata?.ticketTypes || [],
                    city: 'İstanbul',
                    country: 'Türkiye',
                }));
                setEvents(frontendEvents);

                const dashboardStats = await eventsService.getStats();
                setStats(dashboardStats);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching event telemetry:', err);
                setError('Failed to synchronize with Event Core.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDeleteClick = (id: string) => {
        setEventToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!eventToDelete) return;
        setDeleting(true);
        try {
            await eventsService.delete(eventToDelete);
            setEvents(events.filter(e => e.id !== eventToDelete));
            toast({ title: "Operation Successful", description: "Node purged from registry." });
            setDeleteDialogOpen(false);
            setEventToDelete(null);
        } catch (error) {
            toast({ title: "Sync Failure", description: "Critical error during purge operation.", variant: "destructive" });
        } finally {
            setDeleting(false);
        }
    };

    const upcomingEvents = events.filter(e => new Date(e.startDate) >= new Date());
    const pastEvents = events.filter(e => new Date(e.startDate) < new Date());

    return (
        <BccEditorialWrapper
            headerTitle="Event Logistics"
            headerSubtitle={`Orchestrating temporal clusters for tenant: ${tenant.toUpperCase()}`}
            headerBadge="Quantum Registry"
            moduleNav={<EventModuleNav />}
            telemetryData={[
                { label: "Active Nodes", value: stats.upcomingEvents.toString(), color: "#9df425" },
                { label: "Resonance Index", value: (stats.revenueChange || 0).toString(), suffix: "%", color: "#ff8c00" }
            ]}
        >
            <div className="space-y-12 animate-in fade-in duration-1000">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            className="bg-white/5 border-white/10 rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-[#ff8c00] hover:text-black transition-all h-10 px-6"
                        >
                            <FileUp className="mr-2 h-3.5 w-3.5" />
                            Import Registry
                        </Button>
                        <Button
                            asChild
                            className="bg-[#ff8c00] text-black rounded-none text-[10px] uppercase tracking-widest font-bold hover:bg-[#ff8c00]/80 transition-all h-10 px-6"
                        >
                            <Link href={`/${tenant}/admin/events/new`}>
                                <PlusCircle className="mr-2 h-3.5 w-3.5" />
                                Deploy New Node
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <BccHudTile title="Temporal Count" subtitle="Upcoming Events" icon="schedule">
                        <div className="text-3xl font-light tracking-tighter text-white">{stats.upcomingEvents}</div>
                    </BccHudTile>
                    <BccHudTile title="Unit Circulation" subtitle="Total Tickets" icon="confirmation_number">
                        <div className="text-3xl font-light tracking-tighter text-white">{(stats.totalTicketSales || 0).toLocaleString()}</div>
                    </BccHudTile>
                    <BccHudTile title="Node Density" subtitle="Participants" icon="groups">
                        <div className="text-3xl font-light tracking-tighter text-white">{(stats.totalParticipants || 0).toLocaleString()}</div>
                    </BccHudTile>
                    <BccHudTile title="Monetary Flux" subtitle="Monthly Revenue" icon="monetization_on">
                        <div className="text-3xl font-light tracking-tighter text-white">₺{(stats.monthlyRevenue || 0).toLocaleString()}</div>
                    </BccHudTile>
                </div>

                {/* Main Content Area */}
                <BccHudTile
                    className="col-span-full"
                    title="Registry Management"
                    subtitle="Live overview of temporal clusters"
                    headerAction={
                        <div className="relative w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 group-hover:text-[#ff8c00] transition-colors" />
                            <Input
                                placeholder="NODE SEARCH..."
                                className="bg-white/5 border-white/10 rounded-none h-8 pl-9 text-[10px] uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-[#ff8c00] transition-all"
                            />
                        </div>
                    }
                >
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="bg-transparent border-b border-white/5 rounded-none h-12 p-0 w-full justify-start space-x-8 mb-8">
                            <TabsTrigger value="all" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8c00] data-[state=active]:bg-transparent text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 data-[state=active]:text-white h-full px-4 transition-all">All Nodes</TabsTrigger>
                            <TabsTrigger value="upcoming" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8c00] data-[state=active]:bg-transparent text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 data-[state=active]:text-white h-full px-4 transition-all">Active</TabsTrigger>
                            <TabsTrigger value="past" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8c00] data-[state=active]:bg-transparent text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 data-[state=active]:text-white h-full px-4 transition-all">Finalized</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-0">
                            <EventTable eventsToShow={events} onDelete={handleDeleteClick} tenant={tenant} />
                        </TabsContent>
                        <TabsContent value="upcoming" className="mt-0">
                            <EventTable eventsToShow={upcomingEvents} onDelete={handleDeleteClick} tenant={tenant} />
                        </TabsContent>
                        <TabsContent value="past" className="mt-0">
                            <EventTable eventsToShow={pastEvents} onDelete={handleDeleteClick} tenant={tenant} />
                        </TabsContent>
                    </Tabs>
                </BccHudTile>

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={handleDeleteConfirm}
                    title="Purge Sequence Initiated"
                    description="Are you sure you want to permanently remove this node from the registry? This action is irreversible."
                    confirmText="PURGE"
                    cancelText="ABORT"
                    loading={deleting}
                    variant="destructive"
                />
            </div>
            {/* Neural Grid Synapse */}
            <AiCoPilot context="event_logistics" />
        </BccEditorialWrapper>

    );
}
