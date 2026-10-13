import type { Metadata } from "next";
import { getPublicCopy } from "@/lib/i18n/public-copy";

export const metadata: Metadata = getPublicCopy().meta.architecture;

export default function ArchitectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
