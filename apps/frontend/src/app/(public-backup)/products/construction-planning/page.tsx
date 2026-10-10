
import { PageHero } from "@/components/common/page-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, GanttChart, Factory, Construction } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const softwareList = [
    {
        title: "Allplan Precast - Prekast Detaylandırma",
        description: "Prefabrik beton elemanların tasarımı, detaylandırılması ve imalat verilerinin oluşturulması için lider çözüm.",
        href: "/products/allplan/precast",
        icon: Factory,
        image: "https://picsum.photos/seed/precast-planning/800/450",
        imageHint: "precast concrete elements",
    },
    {
        title: "Tim - Prekast İş Planlaması",
        description: "Prefabrik üretim tesisleri için özel olarak geliştirilmiş, iş akışı ve kaynak planlaması sağlayan ERP çözümü.",
        href: "/products/construction-planning/tim",
        icon: GanttChart,
        image: "https://picsum.photos/seed/tim-planning/800/450",
        imageHint: "factory production planning",
    },
    {
        title: "SDS/2 - Çelik Detaylandırma ve İmalatı",
        description: "Çelik yapıların 3B modellemesi, bağlantı tasarımı ve imalat otomasyonu için akıllı ve güçlü bir yazılım.",
        href: "/products/construction-planning/sds2",
        icon: Construction,
        image: "https://picsum.photos/seed/sds2-planning/800/450",
        imageHint: "steel structure modeling",
    }
];

export default function ConstructionPlanningPage() {
    return (
        <div>
            <PageHero 
                title="İnşaat Planlama Yazılımları"
                subtitle="İnşaat süreçlerinizi optimize eden, detaylandırma ve imalatı kolaylaştıran özel yazılımlar."
            />
            
            <div className="container mx-auto py-16 px-4">
                 <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold">Tasarım Ofisinden Şantiyeye Kusursuz Akış</h2>
                    <p className="text-lg text-muted-foreground mt-4">
                        İnşaat planlama çözümlerimiz, proje verimliliğini artırmak, hataları azaltmak ve imalat süreçlerini otomatikleştirmek için tasarlanmıştır.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
                    {softwareList.map((software) => (
                        <Card key={software.title} className="flex flex-col group overflow-hidden">
                            <div className="relative aspect-video">
                                <Image src={software.image} alt={software.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" data-ai-hint={software.imageHint} />
                            </div>
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg mt-1">
                                        <software.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>{software.title}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription>{software.description}</CardDescription>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href={software.href}>
                                        Daha Fazla Bilgi
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
