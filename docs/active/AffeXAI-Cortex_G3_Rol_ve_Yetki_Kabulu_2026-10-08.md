# AffeXAI Cortex — G3 Rol ve Yetki Kabulü

Tarih: 08.10.2026
Kapsam: `roles`, çoklu rol atama sınırı ve tenant izin matrisi
Ortam: yalnız yerel, izole PostgreSQL/Docker ve `XYZ Company` fixture'ı

## Kabul edilen davranış

- Tenant rol API'si yalnız canonical tenant izin kataloğunu sunar; `*`, `system.admin` ve platform rol adları tenant tarafından verilemez.
- `organization_owner`, `organization_admin` ve `admin` tenant yönetici rolüdür; platform yöneticiliği sağlamaz.
- Rol listesi gerçek ve benzersiz kullanıcı atama sayısını döndürür. Dahili `users` ve `userRoles` ilişki kayıtları API yanıtına sızmaz.
- Rol oluşturma, ad/açıklama düzenleme, izin değiştirme ve atamasız özel rol silme gerçek API'ye bağlı tek canonical tenant ekranından çalışır.
- Template rol adı değiştirilemez ve template rol silinemez. Atanmış özel rol silinemez.
- Rol güncelleme ve silme, yalnız rol satırını PostgreSQL pessimistic lock ile kilitler; nullable relation join'ine `FOR UPDATE` uygulanmaz. Silme soft-delete kullanır ve geçmiş FK kayıtları korunur.
- Rol atama ve kaldırma önce hedef kullanıcıyı `FOR UPDATE`, sonra rol satırlarını deterministik `FOR KEY SHARE` ile kilitler. Silme sonucu `affected=1` olmadan başarı dönmez; eşzamanlı atama/kaldırma yarışı engellenir.
- Rol adları yazma sınırında canonical küçük harfe çevrilir. Migration 19 canlı tenant rol adlarının normalize edilmiş benzersizliğini ve kullanıcı başına tek canlı primary rolü veritabanında zorunlu kılar.
- Pasif roller atanamaz ve rol-yetki yardımcılarında yetkili sayılmaz. `replaceExisting=false`, mevcut primary rolü atomik olarak ikincil yapıp seçilen rolü primary yapar.
- Rol ataması veya kaldırılması kullanıcının `tokenVersion` değerini aynı transaction içinde artırır; eski JWT yetkisi sonraki istekte geçersizdir.
- Eski `/:tenant/admin/users/roles` ve `/new` yolları canonical `/:tenant/admin/roles` ekranına yönlenir; tenant sidebar doğrudan canonical yolu açar. Viewer matrisi okuyabilir fakat yazma kontrolleri gösterilmez.

## Doğrulama kanıtı

- Rol/izin ve migration sınır testleri: 59/59 geçti; son migration odak tekrarı 58/58 geçti.
- Backend ve frontend production typecheck geçti.
- Frontend production build 206/206 route ile geçti.
- Backend Docker production image build geçti; 10/10 e-posta şablonu derlendi.
- Güncel backend konteyneri Docker health ve `GET /api/health = 200` verdi.
- Migration 19 izole gerçek PostgreSQL'e uygulandı; normalize canlı rol adı ve tek canlı primary rol indeksleri doğrulandı.
- Gerçek PostgreSQL hatası tarayıcı kabulünde yakalandı: relation join ile üretilen `FOR UPDATE` 500 dönüyordu. Kilit sorgusu ayrıştırıldı ve gerçek Docker/PostgreSQL üzerinde düzenleme yeniden başarılı oldu.
- Gerçek tarayıcı zinciri: legacy yol `307` ile canonical ekrana yönlendi → özel rol oluşturuldu → bir canonical izin açıldı → ad/açıklama düzenlendi → iki aşamalı silme çalıştı.
- Tarayıcıda rol/izin matrisi 71 canonical tenant iznini ve gerçek atama sayısını gösterdi. Dinamik tarih kaynaklı hydration farkı giderildi.
- Geçici rol fixture'ı silindi. Veritabanı son durumu: 1 tenant rolü, `acceptance_auditor = 0`, 1 kullanıcı.
- Bağımsız son kod ve güvenlik incelemelerinde açık CRITICAL/HIGH/MEDIUM bulgu kalmadı.

## Açık yayın koşulları

- Bu kabul yerel izole ortam içindir; production veya uzak sistem değiştirilmedi.
- Dış kimlik sağlayıcısı yoktur; rol değişikliğinin tüm uzun ömürlü istemci kanallarında yeniden bağlanma davranışı birleşik G1/G5 kabulinde tekrar çalıştırılacaktır.
- Geniş test paketi yerel heap sınırı nedeniyle modül bazında parçalı yürütülür; CI parçalama kalıcı operasyon kapısında tamamlanacaktır.
