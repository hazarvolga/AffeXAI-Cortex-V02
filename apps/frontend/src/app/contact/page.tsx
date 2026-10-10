import { Metadata } from 'next';
import { CmsPageService } from '@/services/cms-page.service';
import { PageRenderer } from '@/components/cms/page-renderer';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Generate metadata for Contact Us page SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const cmsPage = await CmsPageService.getPageBySlug('contact');

    if (!cmsPage) {
      return {
        title: 'Contact Us - Affexai',
        description: 'Get in touch with our team for support and inquiries',
      };
    }

    return {
      title: cmsPage.metaTitle || cmsPage.title || 'Contact Us - Affexai',
      description: cmsPage.metaDescription || 'Get in touch with our team for support and inquiries',
    };
  } catch (error) {
    return {
      title: 'Contact Us - Affexai',
      description: 'Get in touch with our team for support and inquiries',
    };
  }
}

export default async function ContactUsPage() {
  try {
    // Fetch contact page from CMS (slug: 'contact')
    const cmsPage = await CmsPageService.getPageBySlug('contact');

    // Render page with header and footer always visible
    return (
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {cmsPage && cmsPage.components && cmsPage.components.length > 0 ? (
            // Render CMS content
            <PageRenderer components={cmsPage.components} />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold mb-4">
                    Contact Us Page Content Pending
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8">
                    The CMS content for the Contact Us page hasn't been added yet. Please add content through the CMS editor.
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/admin/cms/pages">
                      Go to CMS Pages
                    </Link>
                  </Button>
                  {cmsPage && (
                    <Button asChild variant="outline" size="lg">
                      <Link href={`/admin/cms/editor?pageId=${cmsPage.id}`}>
                        Edit Contact Us Page
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
    console.error('Error loading contact page:', error);

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
                Contact Us Page Could Not Be Loaded
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
