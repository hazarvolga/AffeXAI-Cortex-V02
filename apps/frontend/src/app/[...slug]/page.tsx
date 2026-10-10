import { notFound } from 'next/navigation';
import { cmsService } from '@/lib/cms/cms-service';
import { PageRenderer } from '@/components/cms/page-renderer';

// Force dynamic rendering - disable static generation for API-dependent pages
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function DynamicCMSPage({ params }: PageProps) {
  // Await params (Next.js 15 requirement)
  const resolvedParams = await params;

  // Build slug from params (e.g., ['solutions', 'building-design', 'architecture'] → 'solutions/building-design/architecture')
  const slug = resolvedParams.slug ? resolvedParams.slug.join('/') : 'home';

  // Ignore Next.js internal routes, static files, and administrative/portal paths
  if (
    slug.includes('_next') ||
    slug.includes('.') || // Files with extensions (.js, .map, .css, etc.)
    slug.startsWith('api/') ||
    slug.includes('admin/') || // ✅ Catch /[tenant]/admin/...
    slug.includes('portal/') || // ✅ Catch /[tenant]/portal/...
    slug === 'admin' ||
    slug === 'portal'
  ) {
    notFound();
  }

  try {
    // Fetch page from CMS by slug
    const page = await cmsService.getPageBySlug(slug);

    if (!page || page.status !== 'published') {
      notFound();
    }

    // Render page with components
    return <PageRenderer components={page.components || []} />;
  } catch (error) {
    console.error('Error fetching CMS page:', error);
    notFound();
  }
}

// Static params generation disabled for dynamic rendering
// All pages will be server-side rendered on demand

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  // Await params (Next.js 15 requirement)
  const resolvedParams = await params;
  const slug = resolvedParams.slug ? resolvedParams.slug.join('/') : 'home';

  try {
    const page = await cmsService.getPageBySlug(slug);

    if (!page) {
      return {
        title: 'Page Not Found',
      };
    }

    return {
      title: page.title,
      description: page.description || '',
      openGraph: {
        title: page.title,
        description: page.description || '',
        type: 'website',
      },
    };
  } catch (error) {
    return {
      title: 'Page Not Found',
    };
  }
}
