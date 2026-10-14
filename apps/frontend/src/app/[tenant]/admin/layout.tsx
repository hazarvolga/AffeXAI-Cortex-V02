import type { Metadata } from "next";
import type { ReactNode } from "react";

/** UX-CONTRACT: every route title reads "[Sayfa] · AffeXAI Cortex". */
export const metadata: Metadata = {
  title: {
    template: "%s · AffeXAI Cortex",
    default: "Yönetim · AffeXAI Cortex",
  },
  robots: { index: false, follow: false },
};

export default function TenantAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
