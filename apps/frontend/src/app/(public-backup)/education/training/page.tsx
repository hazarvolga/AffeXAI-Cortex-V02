import { PageHero } from "@/components/common/page-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const trainingPrograms = [
    {
        title: "Allplan Temel Eğitimi (Mimari)",
        description: "Allplan'a yeni başlayan mimarlar ve öğrenciler için 2B çizim, 3B modelleme ve pafta hazırlama konularını içeren temel eğitim.",
        duration: "3 Gün (24 Saat)",
        level: "Başlangıç",
        image: "https://picsum.photos/seed/training1/600/400",
        imageHint: "architecture blueprint",
    },
    {
        title: "Allplan İleri Düzey (Yapısal)",
        description: "Deneyimli inşaat mühendisleri için parametrik donatı modelleme, PythonParts kullanımı ve Bimplus entegrasyonu.",
        duration: "2 Gün (16 Saat)",
        level: "İleri",
        image: "https://picsum.photos/seed/training2/600/400",
        imageHint: "structural engineering model"
    },
    {
        title: "Allplan Bridge Eğitimi",
        description: "Köprü mühendislerine özel, parametrik modelleme, analiz ve detaylandırma konularını kapsayan kapsamlı eğitim.",
        duration: "4 Gün (32 Saat)",
        level: "Orta / İleri",
        image: "https://picsum.photos/seed/training3/600/400",
        imageHint: "bridge design software"
    },
    {
        title: "Kurumsal BIM Danışmanlığı",
        description: "Firmanızın ihtiyaçlarına özel BIM süreçleri oluşturma, standartlar geliştirme ve proje bazlı danışmanlık hizmetleri.",
        duration: "Değişken",
        level: "Tüm Seviyeler",
        image: "https://picsum.photos/seed/training4/600/400",
        imageHint: "business meeting collaboration"
    }
];

export default function TrainingPage() {
    return (
        <div>
            <PageHero 
                title="Eğitim & Danışmanlık"
                subtitle="Allplan yetkinliğinizi en üst düzeye çıkarmak için tasarlanmış eğitim programları ve danışmanlık hizmetleri."
            />
            
            <div className="container mx-auto py-16 px-4">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold">Size Uygun Programı Seçin</h2>
                    <p className="text-lg text-muted-foreground mt-4">
                        İster yeni başlıyor olun, ister uzmanlığınızı derinleştirmek isteyin, kariyer hedeflerinize uygun bir eğitim programımız mutlaka vardır.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {trainingPrograms.map((program) => (
                        <Card key={program.title} className="overflow-hidden flex flex-col group">
                            <div className="relative aspect-[16/9]">
                                <Image src={program.image} alt={program.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" data-ai-hint={program.imageHint} />
                            </div>
                            <CardHeader>
                                <CardTitle>{program.title}</CardTitle>
                                <CardDescription>{program.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex justify-between text-sm text-muted-foreground border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>{program.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{program.level}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href="/contact">
                                        Bilgi Al & Kayıt Ol
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
