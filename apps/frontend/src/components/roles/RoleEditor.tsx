'use client';

import { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface RoleEditorProps {
    role: {
        id: string;
        name: string;
        displayName?: string;
        description: string;
        userCount: number;
        permissions: string[];
        isCustom?: boolean;
    } | null;
    onClose: () => void;
    onSave: (role: { name: string; displayName: string; description: string }) => Promise<void>;
    onDelete?: (roleId: string) => Promise<void>;
}

export function RoleEditor({ role, onClose, onSave, onDelete }: RoleEditorProps) {
    const [name, setName] = useState(role?.name || '');
    const [displayName, setDisplayName] = useState(role?.displayName || '');
    const [description, setDescription] = useState(role?.description || '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteArmed, setDeleteArmed] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !displayName.trim() || saving) return;
        setSaving(true);
        try {
            await onSave({ name: name.trim(), displayName: displayName.trim(), description: description.trim() });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!role || !onDelete || deleting || role.userCount > 0) return;
        if (!deleteArmed) {
            setDeleteArmed(true);
            return;
        }
        setDeleting(true);
        try {
            await onDelete(role.id);
        } finally {
            setDeleting(false);
            setDeleteArmed(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-none w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div>
                        <div className="text-[14px] font-bold uppercase tracking-[0.2em] text-white">
                            {role ? 'Role Configuration' : 'Provision Role'}
                        </div>
                        <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mt-1 font-mono">
                            Edit identity vector parameters
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={saving || deleting}
                        className="text-white/20 hover:text-white transition-colors disabled:opacity-30"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Role Name */}
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono block mb-2">
                            Identification Label
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-black border-white/10 rounded-none text-white h-10 text-[11px] focus:border-[#9df425] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono block mb-2">
                            Display Label
                        </label>
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="bg-black border-white/10 rounded-none text-white h-10 text-[11px] focus:border-[#9df425] transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono block mb-2">
                            Functional Description
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-black border-white/10 rounded-none text-white min-h-[100px] text-[11px] focus:border-[#9df425] transition-colors resize-none"
                        />
                    </div>

                    {/* Meta Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                        <div className="space-y-1">
                            <div className="text-[9px] uppercase tracking-widest text-white/30 font-mono">
                                Population
                            </div>
                            <div className="text-2xl font-mono text-white flex items-baseline gap-2">
                                {role?.userCount || 0}
                                <span className="text-[10px] text-white/20">Units</span>
                            </div>
                        </div>
                        <div className="space-y-1 text-right">
                            <div className="text-[9px] uppercase tracking-widest text-white/30 font-mono">
                                Perms_Score
                            </div>
                            <div className="text-2xl font-mono text-[#9df425]">
                                {role?.permissions.length || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 p-5 border-t border-white/5 bg-white/[0.01]">
                    {role?.isCustom && onDelete && (
                        <Button
                            onClick={handleDelete}
                            disabled={saving || deleting || role.userCount > 0}
                            variant="outline"
                            size="sm"
                            className="h-10 mr-auto bg-transparent border-red-500/30 text-red-300 hover:text-white hover:bg-red-500/20 rounded-none text-[10px] uppercase tracking-widest font-mono px-4"
                            title={role.userCount > 0 ? 'Remove assigned users before deleting this role' : undefined}
                        >
                            <Trash2 className="w-3 h-3 mr-2" />
                            {deleting ? 'Deleting...' : deleteArmed ? 'Confirm Delete' : 'Delete Role'}
                        </Button>
                    )}
                    <Button
                        onClick={onClose}
                        disabled={saving || deleting}
                        variant="outline"
                        size="sm"
                        className="h-10 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-none text-[10px] uppercase tracking-widest font-mono px-6"
                    >
                        Abort
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!name.trim() || !displayName.trim() || saving || deleting}
                        size="sm"
                        className="h-10 bg-[#9df425] text-black hover:bg-[#8ce620] rounded-none text-[10px] uppercase tracking-widest font-bold px-8 transition-colors"
                    >
                        <Save className="w-3 h-3 mr-2" />
                        {saving ? 'Synchronizing...' : role ? 'Apply Delta' : 'Provision Role'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
