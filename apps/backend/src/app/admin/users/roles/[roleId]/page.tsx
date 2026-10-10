'use client';

import { RoleForm } from "@/components/admin/role-form";
import { roles } from "@/lib/roles-data";
import { notFound } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { use } from "react";

export default function EditRolePage({ params }: { params: Promise<{ roleId: string }> }) {
    // Unwrap the params promise using React.use()
    const unwrappedParams = use(params);
    const { roleId } = unwrappedParams;
    
    const [role, setRole] = useState<any>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedRole = useRef(false);

    useEffect(() => {
        // Prevent multiple fetches
        if (hasFetchedRole.current) return;
        hasFetchedRole.current = true;
        
        const fetchRole = async () => {
            try {
                setLoading(true);
                // In a real app, you would fetch the role data from an API
                // For now, we're using mock data
                const roleData = roles.find(r => r.id === roleId);
                if (!roleData) {
                    notFound();
                    return;
                }
                setRole(roleData);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching role:', err);
                setError('Rol bilgileri yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
    }, [roleId]);

    if (loading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-12">{error}</div>;
    }

    if (!role) {
        notFound();
        return null;
    }

    return <RoleForm role={role} />;
}