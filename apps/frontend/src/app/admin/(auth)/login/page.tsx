import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { LOGIN_COPY } from "@/lib/auth/login-copy";

export const metadata: Metadata = {
  // Absolute: the tenant admin layout adds its own " · AffeXAI Cortex" template.
  title: { absolute: "Ekip girişi · AffeXAI Cortex" },
  robots: { index: false, follow: false },
};

/** Team sign-in, also served at /<tenant>/admin/login where the workspace comes from the path. */
export default function AdminLoginPage() {
  return (
    <AuthShell title={LOGIN_COPY.title} lead={LOGIN_COPY.lead.team}>
      <Suspense>
        <LoginForm context="team" />
      </Suspense>
    </AuthShell>
  );
}
