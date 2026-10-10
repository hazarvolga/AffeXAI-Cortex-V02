# AffeXAI Cortex — G3 Kullanıcı Yaşam Döngüsü Kabulü

Tarih: 08.10.2026
Kapsam: `users`, kimlik doğrulama yaşam döngüsü ve tenant rol verisi
Ortam: yalnız yerel, izole PostgreSQL/Docker ve `XYZ Company` fixture'ı

## Kabul edilen davranış

- Tenant yöneticisi, yalnız kendi tenantına ait ve platform yetkisi taşımayan bir rol ile kullanıcı davet edebilir.
- Davet tokenı veritabanında yalnız SHA-256 hash olarak tutulur; 24 saatlik, amaç bağlı ve tek kullanımlıdır.
- Davet kabulü parolayı hashler, e-postayı doğrular, tokenı atomik tüketir ve önceki oturum sürümünü geçersiz kılar.
- Giriş, e-postası doğrulanmamış hesabı reddeder.
- Şifre sıfırlama bilinmeyen hesap için de aynı `202` yanıtını verir; reset tokenı amaç bağlı, hashlenmiş ve tek kullanımlıdır.
- Şifre sıfırlama ve logout `tokenVersion` artırır, refresh bilgisini temizler; eski access ve refresh tokenları sonraki istekte reddedilir.
- E-posta doğrulama yalnız açık kullanıcı eylemiyle `POST /api/auth/verify-email` üzerinden yapılır. Linkin açılması tokenı tüketmez ve doğrulama sonunda otomatik oturum verilmez.
- Genel kullanıcı güncelleme DTO'su credential, aktivasyon ve platform yetkisi alanlarını kabul etmez.
- `(tenant_id, lower(trim(email)))` canlı kullanıcı benzersizliği PostgreSQL partial unique index ile korunur.
- Eski `organization_owner` joker izni, migration-local açık tenant izin snapshot'ına çevrilir. `*` ve `system.admin` kalmaz; platform yöneticiliği sunucu allowlist'inden ayrı türetilir.

## Doğrulama kanıtı

- Auth/users odaklı testler: 84/84; ardından roles/users inceleme paketi 69/69 geçti.
- Yeni tenant yönetici permission migration testleri ve discovery: 3/3 geçti.
- Backend ve frontend production typecheck geçti.
- Backend Docker image production build geçti; 10/10 e-posta şablonu derlendi.
- Frontend Next.js production build geçti; 206 sayfa üretim build sürecinde işlendi.
- İzole PostgreSQL üzerinde `TenantAdminPermissions1791417600000` gerçek CLI ile bir kez uygulandı. `organization_owner` sonucu: 71 açık tenant izni, `* = false`, `system.admin = false`, `users.view = true`.
- Güncel izole backend konteyneri Docker health ve `GET /api/health = 200` verdi.
- Gerçek HTTP negatifleri: eski doğrulama GET yolu `404`, geçersiz doğrulama POST'u `400`, bilinmeyen forgot-password `202`, kimliksiz logout `401`.
- Gerçek HTTP/DB zinciri: geçici güvenli rol oluşturma → davet `201` → profil alanlarının kalıcılığı → davet kabulü `201` → giriş `201` → logout `201` → eski access `401` → eski refresh `401` → davet tekrarı `400`.
- Gerçek reset zinciri: forgot `202` → reset `201` → eski parola `401` → yeni parola ile giriş `201` → reset token tekrar kullanımı `400`.
- Tarayıcıda doğrulama linkinin açık düğme beklediği, users istatistiklerinin gerçek zarf verisini gösterdiği ve davet formunun parola istemeden rol/profil alanlarını sunduğu görüldü.
- Tüm geçici kullanıcı/rol fixture'ları silindi; başlangıçtaki tek kullanıcı ve rol durumu korundu. Geçici yönetici parolası eski hashine geri getirildi.

## Açık yayın koşulları

- Dış e-posta sağlayıcısında gerçek davet/reset teslimi ve tıklama akışı provider sandbox veya izinli test hesabıyla ayrıca kabul edilecek.
- Birleşik geniş Jest çağrısı yerel Node heap sınırına ulaştı; aynı odaklı paketler küçük gruplarda geçti. CI test parçalama ve heap bütçesi operasyon kapısında kalıcılaştırılacak.
- Tarayıcı kabulü yerel `XYZ Company` fixture'ında yapıldı; production veya uzak sistem değiştirilmedi.
