#!/bin/bash

# MinIO Cleanup ve Smart Migration Runner
# Bu script MinIO'yu temizler ve yeni migration'ı çalıştırır

set -e  # Hata durumunda dur

echo "🚀 MinIO Cleanup ve Smart Migration Başlıyor..."
echo ""

# Environment variables
export MINIO_ENDPOINT="http://localhost:9007"
export MINIO_ACCESS_KEY="minioadmin"
export MINIO_SECRET_KEY="minioadmin"
export MINIO_BUCKET="cms-media"

echo "📋 Ayarlar:"
echo "   MINIO_ENDPOINT: $MINIO_ENDPOINT"
echo "   MINIO_BUCKET: $MINIO_BUCKET"
echo ""

# Kullanıcıdan onay al
read -p "⚠️  MinIO'daki TÜM görseller silinecek. Devam etmek istiyor musunuz? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ İşlem iptal edildi."
    exit 1
fi

echo ""
echo "==================================================================="
echo "ADIM 1: MinIO Temizlik"
echo "==================================================================="
echo ""

npx tsx apps/backend/scripts/migration/cleanup-minio.ts

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ MinIO temizlik başarısız oldu!"
    exit 1
fi

echo ""
echo "==================================================================="
echo "ADIM 2: Smart Migration"
echo "==================================================================="
echo ""

npx tsx apps/backend/scripts/migration/smart-migration.ts

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Smart migration başarısız oldu!"
    exit 1
fi

echo ""
echo "==================================================================="
echo "✅ TÜM İŞLEMLER TAMAMLANDI!"
echo "==================================================================="
echo ""
echo "📊 Sonuçları kontrol edin:"
echo "   - apps/backend/extracted_pages/MIGRATION_SUMMARY.json"
echo ""
