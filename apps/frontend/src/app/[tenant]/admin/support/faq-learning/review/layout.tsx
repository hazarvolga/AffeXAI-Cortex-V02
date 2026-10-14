import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminPageFrame } from "@/components/patterns/AdminPageFrame";

export const metadata: Metadata = { title: "SSS inceleme" };

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminPageFrame>{children}</AdminPageFrame>;
}
