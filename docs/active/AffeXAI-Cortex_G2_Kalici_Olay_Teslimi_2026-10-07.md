# AffeXAI Cortex — G2 kalıcı olay teslimi

## Kapsam ve garanti

İlk uygulama `ticket.resolved` akışıdır; 33 modüllük ürün kapsamı değişmez. Talep durumu, denetim kaydı, PlatformEvent ve Cortex outbox kaydı aynı PostgreSQL işlemi içinde yazılır. Aynı duruma tekrar geçiş olay üretmez; yeniden açılıp çözülen talep yeni olay üretir. Ağ, e-posta ve socket çağrıları veritabanı işleminin dışındadır.

Worker, `FOR UPDATE SKIP LOCKED` ile en fazla beş kayıt alır. Süresi dolan 60 saniyelik lease tekrar alınabilir; ACK/retry güncellemeleri event, tenant ve lease token ile sınırlandırılır. Hatalar artan bekleme ile yeniden denenir; onuncu başarısız teslim `dead` durumuna alınır. Ham provider hata metinleri saklanmaz. Kayıtlar migration rollback sırasında sessizce silinmez: teslim edilmemiş olay varsa rollback reddedilir.

Teslim garantisi **en az bir kez deneme ve aynı olay için idempotent hafıza kaydıdır**. Ağ üzerinde exactly-once iddiası yoktur. Cortex, tenant ve olay UUID'sinden deterministik Qdrant point UUID üretir. Aynı iş olayı yeniden gönderilirken gövde ve iş zamanı sabit, HMAC nonce yenidir. Nest teslimi ancak tenant/event/point kimlikleri doğru ACK sonrası tamamlanmış sayar.

## Yerel doğrulama

- Outbox servis testleri: önce modül eksikliğiyle RED, ardından transaction zorunluluğu, aynı transaction kaydı ve DB hata yayılımı için 3 GREEN.
- Worker testleri: önce modül eksikliğiyle RED; lease ACK, yeniden deneme/hata gizliliği, dead durumu ve claim sorgusu için 4 GREEN.
- İlk birleşik snapshot: **57 paket, 626 test geçti** (`/tmp/affexai-g2-combined.log`). Bu sayı o andaki G1/G2 odaklı regresyondur; bütün depo testleri veya ürün kapsam oranı değildir.
- Aynı snapshot'ta backend üretim TypeScript denetimi başarılı (`/tmp/affexai-g2-tsc.log`).
- Gerçek PostgreSQL eşzamanlılık/rollback ve bağımsız inceleme devam ediyor; sonuçları doğrulanmadan kabul tamamlandı sayılmaz.

## Açık kabul işleri

- Kalıcı teslimi diğer iş olaylarına genişletme, BCC/reward/automation tüketicilerinin aynı olay kimliğiyle idempotent işlenmesi.
- Dead olaylar için yetkili, audit edilen inceleme/yeniden deneme arayüzü. Mevcut görünürlük veritabanı durumu ve sabit hata logudur.
- E-posta teslimi bu transaction'a dahil değildir; provider sonucu/receipt ve mükerrer gönderim kontrolü ayrıca tamamlanacaktır.
- Gerçek embedding modeliyle uçtan uca kabul, embedding model kimliği migration kapısı ve çoklu Cortex worker replay koruması.
- UI/UX ve kalan modül kabul senaryoları açık. Bu çalışma yayın veya ürünün yüzde yüz tamamlandığı anlamına gelmez.

## PostgreSQL ile bulunan ve giderilen iki hata

Gerçek sürücü testi, `WITH ... UPDATE RETURNING` için TypeORM sonucunun `[rows, affectedCount]` olduğunu gösterdi. Önceki mock yalnız satır dizisi döndürüyordu. Mock gerçek dönüş biçimine çevrilince dört test RED oldu; worker düzeltmesinden sonra altı test GREEN. Birim testin geçmesi gerçek veritabanı kanıtının yerine kullanılmadı.

Bağımsız inceleme, migration geri alma ön kontrolü ile DROP arasında yeni olay yazılabileceğini buldu. `down` artık aktif transaction gerektirir ve ön kontrolden önce `ACCESS EXCLUSIVE` kilidi alır. Gerçek PostgreSQL testinde eşzamanlı ikinci bağlantı `55P03` lock timeout ile durduruldu; bekleyen olaylar korunuyor.

Gerçek izole PostgreSQL kabulü geçti (`/tmp/affexai-g2-outbox-db.log`): migration 7/tekrar 0, işlem/event rollback, tenant FK uyuşmazlığı, iki worker'ın ayrık claim'i, süresi dolan lease'in alınması, eski ACK'nin engellenmesi, kayıp ACK sonrası sabit olay kimliği, bekleyen olay varken downgrade reddi. Test satırları temizlendi. Önceki abone migration/relation harness'i yedinci migration ile tekrar geçti (`/tmp/affexai-g2-subscriber-compat-db.log`).

Root outbox servis/worker odaklı kapsam: 13 test, %100 satır ve %82,6 branch. Bu yalnız iki dosyanın kapsamıdır. Backend ve Cortex bağımsız incelemeleri yapıldı; çalışma sırasında bulunan yukarıdaki iki sorun giderildi. Lease dolsa bile başka worker henüz almamışsa eski token ACK verebilir; yeniden alındığında token değişir ve eski ACK reddedilir.

### İzole PostgreSQL outbox kabul kanıtı

`apps/backend/scripts/test-cortex-outbox-db.sh` yalnız compose project etiketi `affexai-g0-isolated`, çalışan container ve `/var/lib/postgresql/data` tmpfs koşullarını doğruladığı mevcut test veritabanını kullanır. `.env` okunmaz; kaynaklar geçici dizine transpile edilir. Fixture event/outbox kayıtları yalnız kendi UUID listesiyle temizlenir. Gerçek HTTP/provider yerine süreç içi transport, gerçek signed-delivery/ACK doğrulamasını çalıştırır.

Gerçek PostgreSQL sonucu PASS: canonical migration sayısı **7**, tekrar migration **0**; gerçek `CortexOutboxService.recordTicketResolved` transaction rollback; tenant/event foreign-key uyuşmazlığı; iki workerın ayrık claim yapması; lease süresi dolunca geri alma; eski lease ACK'inin durum değiştirememesi; ACK persistence kaybından sonra aynı point identity ile yeniden teslim; pending kayıt varken downgrade reddi. Downgrade transaction'ı tablo kilidini tuttuğunda ikinci bağlantı `55P03` lock timeout alır. İlk çalışma gerçek TypeORM UPDATE RETURNING sonucunun `[rows, affectedCount]` biçimini ortaya çıkardı; worker düzeltildikten sonra tekrar geçti. Kontrol ayrıca downgrade kontrolü/drop arasındaki yarışın transaction + ACCESS EXCLUSIVE kilitle kapatılmasını gerektirdi.

**Sınır:** DB harness gerçek TicketsService status geçişini çağırmaz. Platform event+outbox transaction atomikliği gerçektir; ticket update + event birlikte rollback ve eşzamanlı iki resolve çağrısından tek event oluşması bu harness tarafından doğrulanmış değildir. Ticket producer unit testleri bu DB kabulünün yerine geçmez. Gerçek Qdrant/model/provider veya dağıtık production çalışması yapılmadı.

Komutlar: `sh apps/backend/scripts/test-cortex-outbox-db.sh`, `sh apps/backend/scripts/test-subscriber-tenant-db.sh`. İkinci harness yedinci migration ile uyumlu hale getirildi ve gerçek tenant recipient regression tekrar geçti. Loglar: `/tmp/affexai-g2-outbox-db.log`, `/tmp/affexai-g2-subscriber-compat-db.log`.

## Gerçek talep üreticisi ve Qdrant kabulü

`sh apps/backend/scripts/test-ticket-resolution-db.sh` geçti (`/tmp/affexai-g2-ticket-db.log`). Bu ayrı test gerçek **TicketsService.updateStatus** kodunu ve PostgreSQL tablolarını kullanır: outbox yazımından sonra zorlanan hata ticket/audit/event/outbox kayıtlarını geri alır; eşzamanlı iki çözüm tek olay oluşturur; yeniden açıp çözme yeni olay üretir; yabancı tenant reddedilir. Yalnız e-posta/socket/SLA hesap bağımlılıkları bu transaction testinde stub'dır. Önceki outbox harness'i tek başına ticket üreticisini doğrulamıyordu. Yeni harness bağımsız incelendi.

`scripts/test-cortex-qdrant.sh` geçti (`/tmp/affexai-g2-qdrant-acceptance.log`): gerçek Qdrant v1.16.1, tamamlanan yazımdan sonra kaybolan yanıt ve aynı point'e tekrar, ikinci tenant için farklı point, metadata ve tenant filtreli retrieval. **Deterministik test embedder kullanıldı**; gerçek embedding modelinin kalitesi/uyumu ve restart sonrası kalıcılık bu testin kapsamında değildir. Port yayımlanmayan internal network/tmpfs kaynakları test sonunda temizlendi; model indirilmedi.

G2 Nest teslim helper'ı 17 test; Python 52 test; helper %100 satır/%96 branch. Backend yeniden derlendi ve tam Nest + izole PostgreSQL/Redis auth smoke tekrar geçti (`/tmp/affexai-g2-fullapp-smoke.log`).
