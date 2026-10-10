import { CertificateForm } from "@/components/admin/certificate-form";
import { Suspense } from "react";
import { Skeleton } from "@/components/loading/skeleton";

export default function NewCertificatePage() {
    return (
        <Suspense fallback={
            <div className="max-w-4xl mx-auto p-6">
                <Skeleton className="h-16 w-full mb-6" />
                <div className="space-y-6">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <div className="flex justify-end gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        }>
            <CertificateForm />
        </Suspense>
    );
}