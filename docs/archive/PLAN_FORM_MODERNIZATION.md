# PLAN: Enterprise Form Modernization & BCC Integration

Bu plan, Form Builder modülünü kurumsal (Enterprise) seviyeye taşımayı ve yeni kurulan BCC Sinyal Mimarisi ile tam entegre çalışır hale getirmeyi hedefler.

## Goal
Form modülünü pasif bir veri toplama aracından, dinamik bir "Etkileşim Sensörü"ne dönüştürmek.

---

## 🛠️ Proposed Changes

### 1. Frontend: Dynamic Logic Engine
Form bileşenlerine "Koşullu Görünürlük" (Conditional Visibility) yeteneği eklenecek.

- **`FormBuilderCanvas` Refactor**: Render sırasında her bloğun `logic` kuralları kontrol edilecek.
- **Rules Interface**:
  ```typescript
  interface VisibilityRule {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: any;
  }
  ```
- **Property Sidebar**: Kullanıcının kolayca kural atayabileceği bir "Mantık" (Logic) sekmesi eklenecek.

### 2. BCC Integration: "Sensor-Native" Forms
Form içindeki her kullanıcı hareketi BCC için bir sinyal kaynağıdır.

- **`useSignalEmitter` Entegrasyonu**:
  - **Friction Signal**: Kullanıcı bir alanı temizleyip tekrar yazarsa veya çok vakit geçirirse.
  - **Sentiment Signal**: Form sonundaki "Geri Bildirim" alanı anlık duygu analizi yapacak.
  - **Resonance Signal**: Form başarıyla tamamlandığında markaya olan ilgi sinyali fırlatılacak.

### 3. Backend: Schema Evolution
Form şemasının kuralları saklayabilmesi için güncelleme yapılacak.
- `Form` entitesine `logic_config: JSON` alanı eklenecek (TypeORM).
- CRUD endpointleri bu yeni konfigürasyonu destekleyecek şekilde güncellenecek.

---

## 👥 Orchestration Strategy

| Agent | Responsibility |
|-------|----------------|
| `frontend-specialist` | Logic Engine implementation & Logic UI in Sidebar |
| `backend-specialist` | TypeORM Schema updates & API validation |
| `test-engineer` | Integration tests for conditional logic cases |

---

## 🏁 Verification Plan

### Automated
- `npm test form-logic-engine.spec.ts`: Kuralların doğru çalışıp çalışmadığını test eder.
- `cypress run`: Çok adımlı ve koşullu bir formun doldurulma simülasyonu.

### Manual
- Form Builder'da bir alanı "Şu seçilirse göster" şeklinde ayarlayıp önizlemede doğrulamak.
- BCC Dashboard'dan form doldurma sırasında gelen canlı sinyalleri izlemek.
