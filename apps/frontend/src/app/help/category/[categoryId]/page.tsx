'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  BookOpen,
  Eye,
  ThumbsUp,
  ChevronRight,
  Loader2,
  Calendar,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { helpHref, helpRequestHeaders } from '../../help-tenant';

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isFeatured: boolean;
  publishedAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  articleCount: number;
  path: string[];
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryData();
    }
  }, [categoryId, page]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      
      const [categoryRes, articlesRes] = await Promise.all([
        fetch(`/api/knowledge-base/category-path?categoryId=${categoryId}`, { headers: helpRequestHeaders() }),
        fetch(`/api/knowledge-base/category-articles?categoryId=${categoryId}&limit=20&offset=${(page - 1) * 20}&includeSubcategories=true`, { headers: helpRequestHeaders() })
      ]);

      if (categoryRes.ok) {
        const categoryData = await categoryRes.json();
        setCategory(categoryData);
      }

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        if (page === 1) {
          setArticles(articlesData.articles || []);
        } else {
          setArticles(prev => [...prev, ...(articlesData.articles || [])]);
        }
        
        const total = articlesData.total || 0;
        setTotalPages(Math.ceil(total / 20));
        setHasMore(page < Math.ceil(total / 20));
      }
    } catch (error) {
      console.error('Failed to fetch category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const getIconEmoji = (iconName: string) => {
    const iconMap: Record<string, string> = {
      folder: '📁',
      book: '📚',
      file: '📄',
      tag: '🏷️',
      star: '⭐',
      heart: '❤️',
      info: 'ℹ️',
      help: '❓',
    };
    return iconMap[iconName] || '📁';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && page === 1) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Kategori bulunamadı</h1>
          <p className="text-muted-foreground mb-6">Aradığınız kategori mevcut değil.</p>
          <Link href={helpHref('/help')}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Yardım Merkezine Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={helpHref('/help')}>Yardım Merkezi</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {category.path.map((pathItem, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {index === category.path.length - 1 ? (
                  <BreadcrumbPage>{pathItem}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href="#">{pathItem}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < category.path.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Category Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg bg-${category.color}-100`}>
            <div className="text-2xl">
              {getIconEmoji(category.icon)}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground mt-2 text-lg">{category.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-3">
              <Badge variant="secondary">
                {category.articleCount} makale
              </Badge>
            </div>
          </div>
        </div>
        
        <Link href={helpHref('/help')}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
        </Link>
      </div>

      {/* Articles */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Makaleler</h2>
        
        {articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Henüz makale yok</h3>
              <p className="text-muted-foreground">
                Bu kategoride henüz yayınlanmış makale bulunmuyor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link key={article.id} href={helpHref(`/help/${article.slug}`)}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {article.isFeatured && (
                            <Badge variant="default" className="bg-yellow-500">
                              Öne Çıkan
                            </Badge>
                          )}
                          <Badge variant="outline">{article.category.name}</Badge>
                        </div>
                        
                        <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                        <p className="text-muted-foreground mb-4">{article.summary}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{article.author.firstName} {article.author.lastName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(article.publishedAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{article.viewCount} görüntülenme</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{article.helpfulCount} faydalı</span>
                          </div>
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-6">
                <Button 
                  onClick={loadMore} 
                  disabled={loading}
                  variant="outline"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    'Daha fazla makale yükle'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
