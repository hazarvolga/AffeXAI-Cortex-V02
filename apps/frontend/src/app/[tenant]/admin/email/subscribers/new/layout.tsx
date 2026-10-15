import type { Metadata } from "next";
import type { ReactNode } from "react";
import { adminTitle } from "@/lib/metadata/admin-title";
import { AdminPageFrame } from "@/components/patterns/AdminPageFrame";

export const metadata: Metadata = { title: adminTitle("Yeni abone") };

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminPageFrame>{children}</AdminPageFrame>;
}
