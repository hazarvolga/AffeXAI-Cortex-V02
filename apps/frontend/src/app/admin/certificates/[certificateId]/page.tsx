'use client';

import { CertificateForm } from "@/components/admin/certificate-form";
import { notFound } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { use } from "react";
import certificatesService from "@/lib/api/certificatesService";
import type { Certificate } from "@/lib/api/certificatesService";

export default function EditCertificatePage({ params }: { params: Promise<{ certificateId: string }> }) {
    // Unwrap the params promise using React.use()
    const unwrappedParams = use(params);
    const { certificateId } = unwrappedParams;
    
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedCertificate = useRef(false);

    useEffect(() => {
        // Prevent multiple fetches
        if (hasFetchedCertificate.current) return;
        hasFetchedCertificate.current = true;
        
        const fetchCertificate = async () => {
            try {
                setLoading(true);
                // Fetch certificate from backend
                const cert: Certificate = await certificatesService.getById(certificateId);
                setCertificate(cert);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching certificate:', err);
                if (err.response?.status === 404) {
                    notFound();
                } else {
                    setError('Sertifika bilgileri yüklenirken bir hata oluştu.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCertificate();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-12">{error}</div>;
    }

    if (!certificate) {
        notFound();
        return null;
    }

    return <CertificateForm certificate={certificate} />;
}