# FINAL ERROR ELIMINATION PLAN (399 ERRORS)

Bu plan, projedeki son 399 TypeScript hatasını "kolay yola kaçmadan" sağlam bir altyapı üzerine tescillemeyi hedefler.

## Phase 1: Shared-Types Alignment (The Foundation)
Hataların %80'i tipleme uyumsuzluklarından kaynaklanıyor.
- **UserMetadata Update:** `taxNumber`, `companyName`, `companyPhone`, `companyAddress`, `companyCity` alanlarını `UserMetadata` kök seviyesine (veya `customerData` ile senkronize) opsiyonel olarak ekle.
- **Generic ListResponse Audit:** `ListResponse<T>` tipini hem `items` hem de `pagination` (veya `data` & `pagination`) içerecek şekilde frontend hook'ları (`infinite-query.ts`) ile tam uyumlu hale getir.
- **SiteSettings Export Fix:** `shared-types/src/index.ts` exportlarının build sırasında doğru çözümlenmesini sağla.

## Phase 2: Backend/Shared Package Rebuild
- `packages/shared-types` içerisinde `npm run build` çalıştırarak frontend'in güncel tipleri görmesini sağla.

## Phase 3: Frontend Semantic Fixes (The Polish)
- **Profile Completion:** `src/app/complete-profile/page.tsx` dosyasındaki metadata erişimlerini yeni modele göre güncelle.
- **Query Hooks:** `src/lib/query/` altındaki hook'ları `any` kullanmadan, yeni `ListResponse` yapısına tescille.
- **LogsConsole Fix:** `LogsConsole.tsx` üzerindeki import/render pürüzlerini temizle (başlatıldı).

## Phase 4: Verification & Quality Gate
- `npx tsc --noEmit` ile 0 hata hedefi.
- `npm run build` prodüksiyon testi.
- `security_scan.py` ile güvenlik denetimi.

## Context for Agents
- **Project Type:** Full Stack Next.js + Nest.js Monorepo.
- **Constraint:** Minimize `any` usage. Prefer model updates over casting.
- **Verification:** Mandatory `tsc` check after each cluster fix.
