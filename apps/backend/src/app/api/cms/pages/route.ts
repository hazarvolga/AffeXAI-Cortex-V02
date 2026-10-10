import { NextResponse } from 'next/server';
import { pages } from '../../../../lib/cms-data';

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  console.log('CMS API GET /cms/pages request');
  
  const status = searchParams.get('status');
  console.log('Listing pages with status:', status);
  
  let filteredPages = pages.map(convertPageData);
  if (status) {
    filteredPages = filteredPages.filter((page: any) => page.status === status);
  }
  
  return NextResponse.json(filteredPages);
}

export async function POST(request: Request) {
  const data = await request.json();
  
  // Create new page with default values
  const newPage = {
    id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: data.title || 'Untitled Page',
    slug: data.slug || `/page-${Date.now()}`,
    description: data.description || '',
    status: data.status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    components: [],
    layoutOptions: data.layoutOptions || {
      showHeader: true,
      showFooter: true,
      fullWidth: false,
      backgroundColor: 'bg-background',
      showTitle: true
    }
  };
  
  // In a real implementation, we would save this to a database
  // For now, we'll just return it as if it was saved
  console.log('Created new page:', newPage);
  return NextResponse.json(newPage);
}