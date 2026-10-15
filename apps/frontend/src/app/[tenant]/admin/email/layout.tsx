import type { Metadata } from "next";
import type { ReactNode } from "react";
import { adminTitle } from "@/lib/metadata/admin-title";

export const metadata: Metadata = { title: adminTitle("E-posta pazarlama") };

export default function EmailLayout({ children }: { children: ReactNode }) {
  return <div className="w-full h-full">{children}</div>;
}
