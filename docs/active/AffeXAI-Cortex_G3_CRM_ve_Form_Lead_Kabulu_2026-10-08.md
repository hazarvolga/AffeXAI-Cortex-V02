# AffeXAI Cortex — G3 CRM ve Form Lead Kabulü

Tarih: 08.10.2026
Durum: **CRM yerelde doğrulandı; Forms modülünün formdan CRM'e lead dilimi doğrulandı**

## Kabul edilen kapsam

- Eski, açık renkli ve ürünün güncel tasarım sisteminden kopuk CRM ekranı kaldırıldı. Tenant CRM sayfası AffeXAI Cortex'in koyu editorial/command-center arayüzüne geçirildi.
- Kayıt listesi gerçek sunucu sayfalamasını ve toplam kayıt metadata'sını kullanır. Masaüstünde tablo, mobilde okunabilir kart düzeni sunulur.
- Oluşturma, düzenleme, CSV içe aktarma ve pasifleştirme işlemleri yalnız `crm.manage`; listeleme `crm.view` izniyle açılır. Tenant yöneticisi platform yöneticisine dönüşmez.
- Global `/admin/crm` kopyası kaldırıldı. CRM menüsü yalnız tenant bağlamında ve izin kontrolüyle gösterilir.
- CRM müşteri ve lead kayıtları tenant sınırı, benzersizlik, DTO doğrulaması ve ilişkili lead korumasıyla kalıcıdır.
- Yayımlanmış public forma yapılan gönderim aynı transaction içinde submission ve CRM lead üretir. Form/tenant/source submission ilişkileri korunur.
- `Idempotency-Key` aynı semantik JSON için aynı sonucu döndürür; farklı payload aynı anahtarla tekrarlandığında `409` verir. Anahtar karşılaştırması iç içe JSON alan sırasından etkilenmez.
- Başarılı form yanıtı yalnız `submissionId` içerir. Yönetim submission projeksiyonu idempotency iç alanlarını sızdırmaz.
- Public form gövdesi 64 KB ile sınırlıdır. Limit aşımı güvenli `413 PAYLOAD_TOO_LARGE` yanıtına çevrilir; CORS `Idempotency-Key` başlığını kabul eder.
- Lead yakalama, PII taşımayan `crm.lead.captured` platform olayı ve kalıcı outbox kaydı üretir. Payload yalnız kaynak kimliklerini ve sözleşme sürümünü taşır.

## Gerçek çalışma zamanı kanıtı

İzole PostgreSQL'e bağlı production backend Docker imajı oluşturuldu ve healthcheck geçti. `xyz-company-ui` tenantındaki yayımlanmış form için:

1. İlk gönderim `201` döndü ve `54b2a98f-371a-4c22-8ecf-b8bf0e168eff` submission kaydını oluşturdu.
2. Aynı idempotency anahtarı ve alan sırası değiştirilmiş eşdeğer iç içe JSON aynı submission kimliğini döndürdü.
3. Aynı anahtar ile değiştirilmiş payload `409` döndü.
4. PostgreSQL'de bu kaynak için bir submission ve bir CRM lead bulundu.
5. `crm.lead.captured` olayı `c9ab8092-c3fa-4d20-b368-491d103bf563` kimliğiyle platform event ve outbox tablolarına yazıldı. Payload anahtarları `customerId`, `formId`, `leadId`, `schemaVersion`, `submissionId` ile sınırlıydı.
6. Cortex teslim servisi yerel ortamda erişilemezken outbox kaydı `pending` kaldı ve kaybolmadı. Bu, kalıcılığı kanıtlar; Cortex'e nihai teslimi kanıtlamaz.
7. 70 KB public form isteği gerçek HTTP üzerinden `413`, `PAYLOAD_TOO_LARGE` ve güvenli hata mesajı döndürdü.
8. CORS preflight `204` döndü; izin verilen başlıklar arasında `Idempotency-Key` yer aldı.

Gerçek tarayıcıda `XYZ Company CRM Acceptance Updated` kaydı oluşturma/düzenleme sonrası yenilemede korundu. Masaüstü tabloda gerçek kayıt ve sayaçlar görüldü. 390 × 844 mobil görünümde kayıt kartı, komutlar ve açılabilir yönetim menüsü çalıştı. Tarayıcı normal masaüstü görünümüne geri alındı.

## Otomatik doğrulama

- CRM, Forms, migration, DTO, body parser ve global exception filter: **7/7 suite, 49/49 test geçti**.
- Backend production typecheck geçti.
- Frontend typecheck geçti.
- Frontend production build geçti; tenant CRM route'u üretim çıktısında oluşturuldu.
- Backend production Docker build geçti; 10/10 e-posta şablonu derlendi ve konteyner healthy oldu.
- `git diff --check` geçti.
- Backend ve frontend bağımsız kod incelemelerinde açık CRITICAL/HIGH/MEDIUM bulgu kalmadı. 413 sınıflandırması yalnız canonical body-parser imzasıyla sınırlandırıldı; dış servislerin 413 hatalarını yanlış sınıflandırmayan negatif regresyonlar eklendi.
- Jest kapanışında mevcut açık handle uyarısı görüldü; assertion veya suite hatası oluşmadı.

## Açık entegrasyon sınırları

- Yerel Cortex teslim servisi/Qdrant bu kabul sırasında erişilebilir değildi. Olayın kalıcı outbox'ta beklemesi doğrulandı; gerçek Cortex tüketimi, retry sonrası teslim ve retrieval G4/Cortex kabulinde tamamlanacaktır.
- Forms modülünün bu kaydı public submit → CRM lead → kalıcı olay dilimini kapsar. Form editörü, yayınlama yaşam döngüsü, spam politikası ve automation hedefinin bütün kabulü açık olduğu için Forms satırı `Uygulanıyor` durumundadır.
- Bu çalışma production deploy veya yayın kabulü değildir.
