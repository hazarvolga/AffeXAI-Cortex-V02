import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CmsPageService } from "@/services/cms-page.service";
import { PageRenderer } from "@/components/cms/page-renderer";
import { CmsEditorLink } from "@/components/cms/cms-editor-link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { getPublicCopy, type CmsPageKey } from "@/lib/i18n/public-copy";

type CmsPage = Awaited<ReturnType<typeof CmsPageService.getPageBySlug>>;

interface CmsBackedPageProps {
  slug: CmsPageKey;
}

/** SEO metadata from the CMS page, falling back to the Turkish public copy. */
export async function cmsPageMetadata(slug: CmsPageKey): Promise<Metadata> {
  const fallback = getPublicCopy().cmsMeta[slug];
  try {
    const page = await CmsPageService.getPageBySlug(slug);
    return {
      title: page?.metaTitle || page?.title || fallback.title,
      description: page?.metaDescription || fallback.description,
    };
  } catch {
    return fallback;
  }
}

async function loadPage(
  slug: CmsPageKey,
): Promise<{ page: CmsPage | null; failed: boolean }> {
  try {
    return { page: await CmsPageService.getPageBySlug(slug), failed: false };
  } catch (error) {
    console.error(`Failed to load CMS page "${slug}":`, error);
    return { page: null, failed: true };
  }
}

/**
 * Public page whose body comes from the CMS. Visitors see a calm Turkish
 * pending/error state; the CMS shortcut only appears for signed-in editors.
 */
export async function CmsBackedPage({ slug }: CmsBackedPageProps) {
  const { page, failed } = await loadPage(slug);
  const components = page?.components ?? [];
  const { cmsPage } = getPublicCopy();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {components.length > 0 ? (
          <PageRenderer components={components} />
        ) : (
          <PageNotice
            title={failed ? cmsPage.errorTitle : cmsPage.pendingTitle}
            body={failed ? cmsPage.errorBody : cmsPage.pendingBody}
          >
            <Button asChild>
              <Link href="/">{cmsPage.backHome}</Link>
            </Button>
            <CmsEditorLink />
          </PageNotice>
        )}
      </main>
      <Footer />
    </div>
  );
}

interface PageNoticeProps {
  title: string;
  body: string;
  children: ReactNode;
}

function PageNotice({ title, body, children }: PageNoticeProps) {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-4 text-3xl font-semibold md:text-4xl">{title}</h1>
        <p className="mb-8 text-lg text-muted-foreground">{body}</p>
        <div className="flex flex-wrap justify-center gap-4">{children}</div>
      </div>
    </div>
  );
}
