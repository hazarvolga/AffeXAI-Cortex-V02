"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  BookOpen,
  TrendingUp,
  Eye,
  ThumbsUp,
  ChevronRight,
  Loader2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { helpHref, helpRequestHeaders } from "./help-tenant";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { marketingPath } from "@/lib/marketing/routes";

const helpCopy = getPublicCopy().help;

interface HelpNoticeProps {
  title: string;
  body: string;
  role?: "alert" | "status";
  children: React.ReactNode;
}

/** Empty, error and no-results states share one calm layout with a next step. */
function HelpNotice({
  title,
  body,
  role = "status",
  children,
}: HelpNoticeProps) {
  return (
    <div
      role={role}
      className="rounded-md border border-border px-6 py-10 text-center"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: {
    id: string;
    name: string;
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
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  articleCount: number;
}

interface HelpOverview {
  featured: Article[];
  popular: Article[];
  categories: Category[];
  /** True only when every overview request failed; partial data still renders. */
  failed: boolean;
}

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  return response.ok ? ((await response.json()) as T) : fallback;
}

async function fetchHelpOverview(): Promise<HelpOverview> {
  try {
    const [featuredRes, popularRes, categoriesRes] = await Promise.all([
      fetch("/api/knowledge-base/featured", { headers: helpRequestHeaders() }),
      fetch("/api/knowledge-base/popular", { headers: helpRequestHeaders() }),
      fetch("/api/knowledge-base/categories", {
        headers: helpRequestHeaders(),
      }),
    ]);
    return {
      featured: await readJson<Article[]>(featuredRes, []),
      popular: await readJson<Article[]>(popularRes, []),
      categories: await readJson<Category[]>(categoriesRes, []),
      failed: !featuredRes.ok && !popularRes.ok && !categoriesRes.ok,
    };
  } catch (error) {
    console.error("Failed to fetch initial data:", error);
    return { featured: [], popular: [], categories: [], failed: true };
  }
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    fetchHelpOverview().then((overview) => {
      if (!active) return;
      setFeaturedArticles(overview.featured);
      setPopularArticles(overview.popular);
      setCategories(overview.categories);
      setLoadFailed(overview.failed);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const retryInitialData = () => {
    setLoading(true);
    setLoadFailed(false);
    setReloadToken((token) => token + 1);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSearching(true);
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append("query", searchQuery);
      }

      if (selectedCategory) {
        params.append("categoryId", selectedCategory);
      }

      const response = await fetch(
        `/api/knowledge-base/search?${params.toString()}`,
        {
          headers: helpRequestHeaders(),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles ?? []);
        setHasSearched(true);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSearchQuery("");
    setArticles([]);
    setHasSearched(false);
  };

  const isEmpty =
    categories.length === 0 &&
    featuredArticles.length === 0 &&
    popularArticles.length === 0;

  if (loading) {
    return (
      <main className="container mx-auto p-6" aria-busy="true">
        <h1 className="sr-only">Yardım Merkezi</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2
            aria-hidden="true"
            className="h-12 w-12 animate-spin text-primary"
          />
        </div>
      </main>
    );
  }

  if (loadFailed) {
    return (
      <main className="container mx-auto p-6 space-y-8">
        <h1 className="text-4xl font-bold text-center">Yardım Merkezi</h1>
        <HelpNotice
          role="alert"
          title={helpCopy.errorTitle}
          body={helpCopy.errorBody}
        >
          <Button onClick={retryInitialData}>{helpCopy.retry}</Button>
        </HelpNotice>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <BookOpen className="h-10 w-10 text-primary" />
          Yardım Merkezi
        </h1>
        <p className="text-muted-foreground text-lg">
          Sorularınıza cevap bulun, rehberleri inceleyin
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ne aramak istersiniz?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={searching}>
              {searching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aranıyor...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Ara
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories */}
      {!isEmpty && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kategoriler</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => handleCategoryFilter(null)}
            >
              Tümü
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => handleCategoryFilter(category.id)}
              >
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {category.articleCount}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {isEmpty && !hasSearched && (
        <HelpNotice title={helpCopy.emptyTitle} body={helpCopy.emptyBody}>
          <Button asChild>
            <Link href={marketingPath("tr", "contact")}>
              {helpCopy.contactSupport}
            </Link>
          </Button>
        </HelpNotice>
      )}

      {hasSearched && articles.length === 0 && (
        <HelpNotice
          title={helpCopy.noResultsTitle}
          body={helpCopy.noResultsBody}
        >
          <Button variant="outline" onClick={() => handleCategoryFilter(null)}>
            {helpCopy.clearSearch}
          </Button>
        </HelpNotice>
      )}

      {/* Search Results */}
      {articles.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Arama Sonuçları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => (
              <Link key={article.id} href={helpHref(`/help/${article.slug}`)}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {article.summary}
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <Badge variant="secondary">{article.category.name}</Badge>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {article.helpfulCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Öne Çıkan Makaleler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredArticles.map((article) => (
              <Link key={article.id} href={helpHref(`/help/${article.slug}`)}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between">
                      <span className="flex-1">{article.title}</span>
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 flex-shrink-0 ml-2" />
                    </CardTitle>
                    <CardDescription>{article.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <Badge variant="secondary">{article.category.name}</Badge>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.viewCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Popular Articles */}
      {popularArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Popüler Makaleler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularArticles.map((article) => (
              <Link key={article.id} href={helpHref(`/help/${article.slug}`)}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {article.summary}
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <Badge variant="secondary">{article.category.name}</Badge>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {article.helpfulCount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
