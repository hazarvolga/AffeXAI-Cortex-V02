import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { LOGIN_COPY } from "@/lib/auth/login-copy";

export const metadata: Metadata = {
  title: "Giriş yap · AffeXAI Cortex",
  robots: { index: false, follow: false },
};

/** Single sign-in for portal users and tenant teams; the role decides the destination. */
export default function LoginPage() {
  return (
    <AuthShell title={LOGIN_COPY.title} lead={LOGIN_COPY.lead.portal}>
      <Suspense>
        <LoginForm context="portal" />
      </Suspense>
    </AuthShell>
  );
}
