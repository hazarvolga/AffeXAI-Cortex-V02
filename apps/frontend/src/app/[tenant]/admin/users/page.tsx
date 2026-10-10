'use client';

import React, { useEffect, useState } from 'react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { UserManagementService, User, UserStats } from '@/services/user-management.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Search,
    UserPlus,
    MoreHorizontal,
    Mail,
    Shield,
    Activity,
    UserCheck,
    UserX,
    RefreshCw,
    Filter
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';
import { useParams, useRouter } from 'next/navigation';

export default function UsersPage() {
    const router = useRouter();
    const { tenant } = useParams<{ tenant: string }>();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { isAdmin, isLoading: permissionsLoading } = usePermissions();

    useEffect(() => {
        if (permissionsLoading) return;
        if (!isAdmin) {
            setIsLoading(false);
            return;
        }
        void loadData();
        // loadData intentionally reruns only when resolved administrator authority changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, permissionsLoading]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersData, statsData] = await Promise.all([
                UserManagementService.getUsers({ search: searchQuery }),
                UserManagementService.getStats()
            ]);

            setUsers(usersData.items);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load registry:', error);
            toast({
                title: 'Sync Error',
                description: 'Failed to synchronize user registry.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (userId: string, action: 'activate' | 'deactivate') => {
        try {
            // Optimistic update
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: action === 'activate' ? 'active' : 'disabled' } : u));
            await UserManagementService.toggleUserStatus(userId);
            toast({ title: 'Status Updated', description: `User ${action}d successfully.` });
        } catch (e) {
            loadData(); // Revert
            toast({ title: 'Update Failed', variant: 'destructive' });
        }
    };

    if (!permissionsLoading && !isAdmin) {
        return (
            <BccEditorialWrapper
                headerTitle="User Registry"
                headerSubtitle="Identity Management // Restricted"
                headerBadge="Admin Only"
            >
                <div className="border border-white/10 bg-white/[0.02] p-8 text-sm text-white/60">
                    User directory access is restricted to organization administrators.
                </div>
            </BccEditorialWrapper>
        );
    }

    return (
        <BccEditorialWrapper
            headerTitle="User Registry"
            headerSubtitle="Identity Management // Role Assignment // Access Logs"
            headerBadge="Directory v1.0"
            telemetryData={[
                { label: "Total Identities", value: String(stats?.total || users.length), suffix: "UIDs" },
                { label: "Active Sessions", value: String(stats?.active || users.filter(u => u.status === 'active').length), color: "#9df425" },
                { label: "Pending Invites", value: String(stats?.unverified ?? users.filter(u => u.status === 'invited').length), color: "#ff8c00" }
            ]}
            headerAction={
                <Button onClick={() => router.push(`/${tenant}/admin/users/new`)} className="bg-[#9df425] text-black hover:bg-[#8ce022] uppercase font-bold tracking-widest text-xs">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                </Button>
            }
        >
            <div className="space-y-6 pb-20">

                {/* HUD Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <BccHudTile title="Directory Health" icon="activity" accentColor="#9df425">
                        <div className="text-2xl font-bold font-mono tracking-tighter">OPTIMAL</div>
                        <div className="text-[10px] text-white/40 font-mono mt-1">SYNC LATENCY: 12ms</div>
                    </BccHudTile>
                    <BccHudTile title="Admin Coverage" icon="shield" accentColor="#ff8c00">
                        <div className="text-2xl font-bold font-mono tracking-tighter">
                            {users.filter(u => u.role === 'admin' || u.role === 'superuser').length}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono mt-1">PRIVILEGED ACCOUNTS</div>
                    </BccHudTile>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0a0a0a]/40 border border-white/5 p-4 backdrop-blur-md">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input
                            placeholder="Search by email, name, or UID..."
                            className="pl-9 bg-black/40 border-white/10 text-white font-mono text-xs focus:border-[#9df425]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadData()}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-white/10 text-white/60 text-xs font-mono uppercase">
                            <Filter className="mr-2 h-3 w-3" /> Filter
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => loadData()} className="border-white/10 text-white/60 text-xs font-mono uppercase">
                            <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Registry Table */}
                <div className="border border-white/5 bg-white/[0.02] rounded-none overflow-hidden">
                    <Table>
                        <TableHeader className="bg-black/40">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="w-[300px] text-[10px] uppercase tracking-widest text-white/40 font-mono">User Identity</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Role / Access</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Status</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Last Active</TableHead>
                                <TableHead className="text-right text-[10px] uppercase tracking-widest text-white/40 font-mono">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-white/30 font-mono text-xs">
                                        Scanning Directory...
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-white/30 font-mono text-xs">
                                        No identities found matching query.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">

                                        {/* Identity */}
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-white/10 rounded-sm">
                                                    <AvatarImage src={user.avatarUrl} />
                                                    <AvatarFallback className="bg-[#9df425] text-black font-bold text-xs rounded-sm">
                                                        {user.firstName[0]}{user.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-sm text-white">{user.firstName} {user.lastName}</div>
                                                    <div className="font-mono text-xs text-white/40 flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Role */}
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`rounded-none border-opacity-30 py-1 font-mono text-[10px] uppercase tracking-widest
                          ${user.role === 'superuser' ? 'border-[#ff8c00] text-[#ff8c00] bg-[#ff8c00]/5' :
                                                        user.role === 'admin' ? 'border-[#9df425] text-[#9df425] bg-[#9df425]/5' :
                                                            'border-blue-500 text-blue-500 bg-blue-500/5'}
                        `}
                                            >
                                                {user.role}
                                            </Badge>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full 
                          ${user.status === 'active' ? 'bg-green-500 animate-pulse' :
                                                        user.status === 'invited' ? 'bg-yellow-500' : 'bg-red-500'}
                        `} />
                                                <span className="text-xs font-mono text-white/60 uppercase">{user.status}</span>
                                            </div>
                                        </TableCell>

                                        {/* Last Active */}
                                        <TableCell className="font-mono text-xs text-white/40">
                                            {user.lastActive ? formatDistanceToNow(user.lastActive, { addSuffix: true }) : 'Never'}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10">
                                                        <MoreHorizontal className="h-4 w-4 text-white/60" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white w-48">
                                                    <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-widest text-white/40">User Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="text-xs hover:bg-white/10 cursor-pointer">
                                                        <Shield className="mr-2 h-3 w-3" /> Edit Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    {user.status === 'active' ? (
                                                        <DropdownMenuItem
                                                            className="text-xs text-red-500 hover:bg-red-500/10 cursor-pointer focus:text-red-500 focus:bg-red-500/10"
                                                            onClick={() => handleStatusChange(user.id, 'deactivate')}
                                                        >
                                                            <UserX className="mr-2 h-3 w-3" /> Deactivate
                                                        </DropdownMenuItem>
                                                    ) : user.status === 'disabled' ? (
                                                        <DropdownMenuItem
                                                            className="text-xs text-green-500 hover:bg-green-500/10 cursor-pointer focus:text-green-500 focus:bg-green-500/10"
                                                            onClick={() => handleStatusChange(user.id, 'activate')}
                                                        >
                                                            <UserCheck className="mr-2 h-3 w-3" /> Activate
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem disabled className="text-xs text-yellow-500/70">
                                                            <Mail className="mr-2 h-3 w-3" /> Awaiting verification
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </BccEditorialWrapper>
    );
}
