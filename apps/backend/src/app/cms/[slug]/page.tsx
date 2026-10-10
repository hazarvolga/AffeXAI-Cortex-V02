'use client';

import React, { useEffect, useState } from 'react';
import { CmsPageRenderer } from '@/components/cms/cms-page-renderer';
import { cmsService } from '@/lib/cms/cms-service';
import { usePageViewTracking } from '@/hooks/use-cms-tracking';

interface PageParams {
  slug: string;
}

interface PageProps {
  params: PageParams;
}

const CmsPage: React.FC<PageProps> = ({ params }) => {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const pageData = await cmsService.getPageBySlug(params.slug);
        setPage(pageData);
      } catch (err) {
        setError('Failed to load page');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [params.slug]);

  // Track page view when page is loaded
  usePageViewTracking({
    pageId: page?.id || '',
    pageTitle: page?.title || params.slug,
    category: page?.category?.name || 'Uncategorized',
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Loading page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Page not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <CmsPageRenderer page={page} />
    </div>
  );
};

export default CmsPage;