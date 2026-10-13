import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { CONTACT_EMAIL } from "@/lib/marketing/contact";

export const metadata: Metadata = {
  title: `${getPublicCopy().notFound.title} · AffeXAI Cortex`,
  robots: { index: false, follow: true },
};

/** Branded Turkish 404; reveals nothing about whether a record or tenant exists. */
export default function NotFound() {
  const { brand, notFound } = getPublicCopy();

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <span aria-hidden="true" className="h-2 w-2 bg-primary" />
          {brand}
        </p>
        <div className="mt-10 border-t border-border pt-10">
          <p className="font-mono text-sm text-muted-foreground">
            {notFound.code}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            {notFound.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {notFound.body}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/">{notFound.backHome}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`mailto:${CONTACT_EMAIL}`}>{notFound.contact}</a>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
