import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "E-posta pazarlama" };

export default function EmailLayout({ children }: { children: ReactNode }) {
  return <div className="w-full h-full">{children}</div>;
}
