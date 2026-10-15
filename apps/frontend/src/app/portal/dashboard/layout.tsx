import type { Metadata } from "next";
import type { ReactNode } from "react";
import { portalTitle } from "@/lib/metadata/admin-title";

export const metadata: Metadata = { title: portalTitle("Panel") };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
