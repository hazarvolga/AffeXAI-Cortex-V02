"use client";

import { useEffect, useRef } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGIN_COPY } from "@/lib/auth/login-copy";
import type { WorkspaceChoice } from "@/lib/auth/login-outcome";

interface WorkspaceChooserProps {
  choices: readonly WorkspaceChoice[];
  busySlug: string | null;
  onChoose: (slug: string) => void;
  onBack: () => void;
}

/** Shown only after the password matched in more than one workspace. */
export function WorkspaceChooser({
  choices,
  busySlug,
  onChoose,
  onBack,
}: WorkspaceChooserProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <section aria-labelledby="workspace-choice-title" className="space-y-5">
      <div>
        <h2
          id="workspace-choice-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold focus:outline-none"
        >
          {LOGIN_COPY.chooseTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {LOGIN_COPY.chooseLead}
        </p>
      </div>
      <ul className="space-y-2">
        {choices.map((choice) => (
          <li key={choice.slug}>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full justify-start gap-3 py-3 text-left"
              disabled={busySlug !== null}
              aria-busy={busySlug === choice.slug}
              onClick={() => onChoose(choice.slug)}
            >
              <Building2 aria-hidden="true" />
              <span className="flex flex-col">
                <span className="text-base font-medium">{choice.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {choice.slug}
                </span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="link"
        className="px-0 text-foreground underline"
        onClick={onBack}
      >
        {LOGIN_COPY.chooseBack}
      </Button>
    </section>
  );
}
