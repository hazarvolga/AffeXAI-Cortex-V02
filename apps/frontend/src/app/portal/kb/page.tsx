
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Folder, FileText, Star, Clock } from "lucide-react";
import Link from "next/link";
import { kbCategories, kbArticles } from "@/lib/kb-data";
import { Badge } from "@/components/ui/badge";

export default function KnowledgeBasePage() {
    const popularArticles = [...kbArticles].sort((a, b) => b.views - a.views).slice(0, 4);
    const recentArticles = [...kbArticles].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 4);

    return (
        <div className="flex-1 space-y-8">
            {/* Header and Search */}
            <div className="text-center py-12 bg-card border rounded-lg">
                <h1 className="text-4xl font-bold tracking-tight">Bilgi Bankası</h1>
                <p className="mt-2 text-lg text-muted-foreground">Aradığınız çözümü burada bulabilirsiniz.</p>
                <div className="mt-6 max-w-2xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Bir soru sorun veya anahtar kelimeyle arayın..."
                            className="w-full pl-10 h-12 text-base"
                        />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <section>
                <h2 className="text-2xl font-bold mb-4">Kategoriler</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {kbCategories.map(category => (
                        <Link href="#" key={category.id}>
                            <Card className="group hover:border-primary hover:shadow-lg transition-all h-full">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <category.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg">{category.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{category.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-8">
                 {/* Popular Articles */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Star className="text-yellow-500"/> Popüler Makaleler</h2>
                     <Card>
                        <CardContent className="p-0">
                           <ul className="divide-y">
                             {popularArticles.map(article => (
                                <li key={article.id} className="p-4 hover:bg-muted/50">
                                    <Link href={`/portal/kb/${article.slug}`}>
                                        <h3 className="font-semibold">{article.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{article.excerpt}</p>
                                    </Link>
                                </li>
                            ))}
                           </ul>
                        </CardContent>
                    </Card>
                </section>

                {/* Recent Articles */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Clock /> En Son Eklenenler</h2>
                    <Card>
                        <CardContent className="p-0">
                           <ul className="divide-y">
                             {recentArticles.map(article => (
                                <li key={article.id} className="p-4 hover:bg-muted/50">
                                    <Link href={`/portal/kb/${article.slug}`}>
                                        <h3 className="font-semibold">{article.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{article.excerpt}</p>
                                    </Link>
                                </li>
                            ))}
                           </ul>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
