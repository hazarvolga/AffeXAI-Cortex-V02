'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { UserManagementService, Role } from '@/services/user-management.service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Save, Loader2, UserPlus, ShieldCheck } from 'lucide-react';

export default function CreateUserPage() {
    const { tenant } = useParams<{ tenant: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        city: '',
        country: '',
        bio: '',
        isActive: true,
        roleId: ''
    });

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            const data = await UserManagementService.getRoles();
            setRoles(data);
        } catch (error) {
            console.error('Failed to load roles:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.firstName || !formData.lastName || !formData.roleId) {
            toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await UserManagementService.inviteUser(formData);

            toast({ title: 'Invitation Created', description: 'The user can choose a password from the invitation email.' });
            router.push(`/${tenant}/admin/users`);
        } catch (error: any) {
            toast({
                title: 'Creation Failed',
                description: error.message || 'Could not create user identity.',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BccEditorialWrapper
            headerTitle="Create Identity"
            headerSubtitle="User Provisioning // Access Control // Security Audit"
            headerBadge="Directory v1.0"
            telemetryData={[
                { label: "Operation", value: "WRITE", color: "#9df425" },
                { label: "Security Level", value: "HIGH", color: "#ff8c00" }
            ]}
            headerAction={
                <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-white/60"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Cancel
                </Button>
            }
        >
            <div className="max-w-4xl mx-auto pb-20">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div className="bg-[#0a0a0a]/40 border border-white/5 p-8 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-white/10 group-hover:bg-[#9df425] transition-colors" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-none bg-white/5 flex items-center justify-center border border-white/10">
                                <UserPlus className="h-5 w-5 text-[#9df425]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Personal Information</h3>
                                <p className="text-white/40 text-sm font-mono">PRIMARY IDENTITY FIELDS</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-white/50">First Name</Label>
                                <Input
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    className="bg-black/40 border-white/10 focus:border-[#9df425]/50 h-12 font-mono"
                                    placeholder="e.g. Sarah"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-white/50">Last Name</Label>
                                <Input
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    className="bg-black/40 border-white/10 focus:border-[#9df425]/50 h-12 font-mono"
                                    placeholder="e.g. Connor"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs uppercase tracking-widest text-white/50">Email Address</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-black/40 border-white/10 focus:border-[#9df425]/50 h-12 font-mono"
                                    placeholder="sarah.connor@sky.net"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-white/50">Phone Number</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-black/40 border-white/10 focus:border-[#9df425]/50 h-12 font-mono"
                                    placeholder="+1 555 0199"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location & Details */}
                    <div className="bg-[#0a0a0a]/40 border border-white/5 p-8 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-white/10 group-hover:bg-[#00d0ff] transition-colors" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-none bg-white/5 flex items-center justify-center border border-white/10">
                                <ShieldCheck className="h-5 w-5 text-[#00d0ff]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Location & Details</h3>
                                <p className="text-white/40 text-sm font-mono">SUPPLEMENTARY DATA</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-white/50">City</Label>
                                <Input
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className="bg-black/40 border-white/10 focus:border-[#00d0ff]/50 h-12 font-mono"
                                    placeholder="Los Angeles"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-white/50">Country</Label>
                                <Input
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    className="bg-black/40 border-white/10 focus:border-[#00d0ff]/50 h-12 font-mono"
                                    placeholder="United States"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs uppercase tracking-widest text-white/50">Biography</Label>
                                <Input
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="bg-black/40 border-white/10 focus:border-[#00d0ff]/50 h-12 font-mono"
                                    placeholder="Brief user description..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security & Access */}
                    <div className="bg-[#0a0a0a]/40 border border-white/5 p-8 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-white/10 group-hover:bg-[#ff8c00] transition-colors" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-none bg-white/5 flex items-center justify-center border border-white/10">
                                <Save className="h-5 w-5 text-[#ff8c00]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Access Policy</h3>
                                <p className="text-white/40 text-sm font-mono">ROLE AND INVITATION</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest text-white/50">Role Assignment</Label>
                                <Select onValueChange={val => setFormData({ ...formData, roleId: val })}>
                                    <SelectTrigger className="bg-black/40 border-white/10 h-12 font-mono">
                                        <SelectValue placeholder="Select a System Role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                                        {roles.map(role => (
                                            <SelectItem key={role.id} value={role.id} className="font-mono focus:bg-white/10">
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-sm text-white/50">A 24-hour, single-use invitation will let the user verify their email and choose a password.</p>
                        </div>
                    </div>

                    {/* Submit Action */}
                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#9df425] hover:bg-[#8ce022] text-black font-bold h-12 px-8 uppercase tracking-widest text-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Provisioning...
                                </>
                            ) : (
                                <>
                                    Send Invitation
                                    <ChevronLeft className="ml-2 h-4 w-4 rotate-180" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </BccEditorialWrapper>
    );
}
