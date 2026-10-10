import { NextResponse } from 'next/server';
import { pages } from '@/lib/cms-data';

// Helper function to delay responses for realistic simulation
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  await delay(100); // Small delay to simulate network request
  
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const searchParams = url.searchParams;
  
  console.log('CMS API GET request:', url.pathname, pathParts);
  
  // Handle /cms/pages endpoint (list all pages)
  if (pathParts.length === 2 && pathParts[0] === 'cms' && pathParts[1] === 'pages') {
    const status = searchParams.get('status');
    console.log('Listing pages with status:', status);
    
    let filteredPages = pages.map(convertPageData);
    if (status) {
      filteredPages = filteredPages.filter((page: any) => page.status === status);
    }
    
    return NextResponse.json(filteredPages);
  }
  
  // Handle /cms/pages/slug/:slug endpoint (get page by slug)
  if (pathParts.length === 4 && pathParts[0] === 'cms' && pathParts[1] === 'pages' && pathParts[2] === 'slug') {
    const slug = pathParts[3] === 'home' ? '/' : `/${pathParts[3]}`;
    console.log('Getting page by slug:', slug);
    
    const page = pages.find((p: any) => p.slug === slug);
    if (page) {
      return NextResponse.json(convertPageData(page));
    }
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }
  
  // Handle /cms/pages/:id endpoint (get page by ID)
  if (pathParts.length === 3 && pathParts[0] === 'cms' && pathParts[1] === 'pages') {
    const id = pathParts[2];
    console.log('Getting page by ID:', id);
    
    const page = pages.find((p: any) => p.id === id);
    if (page) {
      return NextResponse.json(convertPageData(page));
    }
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }
  
  // Default fallback - for root /cms endpoint, return all pages
  if (pathParts.length === 1 && pathParts[0] === 'cms') {
    return NextResponse.json(pages.map(convertPageData));
  }
  
  // Default fallback
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function POST(request: Request) {
  await delay(100); // Small delay to simulate network request
  
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  console.log('CMS API POST request:', url.pathname, pathParts);
  
  // Handle /cms/pages endpoint (create new page)
  if (pathParts.length === 2 && pathParts[0] === 'cms' && pathParts[1] === 'pages') {
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
  
  // Default fallback
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function PATCH(request: Request) {
  await delay(100); // Small delay to simulate network request
  
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  console.log('CMS API PATCH request:', url.pathname, pathParts);
  
  // Handle /cms/pages/:id endpoint (update page)
  if (pathParts.length === 3 && pathParts[0] === 'cms' && pathParts[1] === 'pages') {
    const id = pathParts[2];
    const data = await request.json();
    
    const page = pages.find((p: any) => p.id === id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    
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
  
  // Default fallback
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function DELETE(request: Request) {
  await delay(100); // Small delay to simulate network request
  
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  console.log('CMS API DELETE request:', url.pathname, pathParts);
  
  // Handle /cms/pages/:id endpoint (delete page)
  if (pathParts.length === 3 && pathParts[0] === 'cms' && pathParts[1] === 'pages') {
    const id = pathParts[2];
    
    const page = pages.find((p: any) => p.id === id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    
    // In a real implementation, we would delete this from a database
    // For now, we'll just return success as if it was deleted
    console.log('Deleted page:', id);
    return NextResponse.json({ success: true });
  }
  
  // Default fallback
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}