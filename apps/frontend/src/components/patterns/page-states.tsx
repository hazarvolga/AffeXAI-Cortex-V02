import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared page patterns from DESIGN.md: a page header that states the page and
 * its one primary action, and empty / error states that always offer the next
 * step. Loading, empty, no-results and error are distinct (UX-CONTRACT).
 */

interface PageHeaderProps {
  title: string;
  description?: string;
  /** The single primary action of the page, rendered on the right. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-base text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}

interface StateProps {
  title: string;
  description?: string;
  /** The next step: create the first record, clear filters or retry. */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

function StatePanel({
  title,
  description,
  action,
  icon,
  className,
  role,
}: StateProps & { role: "status" | "alert" }) {
  return (
    <div
      role={role}
      className={cn(
        "rounded-md border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex justify-center text-muted-foreground"
        >
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>
      )}
    </div>
  );
}

/** Nothing exists yet; the action creates the first record. */
export function EmptyState(props: StateProps) {
  return <StatePanel {...props} role="status" />;
}

/** Records exist but the current search or filter matches none. */
export function NoResultsState(props: StateProps) {
  return <StatePanel {...props} role="status" />;
}

/** Loading failed; the action retries. Never shows raw server text. */
export function ErrorState(props: StateProps) {
  return (
    <StatePanel
      {...props}
      role="alert"
      className={cn("border-destructive/50", props.className)}
    />
  );
}
