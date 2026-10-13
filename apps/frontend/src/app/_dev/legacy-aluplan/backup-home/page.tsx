import { Metadata } from "next";
import { CmsPageService } from "@/services/cms-page.service";
import { PageRenderer } from "@/components/cms/page-renderer";

// Generate metadata for homepage SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await CmsPageService.getHomepage();

    return {
      title: page.metaTitle || page.title || "Affexai - AEC Çözümleri",
      description:
        page.metaDescription ||
        "Affexai ile inşaat ve mimarlık sektörüne özel çözümler",
    };
  } catch (error) {
    return {
      title: "Affexai - AEC Çözümleri",
      description: "Affexai ile inşaat ve mimarlık sektörüne özel çözümler",
    };
  }
}

type Homepage = Awaited<ReturnType<typeof CmsPageService.getHomepage>>;

async function loadHomepage(): Promise<Homepage | null> {
  try {
    return await CmsPageService.getHomepage();
  } catch (error) {
    console.error("Error loading homepage:", error);
    return null;
  }
}

export default async function HomePage() {
  // Fetch homepage from CMS (slug: 'home')
  const page = await loadHomepage();

  if (!page) {
    // Fallback: CMS homepage not found
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6">Affexai - AEC Çözümleri</h1>
          <p className="text-xl text-muted-foreground mb-8">
            İnşaat ve Mimarlık Sektörüne Özel Çözümler
          </p>
          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              ℹ️ CMS homepage bulunamadı. Admin panelinden ‘home’ slug’ıyla bir
              sayfa oluşturun.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render homepage with CMS blocks
  return (
    <div className="min-h-screen">
      {page.components?.length ? (
        <PageRenderer components={page.components} />
      ) : (
        // Fallback: No CMS content available
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Affexai - AEC Çözümleri</h1>
            <p className="text-xl text-muted-foreground mb-8">
              CMS homepage içeriği yükleniyor...
            </p>
            <p className="text-sm text-muted-foreground">
              CMS’de ‘home’ slug’ıyla bir sayfa oluşturun.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
