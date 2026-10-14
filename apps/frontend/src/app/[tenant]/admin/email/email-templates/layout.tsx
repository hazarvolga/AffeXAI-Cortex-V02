import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminPageFrame } from "@/components/patterns/AdminPageFrame";

export const metadata: Metadata = { title: "Sistem e-posta şablonları" };

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminPageFrame>{children}</AdminPageFrame>;
}
