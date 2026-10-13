import type { Metadata } from "next";
import { PageHero } from "@/components/common/page-hero";
import {
  LEGAL_DRAFT_ROBOTS,
  LegalDraftNotice,
} from "@/components/common/legal-draft-notice";

export const metadata: Metadata = {
  title: "Kullanım Koşulları · AffeXAI Cortex",
  robots: LEGAL_DRAFT_ROBOTS,
};

export default function TermsPage() {
  return (
    <div>
      <LegalDraftNotice />
      <PageHero title="Kullanım Koşulları" />

      <div className="container mx-auto py-12 px-4 prose lg:prose-xl">
        <h2>Kullanım Koşulları</h2>
        <p>
          XYZ Company örnek tenantına ait kullanım koşulları taslağıdır. Gerçek
          bir şirketin onaylanmış kullanım koşulları değildir; yayından önce
          ilgili şirket bilgileriyle hazırlanmalıdır.
        </p>
        <h3>Fikri Mülkiyet</h3>
        <p>
          İçerik sahipliği ve lisans koşulları, ilgili hak sahipleri
          doğrulandıktan sonra bu bölüme eklenmelidir.
        </p>
        <h3>Sorumluluğun Reddi</h3>
        <p>
          Bu sitede yer alan bilgiler yalnızca genel bilgilendirme amaçlıdır.
          Bilgilerin doğruluğunu ve güncelliğini sağlamak için çaba göstersek
          de, herhangi bir garanti vermemekteyiz.
        </p>
        <h3>Değişiklikler</h3>
        <p>
          Bu kullanım koşullarını herhangi bir zamanda değiştirme hakkını saklı
          tutarız. Değişiklikler bu sayfada yayınlandığı andan itibaren geçerli
          olacaktır.
        </p>
      </div>
    </div>
  );
}
