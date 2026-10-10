'use client';

import { useState, useEffect, useCallback } from 'react';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
import { PermissionMatrix } from '@/components/roles/PermissionMatrix';
import { RoleEditor } from '@/components/roles/RoleEditor';
import { Shield, Users, Activity, Clock, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rolesService, Resource } from '@/lib/api/rolesService';
import { Role } from '@affexai/shared-types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

export default function RolesPage() {
    const { isAdmin } = usePermissions();
    const [roles, setRoles] = useState<Role[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [elevatedPrivileges, setElevatedPrivileges] = useState(0);
    const [lastChange, setLastChange] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [rolesData, resourcesData] = await Promise.all([
                rolesService.getRoles(),
                rolesService.getAllResources()
            ]);

            // Roles returned from backend likely have permissions as IDs, 
            // but we need to fetch full details for the matrix if needed.
            // For now, assume the basic roles list is enough for selection.
            setRoles(rolesData);
            setResources(resourcesData);
            setLastChange(new Date());

            const tenantAdminRoles = new Set(['admin', 'organization_admin', 'organization_owner']);
            setElevatedPrivileges(rolesData.filter(r => tenantAdminRoles.has(r.name.toLowerCase())).length);
        } catch (error) {
            console.error('Failed to fetch roles/resources:', error);
            toast.error('Identity Grid Sync Failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePermissionToggle = async (roleId: string, resourceId: string) => {
        if (!isAdmin) return;
        try {
            const role = roles.find(r => r.id === roleId);
            if (!role) return;

            // Optimistic update
            const currentPermissions = (role as any).permissions || [];
            const newPermissions = currentPermissions.includes(resourceId)
                ? currentPermissions.filter((id: string) => id !== resourceId)
                : [...currentPermissions, resourceId];

            setRoles(prev => prev.map(r =>
                r.id === roleId ? { ...r, permissions: newPermissions } : r
            ));

            await rolesService.updateRolePermissions(roleId, newPermissions);
            setLastChange(new Date());
            toast.success('Permission state synchronized');
        } catch (error) {
            console.error('Failed to toggle permission:', error);
            toast.error('Matrix Linkage Error');
            fetchData(); // Revert on failure
        }
    };

    const handleRefresh = () => {
        fetchData();
    };

    const handleRoleSelect = (role: Role) => {
        if (!isAdmin) return;
        setSelectedRole(role);
        setEditorOpen(true);
    };

    const handleRoleSave = async (values: { name: string; displayName: string; description: string }) => {
        try {
            if (selectedRole) {
                await rolesService.updateRole(selectedRole.id, values);
            } else {
                await rolesService.createRole({ ...values, permissions: [] });
            }
            await fetchData();
            setEditorOpen(false);
            setSelectedRole(null);
            setLastChange(new Date());
            toast.success(selectedRole ? 'Role configuration updated' : 'Role provisioned');
        } catch (error) {
            console.error('Failed to save role:', error);
            toast.error('Role configuration could not be saved');
            throw error;
        }
    };

    const handleRoleDelete = async (roleId: string) => {
        try {
            await rolesService.deleteRole(roleId);
            await fetchData();
            setEditorOpen(false);
            setSelectedRole(null);
            setLastChange(new Date());
            toast.success('Role deleted');
        } catch (error) {
            console.error('Failed to delete role:', error);
            toast.error('Assigned or protected roles cannot be deleted');
            throw error;
        }
    };

    const totalUsers = roles.reduce((sum, role) => sum + ((role as any).userCount || 0), 0);

    return (
        <BccEditorialWrapper
            headerTitle="Access Control"
            headerSubtitle="Role-based permission management and security matrix"
            headerBadge="Access_Matrix"
            telemetryData={[
                { label: 'Role Assignments', value: totalUsers.toString(), color: '#9df425' },
                { label: 'Elevated Nodes', value: elevatedPrivileges.toString(), color: '#ff8c00' },
                { label: 'Role Definitions', value: roles.length.toString(), color: '#ffffff' },
            ]}
        >
            <div className="space-y-6">
                {/* Control Panel */}
                <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-[#9df425]" />
                            <h2 className="text-[12px] font-bold uppercase tracking-[.2em] text-white">
                                Governance Protocol
                            </h2>
                        </div>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Status: <span className="text-[#9df425]">Operational</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            className="h-8 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-none text-[10px] uppercase tracking-widest font-mono"
                        >
                            <RefreshCw className={cn("w-3 h-3 mr-1.5", loading && "animate-spin")} />
                            Sync Grid
                        </Button>
                        {isAdmin && (
                            <Button
                                onClick={() => {
                                    setSelectedRole(null);
                                    setEditorOpen(true);
                                }}
                                variant="default"
                                size="sm"
                                className="h-8 bg-[#9df425] text-black hover:bg-[#8ce620] rounded-none text-[10px] uppercase tracking-widest font-bold px-4"
                            >
                                <Plus className="w-3 h-3 mr-1.5" />
                                Provision New Role
                            </Button>
                        )}
                    </div>
                </div>

                {/* Telemetry HUD */}
                <div className="grid grid-cols-4 gap-4">
                    <BccHudTile title="TOTAL_ROLES" subtitle="Configured" icon="shield">
                        <div className="text-3xl font-mono tracking-tighter text-white">
                            {roles.length.toString().padStart(2, '0')}
                        </div>
                    </BccHudTile>

                    <BccHudTile title="RESOURCES" subtitle="Protected" icon="activity">
                        <div className="text-3xl font-mono tracking-tighter text-white">
                            {resources.length.toString().padStart(2, '0')}
                        </div>
                    </BccHudTile>

                    <BccHudTile title="ROLE_ASSIGNMENTS" subtitle="Tenant roles" icon="users">
                        <div className="text-3xl font-mono tracking-tighter text-[#9df425]">
                            {totalUsers.toLocaleString()}
                        </div>
                    </BccHudTile>

                    <BccHudTile title="LAST_SYNC" subtitle="Audit Pulse" icon="clock">
                        <div className="text-sm font-mono tracking-tighter text-white/80">
                            {lastChange ? lastChange.toLocaleTimeString() : '--:--:--'}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-white/30 mt-1">
                            {lastChange ? lastChange.toLocaleDateString() : '--/--/----'}
                        </div>
                    </BccHudTile>
                </div>

                {/* Permission Matrix */}
                <PermissionMatrix
                    roles={roles as any}
                    resources={resources}
                    onPermissionToggle={handlePermissionToggle}
                    onRoleSelect={handleRoleSelect}
                    readOnly={!isAdmin}
                />

                {/* Role Editor Sidebar */}
                {isAdmin && editorOpen && (
                    <RoleEditor
                        role={selectedRole as any}
                        onClose={() => {
                            setEditorOpen(false);
                            setSelectedRole(null);
                        }}
                        onSave={handleRoleSave}
                        onDelete={handleRoleDelete}
                    />
                )}
            </div>
        </BccEditorialWrapper>
    );
}
