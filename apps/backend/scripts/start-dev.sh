#!/bin/bash

# Backend Development Start Script
# Kalıcı zombie process çözümü

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Starting Backend Development Server...${NC}"

# 1. Önce tüm eski NestJS processlerini temizle
echo -e "${YELLOW}Cleaning up old processes...${NC}"
ps aux | grep "nest start" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
lsof -ti:9006 | xargs kill -9 2>/dev/null

# Kısa bekle
sleep 2

# 2. Port'un gerçekten boş olduğunu kontrol et
if lsof -Pi :9006 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Port 9006 hala kullanımda!${NC}"
    echo -e "${YELLOW}Port 9006'yı kullanan process:${NC}"
    lsof -i :9006
    exit 1
else
    echo -e "${GREEN}✅ Port 9006 available${NC}"
fi

# 3. Backend klasörüne git
cd "$(dirname "$0")/.."

# 4. NestJS'i başlat
echo -e "${GREEN}🚀 Starting NestJS...${NC}"
# Prevent ENOTEMPTY errors by cleaning build artifacts
rm -rf dist
npm run start:dev

# Script sonlandığında cleanup yap
trap 'echo -e "${YELLOW}Shutting down...${NC}"; lsof -ti:9006 | xargs kill -9 2>/dev/null' EXIT
