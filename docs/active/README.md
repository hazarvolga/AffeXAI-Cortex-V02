# docs Dizin İndeksi

**Son düzenleme:** 2026-10-07

## Yapı

```
docs/
  active/   # Güncel, bakımı yapılan belgeler (38 dosya)
  archive/  # Tarihsel PLAN_*/FIX_*/DEBUG_* dosyaları (61 dosya) - referans için
  *.json    # QRA toolchain kaynak dosyaları (kökte KALMALI):
            #   system_circuit_map.json, qra_debug_*.json, qra_circuit_map.json
```

* `./bin/affexai audit` → `docs/system_circuit_map.json` ve `docs/qra_debug_*.json`
  dosyalarını kök konumundan okur — bu JSON'ları taşımayın.

## Aktif Belgeler (özet)

| Kategori | Dosyalar |
|---|---|
| Kullanım & kurulum | `active/USER_GUIDE.md`, `active/DATABASE_CONNECTION.md`, `active/MIGRATIONS.md` |
| Mimari & kararlar | `active/BCC_INTEGRATION_GUIDE.md`, `active/DECISION_STRATEGY_V2.md`, `active/QRA_SPEC.md` |
| Denetim raporları | `active/MULTI_TENANCY_AUDIT_REPORT.md`, `active/PROJE_DURUM_ANALIZI_2026.md`, `active/ANALYSIS_REPORT_2026.md`, `active/RISK_ANALYSIS.md` |
| Devam eden işler | `active/TODO.md`, `active/FUTURE_PLAN.md`, `active/LAST_SESSION_RECOVERY.md`, `active/RESUMPTION_CONTEXT.md` |
| Sürüm & standartlar | `active/RELEASE_NOTES_v0.1.0.md`, `active/GIT_STANDARDS_REPORT.md` |

## Paket Yöneticisi Kararı

- **CI ve lock dosyası npm**: `.github/workflows/*.yml` → `npm ci`, `package-lock.json` (1.5MB), `.npmrc` → `package-lock=true`.
- **Bu makinede pnpm**: `pnpm-workspace.yaml` mevcut, `npm` binary'si PATH'te yok.
- **Geçerli standart:** npm (CI uyumu). `pnpm-workspace.yaml` yalnızca pnpm kullanıcıları içindir.
- Kurulum: `npm install` (macOS'ta npm yoksa: `corepack enable` veya Node resmi kurulumu).
