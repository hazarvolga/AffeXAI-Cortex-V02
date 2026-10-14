import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PortalLayoutClient } from "@/components/portal/PortalLayoutClient";

export const metadata: Metadata = {
  title: { template: "%s · Portal · AffeXAI", default: "Portal · AffeXAI" },
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalLayoutClient>{children}</PortalLayoutClient>;
}
