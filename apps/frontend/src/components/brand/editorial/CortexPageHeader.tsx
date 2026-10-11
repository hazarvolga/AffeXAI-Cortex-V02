import type { ReactNode } from "react";

interface CortexPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  action?: ReactNode;
}

export function CortexPageHeader({
  eyebrow,
  title,
  description,
  badge,
  action,
}: CortexPageHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-[var(--cortex-line)] px-5 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-9 lg:px-12">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-52 border-l border-[var(--cortex-line)] lg:block"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0_49%,var(--cortex-line)_49.5%_50.5%,transparent_51%)] opacity-50" />
      </div>
      <div className="relative flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em]">
            <span className="text-[var(--cortex-accent-ink)]">{eyebrow}</span>
            {badge && (
              <span className="border border-[var(--cortex-line-strong)] px-2 py-1 text-[var(--cortex-text-muted)]">
                {badge}
              </span>
            )}
          </div>
          <h1 className="mt-5 text-[clamp(2.4rem,7vw,4.75rem)] font-extrabold leading-[0.9] tracking-[-0.06em] text-[var(--cortex-text)]">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-[var(--cortex-text-muted)] sm:text-base">
            {description}
          </p>
        </div>
        {action && <div className="relative z-10 shrink-0">{action}</div>}
      </div>
    </header>
  );
}
