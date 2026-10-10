'use client';

import { RoleForm } from "@/components/admin/role-form";
import { notFound } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { rolesService } from "@/lib/api";
import { Role } from "@affexai/shared-types";

export default function EditRolePage({ params }: { params: Promise<{ roleId: string }> }) {
    // Unwrap the params promise using React.use()
    const unwrappedParams = use(params);
    const { roleId } = unwrappedParams;
    
    const [role, setRole] = useState<Role | null>(null);
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
                const roleData = await rolesService.getRoleById(roleId);
                setRole(roleData);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching role:', err);
                if (err.response?.status === 404) {
                    notFound();
                } else {
                    setError('Rol bilgileri yüklenirken bir hata oluştu.');
                }
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