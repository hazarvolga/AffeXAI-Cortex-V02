#!/bin/bash
# ============================================
# Affexai Development Environment Cleanup Script
# ============================================
# Bu script gelistirme ortamindaki zombi prosesleri temizler
# ve portlari serbest birakir.
#
# Kullanim: ./scripts/cleanup.sh
# ============================================

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   Affexai Temizlik Scripti             ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Renk kodlari
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# NestJS proseslerini durdur
echo -e "${YELLOW}[1/4]${NC} NestJS prosesleri kontrol ediliyor..."
NEST_PIDS=$(pgrep -f "nest start" 2>/dev/null)
if [ -n "$NEST_PIDS" ]; then
    echo "$NEST_PIDS" | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓${NC} NestJS prosesleri durduruldu (PID: $NEST_PIDS)"
else
    echo -e "${GREEN}✓${NC} Calisan NestJS prosesi yok"
fi

# Next.js proseslerini durdur
echo -e "${YELLOW}[2/4]${NC} Next.js prosesleri kontrol ediliyor..."
NEXT_PIDS=$(pgrep -f "next-server" 2>/dev/null)
if [ -n "$NEXT_PIDS" ]; then
    echo "$NEXT_PIDS" | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓${NC} Next.js prosesleri durduruldu (PID: $NEXT_PIDS)"
else
    echo -e "${GREEN}✓${NC} Calisan Next.js prosesi yok"
fi

# Port 9003 (Frontend) temizle
echo -e "${YELLOW}[3/4]${NC} Port 9003 (Frontend) kontrol ediliyor..."
PORT_9003_PID=$(lsof -ti:9003 2>/dev/null)
if [ -n "$PORT_9003_PID" ]; then
    echo "$PORT_9003_PID" | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓${NC} Port 9003 serbest birakildi (PID: $PORT_9003_PID)"
else
    echo -e "${GREEN}✓${NC} Port 9003 zaten bos"
fi

# Port 9006 (Backend) temizle
echo -e "${YELLOW}[4/4]${NC} Port 9006 (Backend) kontrol ediliyor..."
PORT_9006_PID=$(lsof -ti:9006 2>/dev/null)
if [ -n "$PORT_9006_PID" ]; then
    echo "$PORT_9006_PID" | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓${NC} Port 9006 serbest birakildi (PID: $PORT_9006_PID)"
else
    echo -e "${GREEN}✓${NC} Port 9006 zaten bos"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Temizlik tamamlandi!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Simdi servisleri baslatabilirsiniz:"
echo "  Backend:  cd apps/backend && npm run dev"
echo "  Frontend: cd apps/frontend && npm run dev"
echo ""
