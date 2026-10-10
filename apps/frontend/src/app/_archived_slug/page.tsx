import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CmsPageService } from '@/services/cms-page.service';
import { PageRenderer } from '@/components/cms/page-renderer';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const page = await CmsPageService.getPageBySlug(resolvedParams.slug);

    if (!page) {
      return {
        title: 'Page Not Found',
        description: 'The requested page could not be found.',
      };
    }

    return {
      title: page.metaTitle || page.title,
      description: page.metaDescription || `${page.title} - Affexai`,
    };
  } catch (error) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
    };
  }
}

export default async function CmsPage({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const page = await CmsPageService.getPageBySlug(resolvedParams.slug);

    // Check if page exists and is published
    if (!page || page.status !== 'published') {
      notFound();
    }

    // Get layout options with defaults
    const layoutOptions = (page as any).layoutOptions || {};
    const showHeader = layoutOptions.showHeader !== false; // default true
    const showFooter = layoutOptions.showFooter !== false; // default true
    const isFullWidth = layoutOptions.isFullWidth === true; // default false (boxed)

    return (
      <div className="min-h-screen flex flex-col">
        {showHeader && <Header />}

        <main className="flex-1">
          {page.components && page.components.length > 0 ? (
            // Render CMS content with layout wrapper
            <div className={isFullWidth ? 'w-full' : 'container mx-auto max-w-screen-xl px-4'}>
              <PageRenderer components={page.components} />
            </div>
          ) : (
            // Fallback: No CMS content available
            <div className="container mx-auto px-4 py-20">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
                <p className="text-muted-foreground">No content available for this page.</p>
              </div>
            </div>
          )}
        </main>

        {showFooter && <Footer />}
      </div>
    );
  } catch (error) {
    console.error('Error loading CMS page:', error);
    notFound();
  }
}
