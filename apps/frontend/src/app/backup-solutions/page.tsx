
import { PageHero } from "@/components/common/page-hero";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { solutionsData } from "@/lib/solutions-data";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function SolutionsPage() {
    return (
        <div>
            <PageHero 
                title="Çözümler"
                subtitle="Sektörünüz ne olursa olsun, projenizin her aşaması için güçlü ve esnek bir çözümümüz var."
            />
            <Breadcrumb items={[{ name: 'Çözümler', href: '/solutions' }]} />
            
            <div className="container mx-auto py-16 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {solutionsData.map((solution) => (
                        <Card key={solution.id} className="flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-primary/10 p-2 rounded-md">
                                        <solution.Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">{solution.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground mb-4">{solution.description}</p>
                                <ul className="space-y-2 text-sm">
                                    {solution.items.map(item => (
                                        <li key={item.title}>
                                            <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                                                <ArrowRight className="h-3 w-3 text-primary/50" /> {item.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <div className="p-6 pt-0 mt-auto">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={`/solutions/${solution.id}`}>
                                        Daha Fazla Bilgi
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
