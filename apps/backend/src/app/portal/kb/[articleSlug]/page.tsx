
'use client'
import { kbArticles, kbCategories } from "@/lib/kb-data";
import { notFound } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Tag, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ArticlePage({ params }: { params: { articleSlug: string } }) {
    const article = kbArticles.find(a => a.slug === params.articleSlug);
    if (!article) {
        notFound();
    }

    const category = kbCategories.find(c => c.id === article.categoryId);
    const relatedArticles = kbArticles.filter(a => a.categoryId === article.categoryId && a.id !== article.id).slice(0, 3);

    return (
        <div className="flex-1 space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/portal/kb">Bilgi Bankası</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    {category && (
                        <>
                         <BreadcrumbItem>
                            <BreadcrumbLink href="#">{category.name}</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        </>
                    )}
                    <BreadcrumbItem>
                        <BreadcrumbPage>{article.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="grid lg:grid-cols-4 gap-8 items-start">
                <article className="lg:col-span-3 prose dark:prose-invert max-w-none">
                    <h1>{article.title}</h1>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground not-prose mb-8">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={article.author.avatarUrl} />
                                <AvatarFallback>{article.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {article.author.name}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4"/>
                            Son Güncelleme: {new Date(article.lastUpdated).toLocaleDateString('tr-TR')}
                        </div>
                         <div className="flex items-center gap-2">
                             <Tag className="h-4 w-4" />
                            {article.tags.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    </div>

                    <p className="lead">{article.excerpt}</p>
                    
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />

                    <Card className="mt-12 not-prose bg-secondary/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Bu makale yardımcı oldu mu?</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                           <Button variant="outline"><ThumbsUp className="mr-2"/> Evet</Button>
                           <Button variant="outline"><ThumbsDown className="mr-2"/> Hayır</Button>
                        </CardContent>
                    </Card>
                </article>

                <aside className="lg:col-span-1 space-y-6 sticky top-24">
                     <Card>
                        <CardHeader>
                            <CardTitle>İlgili Makaleler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {relatedArticles.map(rel => (
                                    <li key={rel.id}>
                                        <Link href={`/portal/kb/${rel.slug}`} className="text-primary hover:underline">
                                            {rel.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
