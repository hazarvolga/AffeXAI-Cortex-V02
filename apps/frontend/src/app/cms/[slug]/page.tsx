'use client';

import React, { useEffect, useState, use } from 'react';
import { PageRenderer } from '@/components/cms/page-renderer';
import { cmsService } from '@/lib/cms/cms-service';

interface PageParams {
  slug: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

const CmsPage: React.FC<PageProps> = ({ params }) => {
  const { slug } = use(params);
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const pageData = await cmsService.getPageBySlug(slug);
        setPage(pageData);
      } catch (err) {
        setError('Failed to load page');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

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

  return <PageRenderer components={page.components || []} />;
};

export default CmsPage;