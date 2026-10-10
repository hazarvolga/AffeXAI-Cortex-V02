"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { EventModuleNav } from "@/components/admin/events/EventModuleNav";
import { BccHudTile } from "@/components/brand/BccHudTile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Users,
    Mail,
    Award,
    BarChart3,
    Send,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    UserPlus,
    RefreshCw,
    Search,
    ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import eventsService from "@/lib/api/eventsService";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function EventCommandCenter() {
    const params = useParams();
    const tenant = params?.tenant as string || "default";
    const slug = params?.slug as string;
    const router = useRouter();
    const { toast } = useToast();

    const [event, setEvent] = useState<any>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchEventData = async () => {
            try {
                setLoading(true);
                const data = await eventsService.findOne(slug);
                setEvent(data);

                // Fetch registrations separately
                const regs = await eventsService.getRegistrations(data.id);
                setRegistrations(regs as any[]);

                // Try fetching certificate stats
                try {
                    const certStats = await eventsService.getCertificateStats(data.id);
                    setStats(certStats);
                } catch (e) {
                    console.log("Certificate stats not available yet");
                }
            } catch (err) {
                toast({ title: "Sync Error", description: "Failed to load node telemetry.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchEventData();
    }, [slug]);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newParticipant, setNewParticipant] = useState({ name: "", email: "" });

    const fetchRegistrations = async () => {
        try {
            const regs = await eventsService.getRegistrations(event?.id || slug);
            setRegistrations(regs as any[]);
        } catch (err) {
            console.error("Failed to refresh registry");
        }
    };

    const handleUpdateStatus = async (regId: string, newStatus: string) => {
        try {
            await eventsService.updateRegistrationStatus(regId, newStatus);
            setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: newStatus } : r));
            toast({ title: "State Synchronized", description: `Participant status updated to ${newStatus.toUpperCase()}.` });
        } catch (err) {
            toast({ title: "Status Update Failed", description: "Failed to synchronize state with registry.", variant: "destructive" });
        }
    };

    const handleSendReminder = async () => {
        try {
            toast({ title: "Comms Sequence Initiated", description: "Queuing mass reminders for all confirmed units..." });
            const response = await eventsService.sendBulkReminder(event?.id || slug) as any;
            toast({ title: "Transmission Success", description: `Dispatched ${response.sentCount} signals to the cluster.` });
        } catch (err) {
            toast({ title: "Transmission Failed", description: "Terminal error during broadcast sequence.", variant: "destructive" });
        }
    };

    const handleGenerateCertificates = async () => {
        try {
            toast({ title: "Award Engine Activated", description: "Initiating bulk generation sequence..." });
            await eventsService.generateCertificates(event?.id || slug, {});
            toast({ title: "Cycle Complete", description: "All eligible units have been processed." });
            fetchRegistrations();
        } catch (err) {
            toast({ title: "Engine Failure", description: "Certificate generation interrupted.", variant: "destructive" });
        }
    };

    const handleAddParticipant = async () => {
        if (!newParticipant.name || !newParticipant.email) return;
        try {
            await eventsService.register(event?.id || slug, newParticipant);
            toast({ title: "Identity Deployed", description: "New unit added to node registry." });
            setNewParticipant({ name: "", email: "" });
            setIsAddDialogOpen(false);
            fetchRegistrations();
        } catch (err) {
            toast({ title: "Deployment Error", description: "Failed to register new identity.", variant: "destructive" });
        }
    };

    const filteredParticipants = registrations.filter(p =>
        p.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.guestEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#080808] text-[#ff8c00] font-mono uppercase tracking-[0.3em]">Synchronizing Telemetry...</div>;

    return (
        <BccEditorialWrapper
            headerTitle="Command Hub"
            headerSubtitle={`Operational management of node registry: ${slug}`}
            headerBadge="Live Operations"
            moduleNav={<EventModuleNav />}
            telemetryData={[
                { label: "Stability", value: "98.2", suffix: "%", color: "#9df425" },
                { label: "Sync Latency", value: "24", suffix: "ms", color: "#ff8c00" }
            ]}
        >
            <div className="space-y-8 animate-in fade-in duration-1000">
                {/* Back Link */}
                <Link href={`/${tenant}/admin/events`} className="inline-flex items-center text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-[#ff8c00] transition-colors group">
                    <ChevronLeft size={14} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back to Registry
                </Link>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <BccHudTile title="Node Occupancy" subtitle="Participant Density" icon="groups">
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-light tabular-nums">{registrations.length}</span>
                            <span className="text-white/20 text-[10px] pb-1 uppercase tracking-widest">/ {event?.capacity || 100} units</span>
                        </div>
                        <Progress value={(registrations.length / (event?.capacity || 100)) * 100} className="h-0.5 mt-4 bg-white/5" />
                    </BccHudTile>

                    <BccHudTile title="Comms Status" subtitle="Transmission Success" icon="sensors">
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-light tabular-nums">100</span>
                            <span className="text-[#9df425] text-xs pb-1 uppercase tracking-widest font-bold">Optimal</span>
                        </div>
                        <div className="text-[9px] text-white/40 mt-4 uppercase tracking-widest font-mono">Last Sync: Just Now</div>
                    </BccHudTile>

                    <BccHudTile title="Award Engine" subtitle="Certificate Readiness" icon="verified">
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-light tabular-nums">{stats?.generatedCount || 0}</span>
                            <Badge variant="outline" className="rounded-none border-[#9df425]/20 text-[#9df425] bg-[#9df425]/5 text-[8px] tracking-[0.2em]">{event?.grantsCertificate ? 'ENABLED' : 'DISABLED'}</Badge>
                        </div>
                        <div className="text-[9px] text-white/40 mt-4 uppercase tracking-widest font-mono">Template: {event?.certificateConfig?.templateId || 'None'}</div>
                    </BccHudTile>
                </div>

                {/* Operation Tabs */}
                <BccHudTile className="p-0">
                    <Tabs defaultValue="participants" className="w-full">
                        <div className="px-8 pt-6 border-b border-white/5">
                            <TabsList className="bg-transparent h-12 p-0 w-full justify-start space-x-12">
                                <TabsTrigger value="participants" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8c00] data-[state=active]:bg-transparent text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 data-[state=active]:text-white h-full px-0 transition-all">
                                    <Users size={12} className="mr-2" /> Participant Base
                                </TabsTrigger>
                                <TabsTrigger value="comms" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8c00] data-[state=active]:bg-transparent text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 data-[state=active]:text-white h-full px-0 transition-all">
                                    <Mail size={12} className="mr-2" /> Comms Center
                                </TabsTrigger>
                                <TabsTrigger value="awards" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8c00] data-[state=active]:bg-transparent text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 data-[state=active]:text-white h-full px-0 transition-all">
                                    <Award size={12} className="mr-2" /> Award Telemetry
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* PARTICIPANTS TAB */}
                        <TabsContent value="participants" className="m-0 p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="relative w-64 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 group-focus-within:text-[#ff8c00] transition-colors" />
                                    <Input
                                        placeholder="SEARCH IDENTITY..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-white/5 border-white/5 rounded-none h-8 pl-9 text-[10px] uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-[#ff8c00]"
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <Button variant="outline" className="rounded-none border-white/10 text-[9px] uppercase tracking-widest h-8 px-4"><Download size={12} className="mr-2" /> Export</Button>

                                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="rounded-none bg-[#ff8c00] text-black hover:bg-[#ff8c00]/80 text-[9px] uppercase tracking-widest h-8 px-4 font-bold"><UserPlus size={12} className="mr-2" /> Add Participant</Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-[#0f0f0f] border-white/10 rounded-none text-white font-mono uppercase">
                                            <DialogHeader>
                                                <DialogTitle className="text-xs tracking-[0.2em] font-bold">Manual Identity Deployment</DialogTitle>
                                                <DialogDescription className="text-[10px] text-white/40 tracking-widest mt-2 uppercase">Input identity parameters for registry override.</DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] tracking-widest opacity-50">FULL_NAME</Label>
                                                    <Input value={newParticipant.name} onChange={e => setNewParticipant(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" className="bg-white/5 border-white/5 rounded-none text-xs focus-visible:ring-1 focus-visible:ring-[#ff8c00]" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] tracking-widest opacity-50">EMAIL_ADDRESS</Label>
                                                    <Input type="email" value={newParticipant.email} onChange={e => setNewParticipant(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" className="bg-white/5 border-white/5 rounded-none text-xs focus-visible:ring-1 focus-visible:ring-[#ff8c00]" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" className="rounded-none border-white/10 text-[10px]" onClick={() => setIsAddDialogOpen(false)}>CANCEL</Button>
                                                <Button type="submit" className="rounded-none bg-[#ff8c00] text-black hover:bg-[#ff8c00]/80 text-[10px] font-bold" onClick={handleAddParticipant}>CONFIRM_DEPLOYMENT</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            <Table>
                                <TableHeader className="border-white/5 bg-white/[0.02]">
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px]">Identity</TableHead>
                                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px]">Role / Status</TableHead>
                                        <TableHead className="text-white/40 uppercase tracking-[0.2em] text-[9px]">Check-in State</TableHead>
                                        <TableHead className="text-right text-white/40 uppercase tracking-[0.2em] text-[9px]">Ops</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredParticipants.length > 0 ? filteredParticipants.map((at: any) => (
                                        <TableRow key={at.id} className="border-white/5 hover:bg-white/[0.01]">
                                            <TableCell className="py-4">
                                                <div className="text-white font-medium text-xs uppercase tracking-tight">{at.guestName}</div>
                                                <div className="text-[9px] text-white/40 font-mono">{at.guestEmail}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    onClick={() => handleUpdateStatus(at.id, at.status === 'confirmed' ? 'pending' : 'confirmed')}
                                                    variant="outline"
                                                    className={cn(
                                                        "rounded-none cursor-pointer transition-all px-2 py-0.5 text-[8px] tracking-widest",
                                                        at.status === 'confirmed' ? "border-[#9df425]/40 text-[#9df425]" : "border-[#ff8c00]/40 text-[#ff8c00]"
                                                    )}
                                                >
                                                    {at.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2 text-[10px] text-white/60">
                                                    {at.checkedInAt ? (
                                                        <>
                                                            <CheckCircle2 size={10} className="text-[#9df425]" />
                                                            <span className="font-mono text-[#9df425]">SYNC_COMPLETE</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock size={10} className="text-[#ff8c00]" />
                                                            <span className="font-mono">PENDING_SIGNAL</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-white/20 hover:text-white"
                                                    onClick={() => {
                                                        if (at.paymentDetails) {
                                                            alert(JSON.stringify(at.paymentDetails, null, 2));
                                                        } else {
                                                            toast({ title: "No Data", description: "Zero payment telemetry available for this unit." });
                                                        }
                                                    }}
                                                >
                                                    <AlertCircle size={14} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-white/20 uppercase tracking-widest text-[10px] font-mono">Zero participants registered.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        {/* COMMS TAB */}
                        <TabsContent value="comms" className="m-0 p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="border-l-2 border-[#ff8c00] pl-4">
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em]">Automatic Sequences</h4>
                                        <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">Configure automated telemetry transmission.</p>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: "Welcome Protocol", sub: "Sent upon registration", status: "Active" },
                                            { label: "24h Reminder Pulse", sub: "Dispatched T-24h", status: "Active" },
                                            { label: "Post-Exit Feedback", sub: "Sent T+2h after end", status: "Inactive" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-colors">
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest">{item.label}</div>
                                                    <div className="text-[9px] text-white/40 uppercase tracking-widest font-mono mt-1">{item.sub}</div>
                                                </div>
                                                <Badge variant="outline" className={cn("rounded-none text-[8px] tracking-widest", item.status === "Active" ? "border-[#9df425]/20 text-[#9df425]" : "border-white/10 text-white/20")}>{item.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="border-l-2 border-[#ff8c00] pl-4">
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em]">Manual Overrides</h4>
                                        <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">Directly trigger mass cluster transmissions.</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Button onClick={handleSendReminder} variant="outline" className="justify-start rounded-none border-white/5 bg-white/[0.02] hover:bg-[#ff8c00] hover:text-black transition-all h-14 group">
                                            <Send size={16} className="mr-4 text-white/40 group-hover:text-black" />
                                            <div className="text-left">
                                                <div className="text-[10px] font-bold uppercase tracking-widest underline decoration-[#ff8c00]/40">Trigger Manual Reminder</div>
                                                <div className="text-[8px] text-white/20 group-hover:text-black/60 uppercase tracking-widest mt-0.5">Send immediate notification to all identities</div>
                                            </div>
                                        </Button>
                                        <Button variant="outline" className="justify-start rounded-none border-white/5 bg-white/[0.02] hover:bg-[#9df425] hover:text-black transition-all h-14 group">
                                            <RefreshCw size={16} className="mr-4 text-white/40 group-hover:text-black" />
                                            <div className="text-left">
                                                <div className="text-[10px] font-bold uppercase tracking-widest underline decoration-[#9df425]/40 text-inherit">Dispatch State Update</div>
                                                <div className="text-[8px] text-white/20 group-hover:text-black/60 uppercase tracking-widest mt-0.5">Alert cluster of recent registry changes</div>
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* AWARDS TAB */}
                        <TabsContent value="awards" className="m-0 p-8 space-y-8">
                            {!event?.grantsCertificate ? (
                                <div className="py-20 flex flex-col items-center justify-center space-y-4 border border-dashed border-white/5 bg-white/[0.01]">
                                    <AlertCircle size={32} className="text-white/10" />
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Award Engine Offline</div>
                                        <p className="text-[9px] text-white/20 uppercase tracking-widest mt-2">Certificates are not enabled for this temporal node.</p>
                                    </div>
                                    <Button variant="outline" className="rounded-none border-white/10 text-[9px] uppercase tracking-widest mt-4 h-8 px-6 hover:bg-white/5">Modify Config</Button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="p-4 border border-white/5 bg-white/[0.02]">
                                            <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Generated</div>
                                            <div className="text-2xl font-mono">{stats?.generatedCount || 0}</div>
                                        </div>
                                        <div className="p-4 border border-white/5 bg-white/[0.02]">
                                            <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Sent</div>
                                            <div className="text-2xl font-mono">{stats?.sentCount || 0}</div>
                                        </div>
                                        <div className="p-4 border border-white/5 bg-white/[0.02]">
                                            <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Failures</div>
                                            <div className="text-2xl font-mono text-red-500">0</div>
                                        </div>
                                        <div className="flex items-center">
                                            <Button onClick={handleGenerateCertificates} className="w-full rounded-none bg-[#9df425] text-black hover:bg-[#9df425]/80 text-[10px] font-bold uppercase tracking-widest h-full">Execute Bulk Generation</Button>
                                        </div>
                                    </div>

                                    <div className="border border-white/5 overflow-hidden">
                                        <div className="p-4 bg-white/[0.05] border-b border-white/5 text-[9px] font-bold uppercase tracking-[0.3em]">Award Deployment History</div>
                                        <div className="h-64 flex items-center justify-center text-white/20 text-[9px] uppercase tracking-widest font-mono">No award cycles detected in history.</div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </BccHudTile>
            </div>
        </BccEditorialWrapper>
    );
}
