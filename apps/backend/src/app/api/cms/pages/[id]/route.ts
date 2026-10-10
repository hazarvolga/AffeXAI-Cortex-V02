import { NextResponse } from 'next/server';
import { pages } from '../../../../../lib/cms-data';

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log('CMS API GET /cms/pages/:id request, id:', params.id);
  
  const page = pages.find((p: any) => p.id === params.id);
  if (page) {
    return NextResponse.json(convertPageData(page));
  }
  return NextResponse.json({ error: 'Page not found' }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  console.log('CMS API PATCH /cms/pages/:id request, id:', params.id);
  
  const page = pages.find((p: any) => p.id === params.id);
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }
  
  const data = await request.json();
  
  // In a real implementation, we would update this in a database
  // For now, we'll just return the updated data as if it was saved
  const updatedPage = {
    ...convertPageData(page),
    ...data,
    id: page.id, // Preserve ID
    updatedAt: new Date().toISOString()
  };
  
  console.log('Updated page:', updatedPage);
  return NextResponse.json(updatedPage);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  console.log('CMS API DELETE /cms/pages/:id request, id:', params.id);
  
  const page = pages.find((p: any) => p.id === params.id);
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }
  
  // In a real implementation, we would delete this from a database
  // For now, we'll just return success as if it was deleted
  console.log('Deleted page:', params.id);
  return NextResponse.json({ success: true });
}