# 🔧 Backend Multi-Tenant Refactoring Sprint

> **Durum:** Planlandı  
> **Öncelik:** Orta  
> **Tahmini Süre:** 2-3 gün  
> **Önkoşul:** Mevcut feature geliştirmeleri tamamlandıktan sonra

---

## Amaç

Backend klasör yapısını enterprise-grade multi-tenant mimarisine dönüştürmek:
- Circular dependency sorunlarını kalıcı olarak çözmek
- Guard ve decorator'ları merkezi yönetim altına almak
- Core altyapı modüllerini business logic'ten ayırmak
- Ölçeklenebilir ve güvenli bir yapı oluşturmak

---

## Mevcut Yapı → Hedef Yapı

```
MEVCUT                              HEDEF
src/                                src/
├── auth/                           ├── common/
│   ├── guards/                     │   ├── guards/        ← Tüm guard'lar
│   └── ...                         │   ├── decorators/    ← @CurrentTenant(), @CurrentUser()
├── common/                         │   ├── interceptors/
├── modules/                        │   ├── middleware/
│   ├── users/ ← Core burada       │   └── filters/
│   ├── mail/  ← Infra burada      │
│   └── ...                         ├── core/
└── shared/                         │   ├── auth/          ← Auth strategies, services
                                    │   ├── tenant/        ← Tenant management
                                    │   └── users/         ← User management (core)
                                    │
                                    ├── modules/           ← Pure business modules
                                    │   ├── email-marketing/
                                    │   ├── tickets/
                                    │   └── ...
                                    │
                                    ├── infrastructure/    ← Technical services
                                    │   ├── mail/
                                    │   ├── media/
                                    │   ├── ai/
                                    │   └── backup/
                                    │
                                    └── shared/
```

---

## Sprint Görevleri

### Faz 1: Core Katmanı (Gün 1 - Sabah)
- [ ] `src/core/` klasörü oluştur
- [ ] `src/auth/` → `src/core/auth/` taşı
- [ ] `src/modules/users/` → `src/core/users/` taşı
- [ ] Tüm import path'leri güncelle
- [ ] Build ve test çalıştır

### Faz 2: Common Katmanı (Gün 1 - Öğleden Sonra)
- [ ] `src/common/guards/` oluştur
- [ ] `JwtAuthGuard`, `RolesGuard`, `TenantGuard` → `common/guards/` taşı
- [ ] `src/common/decorators/` oluştur
- [ ] `@CurrentTenant()`, `@CurrentUser()`, `@Roles()` decorator'ları taşı/oluştur
- [ ] `src/common/middleware/` oluştur
- [ ] `TenantResolverMiddleware` oluştur
- [ ] Tüm import path'leri güncelle
- [ ] Build ve test çalıştır

### Faz 3: Infrastructure Katmanı (Gün 2)
- [ ] `src/infrastructure/` klasörü oluştur
- [ ] `src/modules/mail/` → `src/infrastructure/mail/` taşı
- [ ] `src/modules/media/` → `src/infrastructure/media/` taşı
- [ ] `src/modules/backup/` → `src/infrastructure/backup/` taşı
- [ ] `src/modules/ai/` → `src/infrastructure/ai/` taşı (veya `src/ai/`)
- [ ] Tüm import path'leri güncelle
- [ ] Build ve test çalıştır

### Faz 4: Cleanup ve Validation (Gün 3)
- [ ] Eski klasörleri sil
- [ ] Barrel exports (`index.ts`) oluştur
- [ ] Tüm modül import'larını kontrol et
- [ ] Unit test'leri çalıştır
- [ ] E2E test'leri çalıştır
- [ ] Documentation güncelle

---

## Validation Checklist

Her fazdan sonra:
```bash
npm run build          # TypeScript compile
npm run test           # Unit tests
npm run dev            # Runtime başlatma
```

---

## Riskler ve Mitigasyonlar

| Risk | Mitigasyon |
|------|------------|
| Import path hataları | IDE refactoring araçları kullan |
| Circular dependency | Her taşımadan sonra build test et |
| Test kırılmaları | Mock path'leri güncelle |
| Runtime hataları | Dev server'da tam test |

---

## Geri Dönüş Planı

```bash
# Herhangi bir sorun olursa
git checkout main
git branch -D refactor/multi-tenant-structure
```

---

## Referans Belgeler

- [multi-tenant.MD](./multi-tenant.MD) - Hedef yapı şeması
- [NestJS Circular Dependency Docs](https://docs.nestjs.com/fundamentals/circular-dependency)

---

> **Not:** Bu sprint başlamadan önce mevcut tüm feature geliştirmeleri tamamlanmalı ve test edilmelidir.
