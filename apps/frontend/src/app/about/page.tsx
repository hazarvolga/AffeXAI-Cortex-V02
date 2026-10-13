import type { Metadata } from "next";
import {
  CmsBackedPage,
  cmsPageMetadata,
} from "@/components/cms/cms-backed-page";

// Re-render from the CMS at most once a minute, so a build without a backend does not freeze an error page.
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata("about");
}

export default function AboutPage() {
  return <CmsBackedPage slug="about" />;
}
