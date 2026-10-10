# AffeXAI - AI Servis Gelecek Planı ve Mimari Yapı

> **Tarih:** 14 Şubat 2026
> **Durum:** Lightweight Hibrit Geliştirme (Aktif)

Bu doküman, AffeXAI projesinin geliştirme sürecindeki kaynak yönetimi ve dağıtım stratejisini netleştirmek amacıyla oluşturulmuştur.

## 🎯 Temel Felsefe: "Lightweight Hybrid" (Hafif Hibrit)
Geliştirme hızını **Local (Yerel)** ortamın esnekliği ile, ağır yapay zeka işlemlerini **Remote (Sunucu)** gücüyle birleştiren hibrit bir modeldir.

*   **Hız:** Backend/Frontend geliştirmesi anlık olarak localde yapılır (Deploy bekleme yok).
*   **Güç:** Ollama (LLM) ve Vector DB gibi ağır servisler sunucuda çalışır, bilgisayarı yormaz.

---

## 🏗️ Mimari Yapı

### 1. Yerel Ortam (Localhost - Sizin Bilgisayarınız)
Projenin "Orkestrasyon ve Arayüz" katmanıdır.

*   **Frontend (Next.js):** Kullanıcı arayüzü.
*   **Backend (NestJS):** İş mantığı ve yönlendirme merkezi.
*   **Veritabanı (PostgreSQL):** Kullanıcı verileri, loglar, ilişkisel veriler.
*   **Önbellek (Redis):** Hızlı erişim, kuyruk yönetimi.
*   **Dosya Depolama (MinIO/S3):** Resim, belge vb.

> **Neden Local?** Veritabanı bağlantı hızı, debug kolaylığı ve internetsiz çalışabilme imkanı için.

### 2. Uzak Sunucu (Instance-Hulya / 161.118... - "BCC Brain")
Projenin "Yapay Zeka Beyni" katmanıdır. Sadece hesaplama gücü gerektiren servisleri barındırır.

*   **Ollama (LLM):** Llama 3, Mistral gibi modeller burada çalışır.
*   **Vector DB (Chroma/Milvus):** RAG (Retrieval-Augmented Generation) için vektör verileri burada saklanır.
*   **Python AI Workers:** Özel Python scriptleri (gerekirse).

> **Neden Sunucu?** 7/24 açık kalması gereken, yüksek RAM ve CPU tüketen servisler bilgisayarınızı yavaşlatmasın diye.

---

## 🔗 Entegrasyon Akışı

1.  **Soru:** Kullanıcı (Frontend) bir soru sorar -> Backend'e gelir.
2.  **Veri Hazırlığı:** Backend (Local), kendi veritabanından (Local Postgres) gerekli veriyi çeker.
3.  **AI İsteği:** Backend, bu veriyi ve soruyu Sunucudaki Ollama API'sine gönderir (`POST http://161.118...:11434/api/generate`).
4.  **Cevap:** Sunucu cevabı üretir ve Backend'e döner.
5.  **Kayıt:** Backend cevabı alır, kullanıcıya gösterir ve Local Postgres'e kaydeder.

---

## 🗺️ Yol Haritası (Roadmap)

### Faz 1: Sunucu Kurulumu (Şu Anki Adım) ✅
- [ ] Instance-Hulya üzerine Ollama kurulumu (GPU/CPU optimize).
- [ ] Instance-Hulya üzerine Vector DB (Chroma/Milvus) kurulumu.
- [ ] API'nin dışarıya açılması (Güvenlik Önlemli: Sadece sizin IP'niz veya API Key ile).

### Faz 2: Bağlantı Testi (Connection) 🔄
- [ ] Local Backend'in `.env` dosyasına sunucu IP'sinin girilmesi.
- [ ] Basit bir "Merhaba Dünya" sorusu ile bağlantının test edilmesi.

### Faz 3: RAG Entegrasyonu (Retrieval) ⏳
- [ ] Localdeki dokümanların, sunucudaki Vector DB'ye yüklenmesi (Embedding).
- [ ] Backend'in arama yaparken sunucuyu kullanması.

### Faz 4: Final Production (Gelecek) 🚀
- [ ] Local geliştirme tamamen bittiğinde, Localdeki Backend/Frontend/DB de sunucuya taşınır.
- [ ] "Tam Hibrit" (Her şey sunucuda) veya "Dağıtık" (BCC ayrı, Backend ayrı sunucu) yapıya geçilir.

---

## ⚠️ Kritik Notlar
*   **Güvenlik:** Sunucudaki AI portları (11434, 8000 vb.) tüm dünyaya açılmamalıdır. Sadece sizin IP'nize (HazarVolga VPN/Home IP) izin verilecektir.
*   **Yedekleme:** Local Postgres'te geliştirdiğiniz veriler sizin sorumluluğunuzdadır. Düzenli dump (yedeği) almayı unutmayın.
