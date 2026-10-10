# Error Elimination Plan (399 Remaining)

520 hatadan başlayan operasyonda 399 hataya ulaştık. Kalan hatalar daha derin tescil kırıntılarını ve monorepo senkronizasyon pürüzlerini kapsıyor.

## Proposed Strategy

### 1. User Profile Metadata Enhancement
`src/app/complete-profile/page.tsx` üzerinde saptanan `taxNumber`, `companyPhone`, `companyAddress`, `companyCity` gibi alanlar `@affexai/shared-types` içindeki `User` veya `Profile` tipinde eksik görünüyor.
- **Action:** `packages/shared-types` içindeki ilgili arayüzleri bu alanları opsiyonel olarak içerecek şekilde güncelle.

### 2. Query Hooks Alignment
`src/lib/query/` altındaki hooklar (`useApiQuery`, `infinite-query` vb.) üzerinde `pagination` ve `UseApiQueryOptions` gibi tip uyumsuzlukları var.
- **Action:** `shared-types` içindeki `ListResponse` tipini `pagination` içerecek şekilde standardize et ve hook exportlarını düzelt.

### 3. SiteSettings Export Ghost
`npm run build` sırasında saptanan `SiteSettings` import hatasının izini süreceğiz. `shared-types/src/index.ts` dosyasına eklememize rağmen frontend bunu bazen görmüyor olabilir.
- **Action:** Export yollarını doğrula ve gerekiyorsa `any` cast ile geçici köprü kurarak build'i tamamla.

### 4. Miscellaneous Cleanups
- `Buffer` vs `String` uyumsuzlukları (bulk-operation-optimizer.ts)
- `statusCode` mülk erişimleri (query-client.ts)
- Geri kalan ufak mülk erişim hataları.

## Verification Plan
1. `npx tsc --noEmit` ile her cluster için doğrulama.
2. `npm run build` ile final tescili.
