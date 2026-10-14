import Link from "next/link";
import type { ReactNode } from "react";
import { LOGIN_COPY } from "@/lib/auth/login-copy";

interface AuthShellProps {
  title: string;
  lead: string;
  children: ReactNode;
}

const LINK =
  "text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * One calm frame for every sign-in surface (Cortex Editorial portal tokens).
 * Replaces the former green "portal gateway" and amber "access protocol" pages.
 */
export function AuthShell({ title, lead, children }: AuthShellProps) {
  return (
    <div className="theme-portal flex min-h-screen flex-col bg-background text-foreground">
      <header className="px-4 py-6 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base font-semibold focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 bg-primary" />
          {LOGIN_COPY.brand}
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            {lead}
          </p>
          <div className="mt-8 rounded-md border border-border bg-card p-6 sm:p-8">
            {children}
          </div>
        </div>
      </main>
      <footer className="flex flex-wrap gap-6 px-4 py-6 sm:px-8">
        <Link href="/privacy" className={LINK}>
          {LOGIN_COPY.legal.privacy}
        </Link>
        <Link href="/terms" className={LINK}>
          {LOGIN_COPY.legal.terms}
        </Link>
      </footer>
    </div>
  );
}
