import { PageHero } from "@/components/common/page-hero";
import { Breadcrumb } from "@/components/common/breadcrumb";

export default function TermsPage() {
    return (
        <div>
            <PageHero 
                title="Kullanım Koşulları"
            />
            <Breadcrumb items={[{ name: 'Kullanım Koşulları', href: '/terms' }]} />
            <div className="container mx-auto py-12 px-4 prose lg:prose-xl">
                <h2>Kullanım Koşulları</h2>
                <p>
                   Aluplan Digital web sitesine hoş geldiniz. Bu web sitesini kullanarak, aşağıdaki kullanım koşullarını kabul etmiş olursunuz. Lütfen bu koşulları dikkatlice okuyun.
                </p>
                <h3>Fikri Mülkiyet</h3>
                <p>
                    Bu sitedeki tüm içerik, metinler, grafikler, logolar, görseller ve yazılımlar dahil olmak üzere Aluplan Digital'in mülkiyetindedir ve telif hakkı yasalarıyla korunmaktadır.
                </p>
                <h3>Sorumluluğun Reddi</h3>
                <p>
                    Bu sitede yer alan bilgiler yalnızca genel bilgilendirme amaçlıdır. Bilgilerin doğruluğunu ve güncelliğini sağlamak için çaba göstersek de, herhangi bir garanti vermemekteyiz.
                </p>
                 <h3>Değişiklikler</h3>
                <p>
                    Bu kullanım koşullarını herhangi bir zamanda değiştirme hakkını saklı tutarız. Değişiklikler bu sayfada yayınlandığı andan itibaren geçerli olacaktır.
                </p>
            </div>
        </div>
    );
}
