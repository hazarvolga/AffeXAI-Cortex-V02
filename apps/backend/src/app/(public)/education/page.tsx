import { PageHero } from "@/components/common/page-hero";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { EducationSupportSection } from "@/components/education-support-section";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GraduationCap, LifeBuoy, BookOpen } from "lucide-react";
import Link from "next/link";

const highlights = [
    {
        title: "Eğitim & Danışmanlık",
        description: "Allplan yetkinliğinizi en üst düzeye çıkarmak için tasarlanmış eğitim programları ve danışmanlık hizmetleri.",
        href: "/education/training",
        icon: GraduationCap,
    },
    {
        title: "Sertifika Sorgulama",
        description: "Allplan sertifikalarınızın geçerliliğini anında doğrulayın ve profesyonel yetkinliğinizi kanıtlayın.",
        href: "/education/certification",
        icon: BookOpen,
    },
    {
        title: "Destek Merkezi",
        description: "Karşılaştığınız tüm sorunlar için teknik ekibimizden hızlı ve etkili destek alın.",
        href: "/downloads",
        icon: LifeBuoy,
    }
]

export default function EducationPage() {
    return (
        <div>
            <PageHero 
                title="Eğitim & Destek"
                subtitle="Bilgi birikiminizi artırın, kaynaklarımıza erişin ve ihtiyacınız olan desteği alın. Aluplan Digital olarak, başarınız için gerekli tüm araçları sağlıyoruz."
            />
            <Breadcrumb items={[{ name: 'Eğitim & Destek', href: '/education' }]} />

            <div className="container mx-auto py-16 px-4">
                 <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {highlights.map(item => (
                        <Link href={item.href} key={item.title}>
                            <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <item.icon className="h-10 w-10 text-primary" />
                                    <CardTitle>{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                 </div>
            </div>

            <EducationSupportSection />
        </div>
    );
}
