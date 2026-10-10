'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { helpHref, helpRequestHeaders } from '../help-tenant';


interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  tags: string[];
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/knowledge-base/article?slug=${encodeURIComponent(slug)}`, { headers: helpRequestHeaders() });

      if (response.ok) {
        const data = await response.json();
        setArticle(data);
        setRelatedArticles([]);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!article || feedbackSubmitted) return;

    try {
      setSubmittingFeedback(true);

      const response = await fetch(`/api/knowledge-base/article-feedback?slug=${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...helpRequestHeaders(),
        },
        body: JSON.stringify({ helpful }),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        // Update local counts
        if (helpful) {
          setArticle({
            ...article,
            helpfulCount: article.helpfulCount + 1,
          });
        } else {
          setArticle({
            ...article,
            notHelpfulCount: article.notHelpfulCount + 1,
          });
        }
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Makale Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">
              Aradığınız makale bulunamadı veya yayından kaldırılmış olabilir.
            </p>
            <Link href={helpHref('/help')}>
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Yardım Merkezine Dön
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Link href={helpHref('/help')}>
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Yardım Merkezine Dön
        </Button>
      </Link>

      {/* Article Header */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-3">{article.title}</CardTitle>
                <p className="text-muted-foreground text-lg">{article.summary}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-sm">
                {article.category.name}
              </Badge>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {article.author.firstName} {article.author.lastName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(article.createdAt).toLocaleDateString('tr-TR')}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.viewCount} görüntülenme
              </span>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <Separator />

        {/* Article Content */}
        <CardContent className="pt-6">
          <div
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
          />
        </CardContent>

        <Separator />

        {/* Feedback Section */}
        <CardContent className="pt-6">
          <div className="bg-muted rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-3">Bu makale yardımcı oldu mu?</h3>

            {feedbackSubmitted ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>Geri bildiriminiz için teşekkürler!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleFeedback(true)}
                  disabled={submittingFeedback}
                  className="flex items-center gap-2"
                >
                  <ThumbsUp className="h-5 w-5" />
                  Evet ({article.helpfulCount})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFeedback(false)}
                  disabled={submittingFeedback}
                  className="flex items-center gap-2"
                >
                  <ThumbsDown className="h-5 w-5" />
                  Hayır ({article.notHelpfulCount})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">İlgili Makaleler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={helpHref(`/help/${related.slug}`)}>
                  <div className="p-4 border rounded-lg hover:bg-accent hover:border-primary/50 transition-all cursor-pointer">
                    <h4 className="font-semibold mb-1">{related.title}</h4>
                    <p className="text-sm text-muted-foreground">{related.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
