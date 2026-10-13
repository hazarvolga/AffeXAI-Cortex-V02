import type { Metadata } from "next";
import { getPublicCopy } from "@/lib/i18n/public-copy";

export const metadata: Metadata = getPublicCopy().meta.pricing;

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
