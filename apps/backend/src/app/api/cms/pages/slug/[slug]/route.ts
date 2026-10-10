import { NextResponse } from 'next/server';
import { pages } from '../../../../../../lib/cms-data';

// Convert the real data structure to what the frontend expects
const convertPageData = (page: any) => {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    description: page.seo?.description || '',
    status: page.status || 'draft',
    createdAt: page.lastUpdated || new Date().toISOString(),
    updatedAt: page.lastUpdated || new Date().toISOString(),
    publishedAt: page.status === 'published' ? page.lastUpdated : null,
    components: page.content || [],
    layoutOptions: {
      showHeader: true,
      showFooter: true,
      fullWidth: false,
      backgroundColor: 'bg-background',
      showTitle: true
    }
  };
};

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  console.log('CMS API GET /cms/pages/slug/:slug request, slug:', params.slug);
  
  const slug = params.slug === 'home' ? '/' : `/${params.slug}`;
  const page = pages.find((p: any) => p.slug === slug);
  if (page) {
    return NextResponse.json(convertPageData(page));
  }
  return NextResponse.json({ error: 'Page not found' }, { status: 404 });
}