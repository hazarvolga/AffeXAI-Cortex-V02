import { PageHero } from "@/components/common/page-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Network, Waypoints, Construction } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const disciplines = [
    {
        title: "Altyapı Mühendisliği",
        description: "Yol, su, kanalizasyon ve enerji gibi temel altyapı sistemlerinin tasarımı ve yönetimi için bütünsel çözümler.",
        href: "/solutions/infrastructure-design/infrastructure-engineering",
        icon: Network,
        image: "https://picsum.photos/seed/infra-eng/600/400",
        imageHint: "city infrastructure plan"
    },
    {
        title: "Yol & Demiryolu Tasarımı",
        description: "Hassas arazi modelleme, güzergah optimizasyonu ve sanat yapıları tasarımı ile verimli ulaşım ağları oluşturun.",
        href: "/solutions/infrastructure-design/road-railway-design",
        icon: Waypoints,
        image: "https://picsum.photos/seed/road-design/600/400",
        imageHint: "highway design software"
    },
    {
        title: "Köprü Tasarımı",
        description: "Parametrik modelleme, yapısal analiz ve detaylandırma özelliklerini birleştiren Allplan Bridge ile ikonik köprüler tasarlayın.",
        href: "/solutions/infrastructure-design/bridge-design",
        icon: Construction,
        image: "https://picsum.photos/seed/bridge-design-2/600/400",
        imageHint: "bridge architectural model"
    }
];

export default function InfrastructureDesignPage() {
    return (
        <div>
            <PageHero 
                title="Altyapı Tasarımı"
                subtitle="Yol, köprü, demiryolu ve genel altyapı projeleriniz için güçlü, entegre ve özel BIM çözümleri."
            />
            
            <div className="container mx-auto py-16 px-4">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold">Geleceğin Bağlantılarını Kurun</h2>
                    <p className="text-lg text-muted-foreground mt-4">
                        Allplan altyapı çözümleri, en karmaşık projelerde bile verimliliği, disiplinler arası işbirliğini ve kaliteyi artırmak için tasarlanmıştır.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {disciplines.map((item) => (
                        <Card key={item.title} className="overflow-hidden flex flex-col group">
                            <div className="relative aspect-[16/9]">
                                <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" data-ai-hint={item.imageHint}/>
                            </div>
                            <CardHeader>
                                <CardTitle className="flex items-start gap-3">
                                    <item.icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                                    {item.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription>{item.description}</CardDescription>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href={item.href}>
                                        Detayları İncele
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                 <section className="text-center py-20 mt-16 bg-secondary/50 rounded-lg">
                    <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4">Altyapı Projeniz İçin Doğru Çözüm</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                        Uzman ekibimizle bir demo planlayın ve Allplan'ın projenizi nasıl bir üst seviyeye taşıyabileceğini keşfedin.
                    </p>
                     <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                       <Link href="/contact">Demo Talep Edin</Link>
                    </Button>
                </section>
            </div>
        </div>
    );
}
