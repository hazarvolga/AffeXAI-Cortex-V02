import type { Metadata } from "next";
import { getPublicCopy } from "@/lib/i18n/public-copy";

export const metadata: Metadata = getPublicCopy().meta.features;

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
