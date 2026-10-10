import { PageHero } from "@/components/common/page-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Building, Construction, HardHat, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const disciplines = [
    {
        title: "Mimari Tasarım",
        description: "Yaratıcılığınızı serbest bırakın ve konsept aşamasından uygulama çizimlerine kadar tüm süreci Allplan'ın esnek araçlarıyla yönetin.",
        href: "/solutions/building-design/architecture",
        icon: Building,
    },
    {
        title: "Yapısal Mühendislik",
        description: "Betonarme ve çelik yapılar için hassas modelleme, donatı detaylandırma ve analiz entegrasyonu ile güvenli yapılar inşa edin.",
        href: "/solutions/building-design/structural-engineering",
        icon: Construction,
    },
    {
        title: "MEP Mühendisliği",
        description: "Bina sistemlerini (HVAC, elektrik, sıhhi tesisat) 3D olarak tasarlayın ve çakışma kontrolü ile diğer disiplinlerle tam koordine edin.",
        href: "/solutions/building-design/mep",
        icon: HardHat,
    }
];

const features = [
    {
        title: "Entegre İş Akışları",
        description: "Mimari, yapısal ve MEP tasarımlarını tek bir çatı altında birleştirerek hataları azaltın ve proje verimliliğini en üst düzeye çıkarın.",
        icon: Check
    },
    {
        title: "Yüksek Detay Seviyesi (LOD)",
        description: "Kavramsal tasarımdan imalat çizimlerine (LOD 500) kadar projenizin her aşaması için gereken detay seviyesini kolayca yakalayın.",
        icon: Check
    },
    {
        title: "Otomatik Raporlama ve Metraj",
        description: "Modelinizden tek tıkla otomatik olarak kesitler, görünüşler, paftalar, metrajlar ve raporlar oluşturarak zamandan tasarruf edin.",
        icon: Check
    },
     {
        title: "Görselleştirme ve Sunum",
        description: "Yüksek kaliteli render motoru ve animasyon araçları ile tasarımlarınızı etkileyici bir şekilde sunun ve paydaşlarınızı ikna edin.",
        icon: Check
    }
];

export default function BuildingDesignPage() {
    return (
        <div>
            <PageHero 
                title="Bina Tasarımı"
                subtitle="Mimari, strüktürel mühendislik ve MEP (Mekanik, Elektrik, Sıhhi Tesisat) için entegre ve kapsamlı BIM çözümleri."
                backgroundImage="https://picsum.photos/seed/building-design-hero/1920/600"
                className="text-white"
            />
            
            
            <div className="container mx-auto py-16 px-4">
                <section className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold mb-4 font-headline">Tasarım ve İnşaat Arasındaki Köprü</h2>
                    <p className="text-lg text-muted-foreground">
                        Allplan, bina projelerinin tüm yaşam döngüsü boyunca disiplinler arası işbirliğini geliştirmek için tasarlanmıştır. Yenilikçi araçlarımızla, daha hızlı, daha kaliteli ve daha uygun maliyetli binalar tasarlayabilirsiniz.
                    </p>
                </section>

                <section className="grid md:grid-cols-3 gap-8 mb-20">
                    {disciplines.map(discipline => (
                       <Card key={discipline.title} className="text-center flex flex-col group hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                            <CardHeader className="items-center">
                                <div className="p-4 bg-primary/10 rounded-full mb-4 transition-colors duration-300 group-hover:bg-accent">
                                    <discipline.icon className="h-10 w-10 text-primary transition-colors duration-300 group-hover:text-accent-foreground" />
                                </div>
                                <CardTitle>{discipline.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription>{discipline.description}</CardDescription>
                            </CardContent>
                            <div className="p-6 pt-0">
                               <Button variant="ghost" asChild className="text-primary group-hover:text-accent-foreground">
                                    <Link href={discipline.href}>
                                        Daha Fazla Bilgi <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </section>

                <section className="grid lg:grid-cols-2 gap-12 items-center bg-secondary/30 p-8 rounded-lg">
                    <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                        <Image src="https://picsum.photos/seed/building-bim/800/450" alt="BIM Modeli" fill className="object-cover" data-ai-hint="bim model building"/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-6 font-headline">Neden Bina Tasarımı için Allplan?</h3>
                        <ul className="space-y-6">
                            {features.map(feature => (
                                <li key={feature.title} className="flex items-start gap-4">
                                    <div className="bg-green-100 text-green-700 rounded-full p-2 mt-1 flex-shrink-0">
                                        <feature.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">{feature.title}</h4>
                                        <p className="text-muted-foreground">{feature.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                 <section className="text-center py-20 mt-16 bg-primary/5 rounded-lg">
                    <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4">Projenizi Bir Sonraki Seviyeye Taşımaya Hazır Mısınız?</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                        Uzman ekibimizle bir demo planlayın veya bina tasarımı çözümlerimiz hakkında daha fazla bilgi edinmek için broşürümüzü indirin.
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">Demo Talep Edin</Button>
                        <Button size="lg" variant="outline">Broşürü İndir</Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
