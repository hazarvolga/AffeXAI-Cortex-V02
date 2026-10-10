#!/bin/bash

echo "🚀 Migrating parent/category pages to CMS..."

DB_HOST="localhost"
DB_PORT="5434"
DB_NAME="affexai_dev"
DB_USER="postgres"
DB_PASS="postgres"

# Helper function to create a page
create_page() {
  local title="$1"
  local slug="$2"
  local description="$3"

  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<SQL
    INSERT INTO cms_pages (id, title, slug, description, status, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      '$title',
      '$slug',
      '$description',
      'published',
      NOW(),
      NOW()
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id;
SQL
}

# Helper function to add components to a page
add_components() {
  local slug="$1"
  local components_json="$2"

  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<SQL
    UPDATE cms_pages
    SET components = '$components_json'::jsonb
    WHERE slug = '$slug';
SQL
}

echo "📄 1. Migrating products/allplan page..."

create_page \
  "Allplan Ürün Ailesi" \
  "products/allplan" \
  "Tasarım, mühendislik ve inşaat için her ihtiyaca yönelik kapsamlı BIM çözümleri."

# Create 6 Allplan product cards
ALLPLAN_COMPONENTS=$(cat <<'EOF'
[
  {
    "id": "allplan-hero-1",
    "type": "block",
    "props": {
      "blockId": "hero-with-background-image",
      "title": "Allplan Ürün Ailesi",
      "subtitle": "Tasarım, mühendislik ve inşaat için her ihtiyaca yönerik kapsamlı BIM çözümleri.",
      "backgroundImage": "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1600&auto=format&fit=crop",
      "imageHint": "modern building architecture"
    },
    "orderIndex": 0
  },
  {
    "id": "allplan-intro-text",
    "type": "block",
    "props": {
      "blockId": "content-section-with-title",
      "title": "Projeniz İçin Doğru Allplan'ı Seçin",
      "content": "Allplan, temel 2B çizimden en karmaşık BIM projelerine kadar her ölçekteki ihtiyaca cevap veren esnek bir ürün yelpazesi sunar.",
      "alignment": "center",
      "maxWidth": "3xl"
    },
    "orderIndex": 1
  },
  {
    "id": "allplan-card-basic",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "📐",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Allplan Basic",
      "content": "Temel 2B çizim ve 3B modelleme ihtiyaçlarınız için güçlü ve ekonomik bir başlangıç.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonVariant": "default",
      "buttonHref": "/products/allplan/basic",
      "enableHoverEffect": true,
      "hoverShadow": "xl",
      "hoverTransform": true
    },
    "orderIndex": 2
  },
  {
    "id": "allplan-card-concept",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "✏️",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Allplan Concept",
      "content": "Kavramsal tasarım, hızlı görselleştirme ve sunum için ideal araçlar sunar.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonVariant": "default",
      "buttonHref": "/products/allplan/concept",
      "enableHoverEffect": true,
      "hoverShadow": "xl",
      "hoverTransform": true
    },
    "orderIndex": 3
  },
  {
    "id": "allplan-card-professional",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🏗️",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Allplan Professional",
      "content": "Mimarlar ve mühendisler için tüm profesyonel araçları içeren kapsamlı BIM çözümü.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonVariant": "default",
      "buttonHref": "/products/allplan/professional",
      "enableHoverEffect": true,
      "hoverShadow": "xl",
      "hoverTransform": true
    },
    "orderIndex": 4
  },
  {
    "id": "allplan-card-ultimate",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🏆",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Allplan Ultimate",
      "content": "Tüm Allplan özelliklerini ve modüllerini içeren, en üst düzey projeler için nihai paket.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonVariant": "default",
      "buttonHref": "/products/allplan/ultimate",
      "enableHoverEffect": true,
      "hoverShadow": "xl",
      "hoverTransform": true
    },
    "orderIndex": 5
  },
  {
    "id": "allplan-card-civil",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🛣️",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Allplan Civil",
      "content": "İnşaat mühendisliği ve altyapı projeleri için özel olarak tasarlanmış çözümler sunar.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonVariant": "default",
      "buttonHref": "/products/allplan/civil",
      "enableHoverEffect": true,
      "hoverShadow": "xl",
      "hoverTransform": true
    },
    "orderIndex": 6
  },
  {
    "id": "allplan-card-precast",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🏭",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Allplan Precast",
      "content": "Prefabrik elemanların tasarımı, detaylandırılması ve üretimi için otomasyon sağlar.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonVariant": "default",
      "buttonHref": "/products/allplan/precast",
      "enableHoverEffect": true,
      "hoverShadow": "xl",
      "hoverTransform": true
    },
    "orderIndex": 7
  },
  {
    "id": "allplan-cta",
    "type": "block",
    "props": {
      "blockId": "content-with-call-to-action",
      "title": "Hangi Paketin Size Uygun Olduğundan Emin Değil Misiniz?",
      "content": "Paketleri karşılaştırarak özelliklerini detaylıca inceleyin veya uzman ekibimizden projenize özel öneriler alın.",
      "primaryButtonText": "Satış Temsilcisine Ulaşın",
      "primaryButtonHref": "/contact",
      "secondaryButtonText": "Paketleri Karşılaştır",
      "backgroundColor": "secondary"
    },
    "orderIndex": 8
  }
]
EOF
)

add_components "products/allplan" "$ALLPLAN_COMPONENTS"
echo "✅ products/allplan migrated"

echo ""
echo "📄 2. Migrating products/building-infrastructure page..."

create_page \
  "Bina & Altyapı Ürünleri" \
  "products/building-infrastructure" \
  "Mimari, mühendislik ve altyapı projeleri için uzmanlaşmış BIM çözümleri."

BUILDING_INFRA_COMPONENTS=$(cat <<'EOF'
[
  {
    "id": "building-infra-hero",
    "type": "block",
    "props": {
      "blockId": "hero-with-background-image",
      "title": "Bina & Altyapı Ürünleri",
      "subtitle": "Mimari, mühendislik ve altyapı projeleri için uzmanlaşmış BIM çözümleri.",
      "backgroundImage": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop",
      "imageHint": "modern infrastructure"
    },
    "orderIndex": 0
  },
  {
    "id": "building-infra-card-aec",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🏢",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Allplan AEC",
      "content": "Mimarlık, mühendislik ve inşaat sektörü için entegre BIM platformu.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/products/building-infrastructure/allplan-aec",
      "enableHoverEffect": true
    },
    "orderIndex": 1
  },
  {
    "id": "building-infra-card-bridge",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🌉",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Allplan Bridge",
      "content": "Köprü tasarımı ve mühendisliği için uzmanlaşmış çözüm.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/products/building-infrastructure/allplan-bridge",
      "enableHoverEffect": true
    },
    "orderIndex": 2
  },
  {
    "id": "building-infra-card-ax3000",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "⚡",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "AX3000",
      "content": "Yapı fiziği ve enerji analizi için güçlü araçlar.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/products/building-infrastructure/ax3000",
      "enableHoverEffect": true
    },
    "orderIndex": 3
  }
]
EOF
)

add_components "products/building-infrastructure" "$BUILDING_INFRA_COMPONENTS"
echo "✅ products/building-infrastructure migrated"

echo ""
echo "📄 3. Migrating products/collaboration page..."

create_page \
  "İşbirliği Ürünleri" \
  "products/collaboration" \
  "BIM işbirliği ve proje yönetimi için bulut tabanlı çözümler."

COLLABORATION_COMPONENTS=$(cat <<'EOF'
[
  {
    "id": "collaboration-hero",
    "type": "block",
    "props": {
      "blockId": "hero-with-background-image",
      "title": "İşbirliği Ürünleri",
      "subtitle": "BIM işbirliği ve proje yönetimi için bulut tabanlı çözümler.",
      "backgroundImage": "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1600&auto=format&fit=crop",
      "imageHint": "team collaboration"
    },
    "orderIndex": 0
  },
  {
    "id": "collaboration-card-bimplus",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "☁️",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Bimplus",
      "content": "Bulut tabanlı BIM işbirliği ve proje yönetimi platformu.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/products/collaboration/bimplus",
      "enableHoverEffect": true
    },
    "orderIndex": 1
  }
]
EOF
)

add_components "products/collaboration" "$COLLABORATION_COMPONENTS"
echo "✅ products/collaboration migrated"

echo ""
echo "📄 4. Migrating products/construction-planning page..."

create_page \
  "İnşaat Planlama Ürünleri" \
  "products/construction-planning" \
  "İnşaat süreçlerini optimize etmek için gelişmiş yazılımlar."

CONSTRUCTION_PLANNING_COMPONENTS=$(cat <<'EOF'
[
  {
    "id": "construction-planning-hero",
    "type": "block",
    "props": {
      "blockId": "hero-with-background-image",
      "title": "İnşaat Planlama Ürünleri",
      "subtitle": "İnşaat süreçlerini optimize etmek için gelişmiş yazılımlar.",
      "backgroundImage": "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1600&auto=format&fit=crop",
      "imageHint": "construction planning"
    },
    "orderIndex": 0
  },
  {
    "id": "construction-planning-card-tim",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "📋",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "TIM (Task Information Modeling)",
      "content": "İnşaat süreçlerini optimize etmek için görev tabanlı modelleme.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/products/construction-planning/tim",
      "enableHoverEffect": true
    },
    "orderIndex": 1
  },
  {
    "id": "construction-planning-card-sds2",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🔩",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "SDS/2",
      "content": "Çelik yapı detaylandırma ve fabrikasyon için yazılım.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/products/construction-planning/sds2",
      "enableHoverEffect": true
    },
    "orderIndex": 2
  }
]
EOF
)

add_components "products/construction-planning" "$CONSTRUCTION_PLANNING_COMPONENTS"
echo "✅ products/construction-planning migrated"

echo ""
echo "📄 5. Migrating solutions/building-design page..."

create_page \
  "Bina Tasarımı Çözümleri" \
  "solutions/building-design" \
  "Mimari, strüktürel mühendislik ve MEP için entegre çözümler."

BUILDING_DESIGN_COMPONENTS=$(cat <<'EOF'
[
  {
    "id": "building-design-hero",
    "type": "block",
    "props": {
      "blockId": "hero-with-background-image",
      "title": "Bina Tasarımı Çözümleri",
      "subtitle": "Mimari, strüktürel mühendislik ve MEP için entegre çözümler.",
      "backgroundImage": "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1600&auto=format&fit=crop",
      "imageHint": "building design"
    },
    "orderIndex": 0
  },
  {
    "id": "building-design-card-architecture",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "lucideIcon": "Building",
      "iconType": "lucide",
      "iconBackground": true,
      "title": "Mimari Tasarım",
      "content": "Yenilikçi ve sürdürülebilir mimari çözümler.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/solutions/building-design/architecture",
      "enableHoverEffect": true
    },
    "orderIndex": 1
  },
  {
    "id": "building-design-card-structural",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "lucideIcon": "Construction",
      "iconType": "lucide",
      "iconBackground": true,
      "title": "Yapısal Mühendislik",
      "content": "Güvenli ve verimli yapısal tasarım çözümleri.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/solutions/building-design/structural-engineering",
      "enableHoverEffect": true
    },
    "orderIndex": 2
  },
  {
    "id": "building-design-card-mep",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "lucideIcon": "Zap",
      "iconType": "lucide",
      "iconBackground": true,
      "title": "MEP (Mekanik, Elektrik, Tesisat)",
      "content": "Entegre bina sistemleri ve tesisatı için çözümler.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/solutions/building-design/mep",
      "enableHoverEffect": true
    },
    "orderIndex": 3
  }
]
EOF
)

add_components "solutions/building-design" "$BUILDING_DESIGN_COMPONENTS"
echo "✅ solutions/building-design migrated"

echo ""
echo "📄 6. Migrating solutions/infrastructure-design page..."

create_page \
  "Altyapı Tasarımı Çözümleri" \
  "solutions/infrastructure-design" \
  "Yol, köprü ve altyapı projeleri için güçlü modelleme araçları."

INFRA_DESIGN_COMPONENTS=$(cat <<'EOF'
[
  {
    "id": "infra-design-hero",
    "type": "block",
    "props": {
      "blockId": "hero-with-background-image",
      "title": "Altyapı Tasarımı Çözümleri",
      "subtitle": "Yol, köprü ve altyapı projeleri için güçlü modelleme araçları.",
      "backgroundImage": "https://images.unsplash.com/photo-1496247749665-49cf5b1022e9?q=80&w=1600&auto=format&fit=crop",
      "imageHint": "infrastructure design"
    },
    "orderIndex": 0
  },
  {
    "id": "infra-design-card-engineering",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "lucideIcon": "Network",
      "iconType": "lucide",
      "iconBackground": true,
      "title": "Altyapı Mühendisliği",
      "content": "Kentsel altyapı projeleri için kapsamlı çözümler.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/solutions/infrastructure-design/infrastructure-engineering",
      "enableHoverEffect": true
    },
    "orderIndex": 1
  },
  {
    "id": "infra-design-card-road",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🛣️",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Yol ve Demiryolu Tasarımı",
      "content": "Karayolu ve raylı sistem altyapısı için gelişmiş araçlar.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/solutions/infrastructure-design/road-railway-design",
      "enableHoverEffect": true
    },
    "orderIndex": 2
  },
  {
    "id": "infra-design-card-bridge",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🌉",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Köprü Tasarımı",
      "content": "Parametrik köprü modelleme ve mühendislik çözümleri.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/solutions/infrastructure-design/bridge-design",
      "enableHoverEffect": true
    },
    "orderIndex": 3
  }
]
EOF
)

add_components "solutions/infrastructure-design" "$INFRA_DESIGN_COMPONENTS"
echo "✅ solutions/infrastructure-design migrated"

echo ""
echo "📄 7. Migrating solutions/construction-planning page..."

create_page \
  "İnşaat Planlaması Çözümleri" \
  "solutions/construction-planning" \
  "Prefabrik üretimden çelik detaylandırmaya kadar inşaatın her aşamasını optimize edin."

CONST_PLANNING_COMPONENTS=$(cat <<'EOF'
[
  {
    "id": "const-planning-hero",
    "type": "block",
    "props": {
      "blockId": "hero-with-background-image",
      "title": "İnşaat Planlaması Çözümleri",
      "subtitle": "Prefabrik üretimden çelik detaylandırmaya kadar inşaatın her aşamasını optimize edin.",
      "backgroundImage": "https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?q=80&w=1600&auto=format&fit=crop",
      "imageHint": "construction planning"
    },
    "orderIndex": 0
  },
  {
    "id": "const-planning-card-precast",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🏭",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Prekast Üretim",
      "content": "Prefabrik beton üretim süreçleri için otomasyon.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/solutions/construction-planning/precast-production",
      "enableHoverEffect": true
    },
    "orderIndex": 1
  },
  {
    "id": "const-planning-card-steel",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🔩",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Çelik Detaylandırma",
      "content": "Çelik yapı fabrikasyonu için detaylı modelleme.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/solutions/construction-planning/steel-detailing",
      "enableHoverEffect": true
    },
    "orderIndex": 2
  },
  {
    "id": "const-planning-card-site",
    "type": "block",
    "props": {
      "blockId": "special-feature-card-single",
      "icon": "🏗️",
      "iconType": "emoji",
      "iconBackground": true,
      "title": "Şantiye Planlama",
      "content": "İnşaat sahası organizasyonu ve lojistik planlaması.",
      "enableButton": true,
      "buttonText": "Detayları İncele",
      "buttonHref": "/solutions/construction-planning/site-planning",
      "enableHoverEffect": true
    },
    "orderIndex": 3
  }
]
EOF
)

add_components "solutions/construction-planning" "$CONST_PLANNING_COMPONENTS"
echo "✅ solutions/construction-planning migrated"

echo ""
echo "📊 Checking migration results..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<SQL
SELECT
  slug,
  title,
  jsonb_array_length(components) as component_count
FROM cms_pages
WHERE slug IN (
  'products/allplan',
  'products/building-infrastructure',
  'products/collaboration',
  'products/construction-planning',
  'solutions/building-design',
  'solutions/infrastructure-design',
  'solutions/construction-planning'
)
ORDER BY slug;
SQL

echo ""
echo "🎉 Migration complete! All 7 parent pages have been migrated to CMS."
echo ""
echo "View pages at:"
echo "  - http://localhost:9003/products/allplan"
echo "  - http://localhost:9003/products/building-infrastructure"
echo "  - http://localhost:9003/products/collaboration"
echo "  - http://localhost:9003/products/construction-planning"
echo "  - http://localhost:9003/solutions/building-design"
echo "  - http://localhost:9003/solutions/infrastructure-design"
echo "  - http://localhost:9003/solutions/construction-planning"
