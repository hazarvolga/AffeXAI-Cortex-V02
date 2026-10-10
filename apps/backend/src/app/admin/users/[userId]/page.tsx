'use client';

import { UserForm } from "@/components/admin/user-form";
import { notFound } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { use } from "react";
import usersService from "@/lib/api/usersService";
import type { User } from "@/lib/api/usersService";

export default function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
    // Unwrap the params promise using React.use()
    const unwrappedParams = use(params);
    const { userId } = unwrappedParams;
    
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedUser = useRef(false);

    useEffect(() => {
        // Prevent multiple fetches
        if (hasFetchedUser.current) return;
        hasFetchedUser.current = true;
        
        const fetchUser = async () => {
            try {
                setLoading(true);
                // Fetch user from backend
                const userData: User = await usersService.getUserById(userId);
                setUser(userData);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching user:', err);
                if (err.response?.status === 404) {
                    notFound();
                } else {
                    setError('Kullanıcı bilgileri yüklenirken bir hata oluştu.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-12">{error}</div>;
    }

    if (!user) {
        notFound();
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <UserForm user={user} />
        </div>
    );
}