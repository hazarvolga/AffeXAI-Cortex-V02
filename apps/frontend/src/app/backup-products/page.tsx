
import { PageHero } from "@/components/common/page-hero";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { productsData } from "@/lib/products-data";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ProductsPage() {
    return (
        <div>
            <PageHero 
                title="Ürünler"
                subtitle="İhtiyaçlarınıza özel olarak tasarlanmış, sektör lideri Allplan ve iş ortağı ürünlerini keşfedin."
            />
            <Breadcrumb items={[{ name: 'Ürünler', href: '/products' }]} />
            <div className="container mx-auto py-16 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {productsData.map((product) => (
                        <Card key={product.id} className="flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="relative aspect-video">
                                <Image 
                                    src={product.imageUrl} 
                                    alt={product.title} 
                                    fill 
                                    className="object-cover"
                                    data-ai-hint={product.imageHint}
                                />
                            </div>
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-primary/10 p-2 rounded-md">
                                        <product.Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{product.title}</CardTitle>
                                        <CardDescription>{product.category}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground mb-4">{product.description}</p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full" variant="secondary">
                                    <Link href={`/products/${product.id}`}>
                                        Kategoriyi İncele
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
