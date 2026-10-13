import type { Metadata } from "next";
import { getPublicCopy } from "@/lib/i18n/public-copy";

export const metadata: Metadata = getPublicCopy().meta.manifesto;

export default function ManifestoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
