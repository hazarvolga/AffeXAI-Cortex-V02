
import { PageHero } from "@/components/common/page-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Cloud, GanttChartSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const collaborationTools = [
    {
        title: "Bimplus – Disiplinlerarası İşbirliği",
        description: "Tüm proje verilerini merkezileştiren, disiplinler arası işbirliği, çakışma tespiti ve görev yönetimi için tasarlanmış açık BIM platformu.",
        href: "/products/collaboration/bimplus",
        icon: Cloud,
        features: [
            "Merkezi Model Yönetimi",
            "Görev ve Değişiklik Takibi",
            "Çakışma Kontrolü",
            "Açık BIM (IFC) Desteği"
        ]
    },
    {
        title: "Allplan Share",
        description: "Farklı lokasyonlardaki ekiplerin aynı Allplan projesi üzerinde gerçek zamanlı olarak birlikte çalışmasını sağlayan bulut tabanlı bir hizmet.",
        href: "/solutions/add-on-modules",
        icon: Users,
        features: [
            "Gerçek Zamanlı İşbirliği",
            "Proje Verilerine Anında Erişim",
            "Güvenli Veri Depolama",
            "Workgroup Manager ile Entegrasyon"
        ]
    },
    {
        title: "Allplan Workgroup Manager",
        description: "Ofis ağı içinde birden fazla kullanıcının aynı projeler üzerinde eş zamanlı olarak çalışmasına olanak tanıyan bir ağ yönetimi çözümü.",
        href: "/solutions/add-on-modules",
        icon: GanttChartSquare,
        features: [
            "Eş Zamanlı Proje Erişimi",
            "Kullanıcı Hakları Yönetimi",
            "Veri Tutarlılığı ve Güvenliği",
            "Ofis İçi Verimlilik Artışı"
        ]
    }
]

export default function CollaborationSoftwarePage() {
    return (
        <div>
            <PageHero 
                title="İşbirliği Yazılımları"
                subtitle="Proje paydaşlarınızı tek bir platformda birleştiren, verimliliği artıran ve hataları azaltan bulut tabanlı ve yerel işbirliği çözümleri."
            />
            
            <div className="container mx-auto py-16 px-4">
                 <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold font-headline">Birlikte Daha İyi İnşa Edin</h2>
                    <p className="text-lg text-muted-foreground mt-4">
                        Doğru işbirliği araçları, proje yaşam döngüsünün her aşamasında şeffaflık, verimlilik ve koordinasyon sağlar. Ekiplerinizi bir araya getirerek proje hedeflerinize daha hızlı ulaşın.
                    </p>
                </div>

                <div className="grid md:grid-cols-1 gap-12">
                    {collaborationTools.map((tool) => (
                         <Card key={tool.title} className="w-full overflow-hidden shadow-lg border-none bg-secondary/30">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                               <div className="p-8 md:p-12 flex flex-col justify-center">
                                   <div className="flex items-center gap-4 mb-4">
                                       <div className="bg-primary/10 p-3 rounded-lg">
                                            <tool.icon className="h-6 w-6 text-primary" />
                                       </div>
                                       <h3 className="text-2xl font-bold text-foreground font-headline leading-tight">
                                           {tool.title}
                                       </h3>
                                   </div>
                                   <p className="text-muted-foreground mb-6">
                                       {tool.description}
                                   </p>
                                   <ul className="space-y-3 text-muted-foreground mb-8">
                                       {tool.features.map(feature => (
                                           <li key={feature} className="flex items-center gap-3">
                                               <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0"></div>
                                               <span>{feature}</span>
                                           </li>
                                       ))}
                                   </ul>
                                   <div className="mt-auto">
                                       <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                                            <Link href={tool.href}>
                                                Daha Fazla Bilgi
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                   </div>
                               </div>
                                <div className="relative aspect-[4/3] lg:aspect-auto min-h-[300px]">
                                 <Image
                                   src={`https://picsum.photos/seed/${tool.href.replace(/\//g, '')}/800/600`}
                                   alt={tool.title}
                                   fill
                                   className="object-cover"
                                   data-ai-hint="team collaborating on computer"
                                 />
                               </div>
                             </div>
                           </Card>
                    ))}
                </div>

                <section className="text-center py-20 mt-16">
                    <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4">İşbirliği potansiyelinizi ortaya çıkarın.</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                        Projenizin ihtiyaçlarına en uygun işbirliği çözümünü bulmak için uzmanlarımızla görüşün.
                    </p>
                    <Button size="lg" asChild>
                       <Link href="/contact">Demo Talep Edin</Link>
                    </Button>
                </section>
            </div>
        </div>
    );
}
