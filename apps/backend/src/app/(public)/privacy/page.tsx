import { PageHero } from "@/components/common/page-hero";
import { Breadcrumb } from "@/components/common/breadcrumb";

export default function PrivacyPage() {
    return (
        <div>
            <PageHero 
                title="Gizlilik Politikası"
            />
            <Breadcrumb items={[{ name: 'Gizlilik Politikası', href: '/privacy' }]} />
            <div className="container mx-auto py-12 px-4 prose lg:prose-xl">
                <h2>Gizlilik Politikası</h2>
                <p>
                    Bu web sitesini ziyaret ettiğiniz için teşekkür ederiz. Gizliliğiniz bizim için önemlidir. Bu gizlilik politikası, Aluplan Digital'in bu web sitesi aracılığıyla topladığı kişisel bilgileri nasıl kullandığını açıklamaktadır.
                </p>
                <h3>Bilgi Toplama ve Kullanma</h3>
                <p>
                    Hizmetlerimizi sağlamak ve geliştirmek için çeşitli amaçlarla farklı türde bilgiler topluyoruz. Toplanan bilgiler, adınız, e-posta adresiniz gibi kişisel verileri içerebilir.
                </p>
                <h3>Veri Güvenliği</h3>
                <p>
                    Verilerinizin güvenliği bizim için önemlidir, ancak internet üzerinden hiçbir aktarım yönteminin veya elektronik depolama yönteminin %100 güvenli olmadığını unutmayın. Kişisel verilerinizi korumak için ticari olarak kabul edilebilir yöntemler kullanmaya çalışsak da, mutlak güvenliğini garanti edemeyiz.
                </p>
                <h3>Değişiklikler</h3>
                <p>
                    Gizlilik Politikamızı zaman zaman güncelleyebiliriz. Herhangi bir değişiklik olduğunda sizi bu sayfada yeni gizlilik politikasını yayınlayarak bilgilendireceğiz.
                </p>
            </div>
        </div>
    );
}
