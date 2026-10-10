import axios from 'axios';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env
dotenv.config({ path: resolve(__dirname, '../apps/backend/.env') });

const CORTEX_URL = process.env.CORTEX_URL || 'http://localhost:8000';
const QDRANT_URL = 'http://localhost:6333';

async function verifyConnection() {
    console.log(`\n🚀 Starting Neural Grid Verification...`);
    console.log(`📡 Cortex Target: ${CORTEX_URL}`);
    console.log(`💾 Qdrant Target: ${QDRANT_URL}\n`);

    // 1. Test Qdrant (The Memory)
    try {
        const qdrantRes = await axios.get(`${QDRANT_URL}/collections`);
        console.log(`✅ [Qdrant] Connected! Collections found: ${qdrantRes.data.result.length}`);
    } catch (error: any) {
        console.error(`❌ [Qdrant] Connection Failed: ${error.message}`);
        console.error('   -> Is the tunnel running? (./scripts/hybrid-tunnel.sh)');
    }

    // 2. Test Cortex (The Bridge)
    try {
        // Send a test signal
        const testSignal = {
            id: `test-${Date.now()}`,
            text: "This is a neural grid connectivity test signal.",
            type: "SYSTEM_TEST",
            source: "verify-script",
            timestamp: new Date().toISOString(),
            tenantId: "system-admin",
            data: { check: "phase-0" }
        };

        console.log(`\n📨 Sending Test Signal to Cortex...`);
        const cortexRes = await axios.post(`${CORTEX_URL}/signals/ingest`, testSignal);

        if (cortexRes.status === 200 || cortexRes.status === 201) {
            console.log(`✅ [Cortex] Signal Ingested Successfully!`);
            console.log(`   Response: ${JSON.stringify(cortexRes.data)}`);
        } else {
            console.warn(`⚠️ [Cortex] Unexpected Status: ${cortexRes.status}`);
        }

    } catch (error: any) {
        console.error(`❌ [Cortex] Signal Transmission Failed: ${error.message}`);
        if (error.response) {
            console.error(`   Server Responded: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        console.error('   -> Check if internal Cortex port (8000) is tunneled correctly.');
    }

    console.log(`\n🏁 Verification Complete.`);
}

verifyConnection();
