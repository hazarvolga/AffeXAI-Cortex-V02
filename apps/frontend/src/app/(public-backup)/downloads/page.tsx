import { PageHero } from "@/components/common/page-hero";
import { ResourcesSection } from "@/components/resources-section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";

const faqItems = [
    {
        question: "Allplan için sistem gereksinimleri nelerdir?",
        answer: "Allplan'ın güncel sürümü için önerilen sistem gereksinimleri: Windows 10/11 (64-bit), en az 16 GB RAM, 2 GB VRAM'li DirectX 11 uyumlu ekran kartı ve 50 GB boş disk alanı. Detaylı bilgi için teknik bilgi sayfamızı ziyaret edebilirsiniz."
    },
    {
        question: "Öğrenci lisansına nasıl başvurabilirim?",
        answer: "Allplan Campus portalı üzerinden öğrenci belgenizle birlikte ücretsiz öğrenci lisansı başvurusunda bulunabilirsiniz. Lisansınız bir yıl geçerlidir ve her yıl yenilenebilir."
    },
    {
        question: "Teknik destek nasıl alabilirim?",
        answer: "Müşteri portalımız üzerinden destek talebi oluşturabilir veya acil durumlar için destek hattımızı arayabilirsiniz. Ekibimiz en kısa sürede size yardımcı olacaktır."
    }
];

const customerLinks = [
    { title: "Allplan Connect", description: "Kullanıcı portalı, forumlar ve kaynaklar.", href: "#" },
    { title: "Bimplus Login", description: "Bulut tabanlı işbirliği platformuna erişin.", href: "#" },
    { title: "Allplan Exchange Login", description: "Proje verilerinizi güvenle paylaşın.", href: "#" },
];


export default function DownloadsPage() {
    return (
        <div>
            <PageHero 
                title="İndirme Merkezi & Destek"
                subtitle="Gerekli tüm kaynaklara, dokümanlara ve destek kanallarına buradan ulaşın."
            />
            
            
            <section id="faq" className="py-16 bg-secondary/30">
                <div className="container mx-auto px-4 max-w-4xl">
                     <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold">Sıkça Sorulan Sorular (SSS)</h2>
                        <p className="text-muted-foreground mt-2">Aklınıza takılan soruların yanıtlarını burada bulabilirsiniz.</p>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                        {faqItems.map((item, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger>{item.question}</AccordionTrigger>
                                <AccordionContent>{item.answer}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            <ResourcesSection/>

            <section id="customer" className="py-16">
                 <div className="container mx-auto px-4">
                     <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold">Müşteri Erişimi</h2>
                        <p className="text-muted-foreground mt-2">Lisans, abonelik ve proje yönetimi portallarınıza buradan ulaşın.</p>
                    </div>
                     <div className="grid md:grid-cols-3 gap-8">
                         {customerLinks.map(link => (
                             <Card key={link.title} className="text-center">
                                 <CardHeader>
                                     <CardTitle>{link.title}</CardTitle>
                                     <CardDescription>{link.description}</CardDescription>
                                 </CardHeader>
                                 <CardContent>
                                     <Button asChild>
                                         <Link href={link.href}>Giriş Yap <ExternalLink className="ml-2 h-4 w-4"/></Link>
                                     </Button>
                                 </CardContent>
                             </Card>
                         ))}
                     </div>
                 </div>
            </section>
        </div>
    );
}
