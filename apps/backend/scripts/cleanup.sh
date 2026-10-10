#!/bin/bash

# Backend Cleanup Script
# Zombie processleri temizle

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧹 Cleaning up backend processes...${NC}"

# NestJS processlerini bul ve göster
NEST_PIDS=$(ps aux | grep "nest start" | grep -v grep | awk '{print $2}')

if [ -z "$NEST_PIDS" ]; then
    echo -e "${GREEN}✅ No NestJS processes found${NC}"
else
    echo -e "${YELLOW}Found NestJS processes:${NC}"
    ps aux | grep "nest start" | grep -v grep

    echo -e "${YELLOW}Killing processes...${NC}"
    echo "$NEST_PIDS" | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Killed $(echo "$NEST_PIDS" | wc -w | tr -d ' ') processes${NC}"
fi

# Port 9006'yı kontrol et ve temizle
PORT_PIDS=$(lsof -ti:9006 2>/dev/null)

if [ -z "$PORT_PIDS" ]; then
    echo -e "${GREEN}✅ Port 9006 is free${NC}"
else
    echo -e "${YELLOW}Port 9006 is in use, cleaning up...${NC}"
    echo "$PORT_PIDS" | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Port 9006 freed${NC}"
fi

echo -e "${GREEN}🎉 Cleanup complete!${NC}"
