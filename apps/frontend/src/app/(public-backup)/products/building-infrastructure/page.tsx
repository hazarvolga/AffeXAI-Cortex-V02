
import { PageHero } from "@/components/common/page-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Construction, Thermometer } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const softwareList = [
    {
        title: "Allplan - AEC Endüstrisi için BIM",
        description: "Mimari, mühendislik ve inşaat (AEC) profesyonelleri için entegre, disiplinler arası bir BIM platformu.",
        href: "/products/building-infrastructure/allplan-aec",
        icon: Building2,
        image: "https://picsum.photos/seed/aec-software/800/450",
        imageHint: "bim model building",
    },
    {
        title: "Allplan Bridge - Köprü Tasarımı",
        description: "Parametrik modelleme, yapısal analiz ve detaylandırma özelliklerini bir araya getiren eksiksiz köprü mühendisliği çözümü.",
        href: "/products/building-infrastructure/allplan-bridge",
        icon: Construction,
        image: "https://picsum.photos/seed/bridge-software/800/450",
        imageHint: "bridge design software",
    },
    {
        title: "AX3000 - Enerji Simülasyonu",
        description: "Binaların enerji verimliliğini analiz etmek ve TGA (HVAC) sistemlerini tasarlamak için kullanılan güçlü bir araç.",
        href: "/products/building-infrastructure/ax3000",
        icon: Thermometer,
        image: "https://picsum.photos/seed/hvac-software/800/450",
        imageHint: "hvac system blueprint",
    }
];

export default function BuildingInfrastructurePage() {
    return (
        <div>
            <PageHero 
                title="Bina ve Altyapı Yazılımları"
                subtitle="Bina ve altyapı projelerinizin her aşaması için güçlü, entegre ve özel yazılım çözümleri."
            />
            
            <div className="container mx-auto py-16 px-4">
                 <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold">Projelerinizi Geleceğe Taşıyın</h2>
                    <p className="text-lg text-muted-foreground mt-4">
                        Allplan ve iş ortağı çözümleri, en karmaşık bina ve altyapı projelerinde bile verimliliği, işbirliğini ve kaliteyi artırmak için tasarlanmıştır.
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
