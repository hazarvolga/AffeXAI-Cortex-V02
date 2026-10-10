import { Metadata } from 'next';
import { CmsPageService } from '@/services/cms-page.service';
import { PageRenderer } from '@/components/cms/page-renderer';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Generate metadata for homepage SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await CmsPageService.getHomepage();

    if (!page) {
      return {
        title: 'Affexai - AEC Çözümleri',
        description: 'Affexai ile inşaat ve mimarlık sektörüne özel çözümler',
      };
    }

    return {
      title: page.metaTitle || page.title || 'Affexai - AEC Çözümleri',
      description: page.metaDescription || 'Affexai ile inşaat ve mimarlık sektörüne özel çözümler',
    };
  } catch (error) {
    return {
      title: 'Affexai - AEC Çözümleri',
      description: 'Affexai ile inşaat ve mimarlık sektörüne özel çözümler',
    };
  }
}

export default async function HomePage() {
  try {
    // Fetch homepage from CMS (slug: 'home')
    const page = await CmsPageService.getHomepage();

    // Render homepage with header and footer always visible
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold mb-4">
                    Ana Sayfa İçeriği Bekleniyor
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8">
                    Ana sayfa için CMS içeriği henüz eklenmemiş. İçerik eklemek için aşağıdaki adımları takip edin.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-lg p-6 mb-8 text-left">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm">
                      1
                    </span>
                    CMS Editor Gidin
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 ml-8">
                    Admin panelinden CMS sayfalarına gidin ve mevcut ana sayfayı düzenleyin.
                  </p>

                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm">
                      2
                    </span>
                    İçerik Ekleyin
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 ml-8">
                    Sürükle-bırak editörü kullanarak bloklar ekleyin veya bir şablondan başlayın.
                  </p>

                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm">
                      3
                    </span>
                    Yayınlayın
                  </h2>
                  <p className="text-sm text-muted-foreground ml-8">
                    İçeriğinizi kaydedin ve yayınlayın - içerik otomatik olarak burada görünecektir.
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/admin/cms/pages">
                      CMS Sayfalarına Git
                    </Link>
                  </Button>
                  {page && (
                    <Button asChild variant="outline" size="lg">
                      <Link href={`/admin/cms/editor?pageId=${page.id}`}>
                        Ana Sayfayı Düzenle
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
    console.error('Error loading homepage:', error);

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
                Ana Sayfa Yüklenemedi
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                CMS içeriği yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin veya yöneticinizle iletişime geçin.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link href="/admin/cms/pages">
                    CMS Paneline Git
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
