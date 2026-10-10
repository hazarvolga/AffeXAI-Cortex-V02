import { PageHero } from "@/components/common/page-hero";
import { TimelineCarousel } from "@/components/timeline-carousel";
import { timelineData } from "@/lib/timeline-data";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CaseStudiesPage() {
    return (
        <div>
            <PageHero 
                title="Başarı Hikayeleri"
                subtitle="Allplan çözümlerinin, Türkiye ve dünyadan prestijli projelerde nasıl fark yarattığını keşfedin."
            />
            
            <TimelineCarousel />

            <div className="container mx-auto py-16 px-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-3xl font-bold">Tüm Başarı Hikayeleri</h2>
                    <div className="flex items-center gap-4">
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Bölge" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Bölgeler</SelectItem>
                                <SelectItem value="global">Global</SelectItem>
                                <SelectItem value="turkey">Türkiye</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Disiplin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Disiplinler</SelectItem>
                                <SelectItem value="structural">Yapısal</SelectItem>
                                <SelectItem value="civil">İnşaat</SelectItem>
                                <SelectItem value="bridge">Köprü</SelectItem>
                                <SelectItem value="precast">Prekast</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {timelineData.map(story => (
                        <Card key={story.id} className="overflow-hidden flex flex-col group">
                            <CardHeader className="p-0">
                                <div className="relative aspect-video">
                                    <Image 
                                        src={story.imageUrl} 
                                        alt={story.title} 
                                        fill 
                                        className="object-cover group-hover:scale-105 transition-transform duration-300" 
                                        data-ai-hint={story.imageHint}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-grow flex flex-col">
                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                    <Badge variant="secondary">{story.category}</Badge>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4"/>
                                        <span>{story.date}</span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-2 flex-grow group-hover:text-primary transition-colors">
                                    <Link href={story.ctaLink}>{story.title}</Link>
                                </h3>
                                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{story.excerpt}</p>
                            </CardContent>
                             <CardFooter className="p-6 pt-0">
                                <Button asChild className="w-full">
                                  <Link href={story.ctaLink}>
                                    Devamını Oku <ArrowRight className="ml-2 h-4 w-4" />
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
