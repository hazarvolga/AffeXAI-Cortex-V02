import { notFound } from "next/navigation";
import { cmsService } from "@/lib/cms/cms-service";
import { PageRenderer } from "@/components/cms/page-renderer";
import { getPublicCopy } from "@/lib/i18n/public-copy";

const NOT_FOUND_TITLE = `${getPublicCopy().notFound.title} · AffeXAI Cortex`;

// Force dynamic rendering - disable static generation for API-dependent pages
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DynamicCMSPage({ params }: PageProps) {
  // Await params (Next.js 15 requirement)
  const resolvedParams = await params;

  // Build slug from params (e.g., ['solutions', 'building-design', 'architecture'] → 'solutions/building-design/architecture')
  const slug = resolvedParams.slug ? resolvedParams.slug.join("/") : "home";

  // Ignore Next.js internal routes, static files, and administrative/portal paths
  if (
    slug.includes("_next") ||
    slug.includes(".") || // Files with extensions (.js, .map, .css, etc.)
    slug.startsWith("api/") ||
    slug.includes("admin/") || // ✅ Catch /[tenant]/admin/...
    slug.includes("portal/") || // ✅ Catch /[tenant]/portal/...
    slug === "admin" ||
    slug === "portal"
  ) {
    notFound();
  }

  const page = await loadPublishedPage(slug);
  if (!page) notFound();

  return <PageRenderer components={page.components || []} />;
}

async function loadPublishedPage(slug: string) {
  try {
    const page = await cmsService.getPageBySlug(slug);
    return page?.status === "published" ? page : null;
  } catch (error) {
    console.error("Error fetching CMS page:", error);
    return null;
  }
}

// Static params generation disabled for dynamic rendering
// All pages will be server-side rendered on demand

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  // Await params (Next.js 15 requirement)
  const resolvedParams = await params;
  const slug = resolvedParams.slug ? resolvedParams.slug.join("/") : "home";

  try {
    const page = await cmsService.getPageBySlug(slug);

    if (!page) {
      return {
        title: NOT_FOUND_TITLE,
      };
    }

    return {
      title: page.title,
      description: page.description || "",
      openGraph: {
        title: page.title,
        description: page.description || "",
        type: "website",
      },
    };
  } catch (error) {
    return {
      title: NOT_FOUND_TITLE,
    };
  }
}
