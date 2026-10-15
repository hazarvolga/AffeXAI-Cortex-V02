import type { Metadata } from "next";
import type { ReactNode } from "react";
import { adminTitle } from "@/lib/metadata/admin-title";
import { CmsWorkbenchFrame } from "@/components/cms/workbench/CmsWorkbenchFrame";

export const metadata: Metadata = { title: adminTitle("İçerik yönetimi") };

export default function CmsLayout({ children }: { children: ReactNode }) {
  return <CmsWorkbenchFrame>{children}</CmsWorkbenchFrame>;
}
