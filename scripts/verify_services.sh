#!/bin/bash
echo "Verifying services..."

# Check Backend
if curl -s http://localhost:9006/api/health > /dev/null; then
  echo "✅ Backend connected on port 9006"
else
  echo "❌ Backend failed on port 9006"
fi

# Check Frontend
if curl -s -I http://localhost:9003 > /dev/null; then
  echo "✅ Frontend connected on port 9003"
else
  echo "❌ Frontend failed on port 9003"
fi
