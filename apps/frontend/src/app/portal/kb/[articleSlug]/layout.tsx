import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Bilgi bankası makalesi" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
