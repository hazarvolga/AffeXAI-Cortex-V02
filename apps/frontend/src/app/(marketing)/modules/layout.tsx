import type { Metadata } from "next";
import { getPublicCopy } from "@/lib/i18n/public-copy";

export const metadata: Metadata = getPublicCopy().meta.modules;

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
