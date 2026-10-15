import type { ReactNode } from "react";

export const ADMIN_MAIN_ID = "tenant-main-content";

interface AdminPageFrameProps {
  children: ReactNode;
  /** Optional module navigation, placed between the skip link and <main>. */
  header?: ReactNode;
}

/**
 * Landmark frame for tenant admin pages that do not render BccEditorialWrapper:
 * a skip link and the single <main> the keyboard path targets (UX-CONTRACT).
 */
export function AdminPageFrame({ children, header }: AdminPageFrameProps) {
  return (
    <>
      <a
        href={`#${ADMIN_MAIN_ID}`}
        className="fixed left-4 top-3 z-[100] -translate-y-24 bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform focus:translate-y-0"
      >
        Ana içeriğe geç
      </a>
      {header}
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
