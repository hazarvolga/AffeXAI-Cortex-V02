import type { Metadata } from "next";
import type { ReactNode } from "react";
import { portalTitle } from "@/lib/metadata/admin-title";

export const metadata: Metadata = { title: portalTitle("Etkinlikler") };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
