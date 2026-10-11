# AffeXAI Cortex — Forms ve Automation Runtime Kabulü

**Tarih:** 11 Ekim 2026

**Ortam:** Yalnız yerel, disposable `affexai-g0-isolated` PostgreSQL/Redis ağı

**Durum:** Forms → CRM → Platform Event → Automation → Approval → Email Campaign backend dikey dilimi doğrulandı

## Doğrulanan davranış

- Tenant sahibi canonical form şemasını oluşturdu ve yayımladı; draft form public uçta görünmedi.
- Public sözleşme `notificationEmail` ve `crmLeadCapture` gibi özel ayarları dışarı vermedi.
- Public gönderim geçerli `Idempotency-Key` ile tek submission ve tek CRM lead oluşturdu.
- Aynı anahtar ve aynı veri aynı submission kimliğini döndürdü; aynı anahtar ve farklı veri HTTP 409 verdi.
- `form.submitted` olayı yalnız form/submission kimliklerini taşıdı ve `containsPii=false` metadata'sıyla kaydedildi.
- Olayla aynı tenant'a ait aktif kural `automation_dispatch_outbox` üzerinden işlendi ve pending approval oluşturdu.
- `automation.approve` izni bulunan sıradan tenant admini onay veremedi; başka tenant sahibi aynı approval kimliğini göremedi.
- Yalnız tenant sahibi onayı sonrası deterministic slug ile tek tenant-scoped draft `email_campaigns` kaydı oluştu.
- Aynı approval'ın ikinci kez yürütülmesi HTTP 409 verdi; action ledger `delivered` kaldı ve ikinci kampanya oluşmadı.
- Form yayından kaldırılınca public okuma ve yeni submission HTTP 404 verdi.

## Restart ve crash recovery kanıtı

Uygulama durdurulmuşken, kesilmiş bir worker'ı temsil eden `processing` durumunda ve süresi dolmuş lease'e sahip dispatch yazıldı. Uygulama yeniden başlatıldığında worker satırı yeniden claim etti:

- `attempts`: `1 → 2`
- dispatch: `processing → delivered`
- lease token: teslim sonrası temizlendi
- approval sayısı: tam `1`
- event `triggeredRules`: tam ilgili rule kimliği

Bu test stale lease recovery ve exactly-once approval oluşturmayı kanıtlar. Dış e-posta gönderimi yapmaz; gerçek sonuç tenant veritabanındaki draft kampanya kaydıdır.

## Komutlar ve sonuçlar

```text
pnpm run build:shared && pnpm --filter affexai-backend build
PASS — 10/10 e-posta şablonu derlendi

pnpm --filter affexai-backend typecheck:build
PASS

pnpm --filter affexai-backend exec jest <Forms/Automation 6 spec> --runInBand
PASS — 6 suite / 66 test

sh apps/backend/scripts/run-isolated-app-smoke.sh
PASS — 25 migration, pending migration yok; full auth/tenant smoke geçti

sh apps/backend/scripts/test-forms-automation-runtime.sh
PASS

sh apps/backend/scripts/test-automation-restart-runtime.sh
PASS
```

İlk toplu Jest komutunda `--runInBand` yanlış konumda aktarıldığı için bir worker 4 GB heap sınırına ulaştı. O ana kadar 5 suite / 54 test geçmişti. Kalan `automation-security` paketi doğru tek-process komutla ayrıca çalıştırıldı ve 12/12 geçti; bu bir ürün testi başarısızlığı değildir.

## İnceleme ve sınırlar

- Son kod incelemesi: **APPROVE**, açık CRITICAL/HIGH/MEDIUM bulgu yok.
- Son güvenlik incelemesi: **APPROVE**, açık CRITICAL/HIGH/MEDIUM/LOW bulgu yok.
- Fixture cleanup yalnız rastgele test tenant'ları ve kaydedilmiş UUID'lerle sınırlıdır; cleanup başarısız olursa recovery state silinmez.
- Production verisi, canlı provider veya Coolify değiştirilmedi.
- Forms görsel editörünün gerçek tarayıcı kabulü, spam/abuse politikası ve dış mail teslimi açıktır.
- Platform integration için `email.create_campaign` gerçek DB hedefi doğrulandı. Webhook sandbox teslimi ve CMS/segment/notification gibi henüz etkin olmayan aksiyonların ürün kapsamı ayrıca tamamlanmalıdır.
