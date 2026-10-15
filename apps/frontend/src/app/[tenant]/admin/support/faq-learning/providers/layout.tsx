import type { Metadata } from "next";
import type { ReactNode } from "react";
import { adminTitle } from "@/lib/metadata/admin-title";

export const metadata: Metadata = {
  title: adminTitle("SSS öğrenme sağlayıcıları"),
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
