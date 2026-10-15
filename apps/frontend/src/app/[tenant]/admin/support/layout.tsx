import type { Metadata } from "next";
import type { ReactNode } from "react";
import { adminTitle } from "@/lib/metadata/admin-title";

export const metadata: Metadata = { title: adminTitle("Destek talepleri") };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
