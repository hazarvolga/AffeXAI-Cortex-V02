import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceTone = "default" | "quiet" | "accent";

interface CortexSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "section" | "div";
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  tone?: SurfaceTone;
}

const toneClasses: Record<SurfaceTone, string> = {
  default: "bg-[var(--cortex-surface)]",
  quiet: "bg-[var(--cortex-surface-quiet)]",
  accent: "bg-[var(--cortex-accent-soft)]",
};

export function CortexSurface({
  as: Element = "section",
  eyebrow,
  title,
  description,
  action,
  tone = "default",
  className,
  children,
  ...props
}: CortexSurfaceProps) {
  return (
    <Element
      className={cn(
        "border border-[var(--cortex-line)] text-[var(--cortex-text)]",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {(eyebrow || title || description || action) && (
        <header className="flex flex-col gap-4 border-b border-[var(--cortex-line)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--cortex-accent-ink)]">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cortex-text-muted)]">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </Element>
  );
}
