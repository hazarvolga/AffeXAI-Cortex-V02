#!/bin/bash

# Configuration
# Replace these with your actual server details or set via environment variables.
REMOTE_USER=${HULYA_SERVER_USER:-ubuntu}
REMOTE_HOST=${HULYA_SERVER_IP:-161.118.171.201}
KEY_PATH="${HULYA_KEY_PATH:-/Users/hazarekiz/sunucu_yonetimi/affex_ai_servers/AffeXAI-main/Oracle Sunucuları/instance-hulya/ssh-key-2025-09-20.key}"


# Port Configuration
OLLAMA_PORT=11434
QDRANT_PORT=6333
# Cortex runs on port 3000 on the remote server (mapped to 8000 locally)
CORTEX_REMOTE_PORT=3000
CORTEX_LOCAL_PORT=8000

echo "🚀 Starting AffeXAI Hybrid Tunnel..."
echo "🎯 Remote: $REMOTE_USER@$REMOTE_HOST"
echo "🔑 Key: $KEY_PATH"

# Check for existing processes
for PORT in $OLLAMA_PORT $QDRANT_PORT $CORTEX_LOCAL_PORT; do
    if lsof -i :$PORT >/dev/null; then
        PID=$(lsof -t -i:$PORT)
        echo "⚠️  Port $PORT is already in use (PID: $PID). Please close existing tunnels first."
        echo "Tip: Run 'kill $PID' if it's a stale process."
    fi
done

echo "🔗 Mapping Ports:"
echo "   - localhost:$OLLAMA_PORT -> Remote:$OLLAMA_PORT (Ollama)"
echo "   - localhost:$QDRANT_PORT -> Remote:$QDRANT_PORT (Qdrant)"
echo "   - localhost:$CORTEX_LOCAL_PORT -> Remote:$CORTEX_REMOTE_PORT (Cortex API)"

# Create SSH Tunnel for ALL ports
ssh -N \
    -L $OLLAMA_PORT:localhost:$OLLAMA_PORT \
    -L $QDRANT_PORT:localhost:$QDRANT_PORT \
    -L $CORTEX_LOCAL_PORT:localhost:$CORTEX_REMOTE_PORT \
    -i "$KEY_PATH" \
    $REMOTE_USER@$REMOTE_HOST \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3

if [ $? -eq 0 ]; then
    echo "✅ Tunnel closed normally."
else
    echo "❌ Tunnel connection failed or interrupted."
fi
