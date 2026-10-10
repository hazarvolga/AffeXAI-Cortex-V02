# AffeXAI Cortex — G3 Ayarlar Modülü Kabulü

Tarih: 08.10.2026
Durum: **Yerelde doğrulandı; dış provider bağlantı kabulleri ilgili tüketici modüllerinde açık**

## Kabul edilen kapsam

- Tenant site, e-posta, depolama ve AI yapılandırmaları gerçek PostgreSQL kayıtlarını kullanır.
- Tenant ve platform kapsamları veritabanı constraint/partial unique index ile ayrılır. Etkin platform tüketici sözleşmesi bulunmadığı için platform yazımı kapalıdır.
- Genel create/update/delete ayar uçları kapalıdır; tipli ayar uçları validation, transaction, audit ve monoton tenant revision kullanır.
- Secret alanları şifreli saklanır; GET yanıtlarında maskelenir. `preserve`, `replace` ve izinli sağlayıcı değişiminde `clear` semantiği sunucu tarafında uygulanır.
- Site formu runtime kaynak dosyası değiştirmez. Kayıttan sonra API yeniden okunur ve kalıcı sonuç gösterilir.
- E-posta ve depolama formları gerçek API ile çalışır. Maskeli GET yanıtının değişmeden PUT edilmesi secretı korur ve gereksiz revision/audit üretmez.
- Depolama API'si yalnız etkin sağlayıcı yapılandırmasını yönetim yanıtına ekler; aktif olmayan boş yapıların GET→PUT doğrulamasını bozması engellenir.
- AI tüketicileri credential yapılandırılana kadar güvenli biçimde kapalı başlar. Boş tenant yapılandırmasının değişmeden kaydı secret koruma hatası üretmez.
- AI, mail ve S3 tüketicileri tenant revision snapshotını kullanır. S3 tenant olmadan çalışmaz; anahtarlar tenant prefix'i altında tutulur.
- Chat AI yalnız `support` kapsamındaki etkin credentialı kullanır; kapalı Support düğümü Email Marketing, Social veya Analytics anahtarına failover yapmaz.
- Chat provider health/cooldown durumu tenant + provider anahtarıyla izole edilir. Eksik veya kapalı yerel yapılandırma provider arızası sayılmaz; yalnız gerçek generation denemesinin retry tükenmesi kaynak tenantın sayacını artırır.
- Maskeli credential sentinel'i tam `***` değeridir. `***` ile başlayan daha uzun yeni credentiallar preserve sayılmaz ve gerçek replacement olarak işlenir.
- S3 uyumlu endpointlerde HTTPS, DNS çözümlemesi, public IP ve redirect sınırları uygulanır. Cloudflare R2 account ID biçimi doğrulanır.

## Gerçek çalışma zamanı kanıtı

Yerel production backend imajı oluşturuldu ve healthcheck geçti. `xyz-company-ui` tenant yöneticisiyle gerçek tarayıcı akışında:

1. Site ayarları kaydedildi, sayfa yenilemesinden sonra `XYZ Company` ve tenant scope veritabanından yeniden okundu.
2. Resend yapılandırması kaydedildi. API anahtarı `is_encrypted=true` olarak saklandı ve ciphertext düz metinle eşleşmedi.
3. E-posta formu yeniden yüklenip maskeli secret değiştirilmeden kaydedildi; revision `2`, e-posta audit sayısı `1` olarak kaldı.
4. Yerel persistent storage kaydedildi; revision `3`, storage audit sayısı `1` oldu. İkinci değişmemiş kayıt bu değerleri artırmadı.
5. AI ekranı `CONFIG_SOURCE TENANT_DB` ve `ENABLED_MODULES 0` gösterdi. İlk kalıcı kayıt revision `4`, AI audit sayısı `1` üretti; ikinci değişmemiş kayıt yeni revision/audit üretmedi.
6. Geçerli tenant tokenıyla farklı `x-tenant-id` başlığı gönderilen liste ve tekil ayar okumaları `403` döndü; yabancı tenant fixture'ı görünmedi ve test sonunda silindi.
7. Kabul için geçici değiştirilen yerel fixture parolası özgün hash'e geri yüklendi; geçici parola tekrar `401` aldı ve hash dosyası silindi.

## Otomatik doğrulama

- Settings servis/güvenlik, authorization/platform, consumer revision, AI, mail, migration ve API-key detector odaklı test grupları geçti.
- Son Settings güvenlik regresyon grubu: `25/25`; tüm storage provider değerleri için yalnız etkin yapılandırmanın maskeli GET yanıtında bulunduğu tablo testi ve mask-prefix rotation testi dahil.
- Chat AI ayar/failover ve generation grupları: `11/11`; Support kapalı + Email Marketing açık, iki tenant cooldown izolasyonu ve yalnız Support/global diagnostic senaryoları dahil.
- Settings authorization + consumer revision grupları: `30/30`.
- Mail tenant routing + S3 güvenlik grupları: `36/36`.
- Storage/S3 güvenlik grubu: `9/9`.
- Authorization grubu: `24/24`.
- Migration grubu: `4/4`.
- Frontend site form sözleşmesi: `4/4`.
- Backend ve frontend typecheck geçti; frontend production build 206 route ile geçti.
- Backend production Docker build geçti; 10/10 e-posta şablonu derlendi ve konteyner healthy oldu.
- Migration disposable PostgreSQL üzerinde tam up, settings down/up ve tekrar çalıştırma ile doğrulandı. Tenant/platform unique ve scope constraintleri gerçek SQL ile sınandı.
- Son bağımsız kod ve güvenlik incelemeleri onay verdi. Cross-module chat fail-open, tenantlar arası circuit-breaker etkisi, yanlış cross-module diagnostic ve mask-prefix rotation bulguları kapatıldı; yeniden incelemelerde açık CRITICAL/HIGH/MEDIUM kalmadı.
- Büyük birleşik Jest çalışmaları 4 GB süreç sınırında OOM olduğu için odaklı küçük gruplar halinde çalıştırıldı; assertion hatası gizlenmedi.

## Açık entegrasyon sınırları

- Gerçek Resend/SES veya başka dış e-posta sağlayıcısına mesaj gönderilmedi. Outbound mail servisi şu anda Resend ve SES adapterlarını çalıştırır; diğer yönetim seçeneklerinin gönderim adapterları **mail modülü** kabulinde tamamlanacaktır.
- Gerçek AWS S3, Cloudflare R2, DigitalOcean Spaces veya MinIO hesabına dosya gönderilmedi. Sağlayıcı sandbox ve gerçek object round-trip kabulü **media modülü** kapsamındadır.
- Gerçek OpenAI/Anthropic/Google/DeepSeek/OpenRouter/Ollama çağrısı yapılmadı. Model çağrısı, kota, maliyet, timeout ve fallback kabulleri **ai modülü** kapsamındadır.
- Yerel kabul production deploy veya yayın onayı değildir.

Bu sınırlar Settings modülünün kendi kalıcılık, güvenlik, audit, revision, cache tüketimi ve yönetim UI kabulünü engellemez; dış sistem sonuçları ilgili tüketici modül satırları kapanmadan tamamlanmış sayılmaz.
