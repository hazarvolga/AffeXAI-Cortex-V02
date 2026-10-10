
import type { KbCategory, KbArticle } from './types';
import { PlayCircle, GraduationCap, FileSignature, KeyRound, Wrench } from 'lucide-react';

export const kbCategories: KbCategory[] = [
    { id: 'cat-kb-01', name: 'Başlarken', description: 'Kurulum, lisanslama ve ilk adımlar.', icon: PlayCircle },
    { id: 'cat-kb-02', name: 'Modelleme & Çizim', description: '2B/3B modelleme ve çizim teknikleri.', icon: Wrench },
    { id: 'cat-kb-03', name: 'Gelişmiş Konular', description: 'Donatı, PythonParts ve veri alışverişi.', icon: GraduationCap },
    { id: 'cat-kb-04', 'name': 'Lisanslama & Yönetim', description: 'Lisans yönetimi ve sorun giderme.', icon: KeyRound },
];

export const kbArticles: KbArticle[] = [
    {
        id: 'art-001',
        slug: 'allplan-2024-kurulum-rehberi',
        title: 'Allplan 2024 Kurulum Rehberi',
        excerpt: 'Allplan 2024\'ü bilgisayarınıza adım adım nasıl kuracağınızı ve ilk ayarları nasıl yapacağınızı öğrenin.',
        content: `
            <h3>Giriş</h3>
            <p>Bu rehber, Allplan 2024'ün sisteminize başarılı bir şekilde kurulması için gerekli adımları içermektedir. Kuruluma başlamadan önce sistem gereksinimlerini kontrol ettiğinizden emin olun.</p>
            <h3>Adım 1: Kurulum Dosyasını İndirme</h3>
            <p>Allplan Connect portalından veya size gönderilen indirme bağlantısından en güncel kurulum dosyasını indirin.</p>
            <h3>Adım 2: Kurulumu Başlatma</h3>
            <p>İndirdiğiniz <code>.exe</code> dosyasına sağ tıklayıp "Yönetici olarak çalıştır" seçeneği ile kurulumu başlatın.</p>
            <h3>Adım 3: Lisans Bilgilerini Girme</h3>
            <p>Kurulum sihirbazı sizden lisans anahtarınızı isteyecektir. Product Key'inizi girerek devam edin.</p>
            <pre><code>ÖRNEK-LİSANS-ANAHTARI-12345</code></pre>
            <h3>Adım 4: Kurulum Türünü Seçme</h3>
            <p>Tipik kurulum seçeneği çoğu kullanıcı için yeterlidir. Özel bir bileşen kurmak isterseniz "Özel Kurulum" seçeneğini tercih edebilirsiniz.</p>
            <p>Kurulum tamamlandıktan sonra Allplan'ı başlatabilir ve çalışmaya başlayabilirsiniz.</p>
        `,
        categoryId: 'cat-kb-01',
        tags: ['kurulum', 'başlarken', '2024'],
        lastUpdated: '2024-07-20T10:00:00.000Z',
        views: 1258,
        author: {
            name: 'Ahmet Yılmaz',
            avatarUrl: 'https://i.pravatar.cc/150?u=ahmet-yilmaz',
        },
    },
    {
        id: 'art-002',
        slug: 'donati-modelleme-ipuclari',
        title: 'Verimli Donatı Modelleme İçin İpuçları',
        excerpt: 'Allplan\'da donatı modelleme süreçlerinizi hızlandıracak ve daha verimli hale getirecek profesyonel ipuçları.',
        content: `<h3>Giriş</h3><p>Karmaşık projelerde donatı modellemesi zaman alıcı olabilir. Bu makaledeki ipuçları ile iş akışınızı optimize edebilirsiniz.</p><h3>İpucu 1: Tekrarlayan Elemanlar İçin Kütüphane Kullanımı</h3><p>Sık kullandığınız donatı şekillerini veya gruplarını kütüphaneye kaydederek projeler arasında kolayca yeniden kullanabilirsiniz.</p>`,
        categoryId: 'cat-kb-03',
        tags: ['donatı', 'yapısal', 'ileri düzey'],
        lastUpdated: '2024-07-15T14:30:00.000Z',
        views: 980,
        author: {
            name: 'Zeynep Kaya',
            avatarUrl: 'https://i.pravatar.cc/150?u=zeynep-kaya',
        },
    },
    {
        id: 'art-003',
        slug: 'lisans-hatasi-cozumu',
        title: '"Lisans Bulunamadı" Hatası ve Çözümü',
        excerpt: 'Allplan\'ı başlatırken karşılaşılan "Lisans bulunamadı" veya "WIBU" hatası için çözüm adımları.',
        content: `<h3>Problem</h3><p>Allplan açılırken lisans sunucusuna bağlanamadığına dair bir hata mesajı alıyorsunuz.</p><h3>Çözüm Adımları</h3><ol><li><strong>CodeMeter Servisini Kontrol Edin:</strong> Başlat menüsünden "CodeMeter Control Center"ı açın ve servisin çalışır durumda olduğundan emin olun.</li><li><strong>Güvenlik Duvarı Ayarları:</strong> Güvenlik duvarınızın veya antivirüs programınızın CodeMeter'ın ağ erişimini engellemediğinden emin olun.</li><li><strong>Lisans Sunucu Adresini Kontrol Edin:</strong> Ağ lisansı kullanıyorsanız, sunucu adresinin doğru yapılandırıldığını kontrol edin.</li></ol>`,
        categoryId: 'cat-kb-04',
        tags: ['lisans', 'hata', 'sorun giderme'],
        lastUpdated: '2024-06-25T09:00:00.000Z',
        views: 2140,
        author: {
            name: 'Ahmet Yılmaz',
            avatarUrl: 'https://i.pravatar.cc/150?u=ahmet-yilmaz',
        },
    },
    {
        id: 'art-004',
        slug: '2b-cizim-temelleri',
        title: '2B Çizim Araçları Temelleri',
        excerpt: 'Allplan\'deki temel 2B çizim araçlarının (çizgi, daire, dikdörtgen vb.) kullanımı ve ayarları.',
        content: `<h3>Giriş</h3><p>Allplan, güçlü 2B çizim yetenekleri sunar. Bu rehber, en temel araçları nasıl kullanacağınızı gösterir.</p><h3>Çizgi (Line) Aracı</h3><p>Çizgi aracını seçtikten sonra, başlangıç ve bitiş noktalarını tıklayarak basit bir çizgi oluşturabilirsiniz. Özellikler paletinden çizgi kalınlığını ve tipini değiştirebilirsiniz.</p>`,
        categoryId: 'cat-kb-02',
        tags: ['2b', 'çizim', 'temel'],
        lastUpdated: '2024-07-29T11:00:00.000Z',
        views: 750,
        author: {
            name: 'Zeynep Kaya',
            avatarUrl: 'https://i.pravatar.cc/150?u=zeynep-kaya',
        },
    },
    {
        id: 'art-005',
        slug: 'kat-yoneticisi-kullanimi',
        title: 'Kat Yöneticisi ve Yapı Strüktürü Kullanımı',
        excerpt: 'Projenizi katlara ve yapı seviyelerine ayırmak için Kat Yöneticisi\'nin (Floor Manager) etkin kullanımı.',
        content: `<h3>Giriş</h3><p>Doğru bir yapı strüktürü oluşturmak, projenizin organizasyonu için kritiktir.</p><h3>Yeni Katlar Oluşturma</h3><p>Kat Yöneticisi\'ni açın ve "Yeni Kat" butonuna tıklayın. Kat yüksekliği ve kot gibi temel bilgileri girerek katlarınızı oluşturmaya başlayın.</p>`,
        categoryId: 'cat-kb-02',
        tags: ['kat', 'yapı strüktürü', 'organizasyon'],
        lastUpdated: '2024-07-28T16:00:00.000Z',
        views: 1500,
        author: {
            name: 'Ahmet Yılmaz',
            avatarUrl: 'https://i.pravatar.cc/150?u=ahmet-yilmaz',
        },
    }
];
