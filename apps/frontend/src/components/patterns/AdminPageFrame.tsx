import type { ReactNode } from "react";

export const ADMIN_MAIN_ID = "tenant-main-content";

/**
 * Landmark frame for tenant admin pages that do not render BccEditorialWrapper:
 * a skip link and the single <main> the keyboard path targets (UX-CONTRACT).
 */
export function AdminPageFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href={`#${ADMIN_MAIN_ID}`}
        className="fixed left-4 top-3 z-[100] -translate-y-24 bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform focus:translate-y-0"
      >
        Ana içeriğe geç
      </a>
      <main
        id={ADMIN_MAIN_ID}
        tabIndex={-1}
        className="min-h-screen focus:outline-none"
      >
        {children}
      </main>
    </>
  );
}
