import { Metadata } from 'next';
import { CmsPageService } from '@/services/cms-page.service';
import { PageRenderer } from '@/components/cms/page-renderer';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Generate metadata for Products page SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await CmsPageService.getPageBySlug('products');

    if (!page) {
      return {
        title: 'Products - Affexai',
        description: 'Explore our comprehensive range of AEC software products',
      };
    }

    return {
      title: page.metaTitle || page.title || 'Products - Affexai',
      description: page.metaDescription || 'Explore our comprehensive range of AEC software products',
    };
  } catch (error) {
    return {
      title: 'Products - Affexai',
      description: 'Explore our comprehensive range of AEC software products',
    };
  }
}

export default async function ProductsPage() {
  try {
    // Fetch products page from CMS (slug: 'products')
    const page = await CmsPageService.getPageBySlug('products');

    // Render page with header and footer always visible
    return (
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {page && page.components && page.components.length > 0 ? (
            // Render CMS content
            <PageRenderer components={page.components} />
          ) : (
            // Fallback: No CMS content available
            <div className="container mx-auto px-4 py-20">
              <div className="max-w-2xl mx-auto text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold mb-4">
                    Products Page Content Pending
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8">
                    The CMS content for the Products page hasn't been added yet. Please add content through the CMS editor.
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/admin/cms/pages">
                      Go to CMS Pages
                    </Link>
                  </Button>
                  {page && (
                    <Button asChild variant="outline" size="lg">
                      <Link href={`/admin/cms/editor?pageId=${page.id}`}>
                        Edit Products Page
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error loading products page:', error);

    // Fallback: Error occurred
    return (
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                <svg
                  className="w-8 h-8 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4">
                Products Page Could Not Be Loaded
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                An error occurred while loading the CMS content. Please try again later or contact your administrator.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link href="/admin/cms/pages">
                    Go to CMS Panel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }
}
