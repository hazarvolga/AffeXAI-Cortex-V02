"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/patterns/page-states";

/** Any unexpected failure inside a portal page keeps the shell and offers a way forward. */
export default function PortalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Bu sayfa yüklenemedi"
      description="Geçici bir sorun oluştu. Tekrar deneyebilir veya panele dönebilirsiniz."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>Tekrar dene</Button>
          <Button variant="outline" asChild>
            <Link href="/portal/dashboard">Panele dön</Link>
          </Button>
        </div>
      }
    />
  );
}
