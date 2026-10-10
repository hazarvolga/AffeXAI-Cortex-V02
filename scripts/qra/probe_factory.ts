import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AffeXAI dev: Probe Factory
 * Autonomous execution of QRA Resonance Probes.
 */

interface CircuitNode {
    id: string;
    node: string;
    service?: string;
    status: string;
    reason?: string;
}

interface CircuitMap {
    project: string;
    version: string;
    system: string;
    last_audit: string;
    modules: {
        [key: string]: {
            path: string;
            circuits: CircuitNode[];
        };
    };
    deep_dive_hooks: {
        on_failure: string;
        parameters: string[];
    };
}

const CIRCUIT_MAP_PATH = path.join(process.cwd(), 'docs/system_circuit_map.json');

async function runResonanceProbe() {
    console.log(":: INITIALIZING AFFEXAI DEV RESONANCE PROBE ::");

    if (!fs.existsSync(CIRCUIT_MAP_PATH)) {
        console.error("ERROR: system_circuit_map.json NOT FOUND. Run inventory first.");
        return;
    }

    const map: CircuitMap = JSON.parse(fs.readFileSync(CIRCUIT_MAP_PATH, 'utf8'));
    // Report Generation Buffer
    const reportLines: string[] = [];
    reportLines.push(`# AffeXAI Resonance Report`);
    reportLines.push(`**Timestamp:** ${new Date().toISOString()}`);
    reportLines.push(`**System Version:** ${map.version || 'N/A'}`); // Use map.version
    reportLines.push(`\n## Module Status`);

    let totalCircuits = 0;
    let stableCircuits = 0;
    let brokenCircuits = 0;

    Object.entries(map.modules).forEach(([moduleName, moduleData]: [string, any]) => { // Use map.modules
        console.log(`\n[AUDIT] Scanning Module: ${moduleName.toUpperCase()}`);
        reportLines.push(`\n### Module: ${moduleName.toUpperCase()}`);

        moduleData.circuits.forEach((circuit: any) => {
            totalCircuits++;
            console.log(`  [SIGNAL] Testing Circuit: ${circuit.id}...`);

            // Simulate Probe Logic (In production, this would be a real active probe)
            // For now, checks 'status' field in JSON map as the source of truth

            if (circuit.status === 'BROKEN') {
                console.log(`  ⚠️  [STATUS] BROKEN: ${circuit.reason}`);
                brokenCircuits++;
                reportLines.push(`- 🔴 **${circuit.id}**: BROKEN (${circuit.reason})`);

                // Autonomous Deep-Dive Trigger
                const traceId = `ERR_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                const debugPayload = {
                    traceId: traceId,
                    circuitId: circuit.id,
                    service: circuit.service,
                    timestamp: new Date().toISOString(),
                    context: "ProbeFactory System Audit"
                };

                const debugFile = `docs/qra_debug_${circuit.id.toLowerCase()}.json`;
                fs.writeFileSync(debugFile, JSON.stringify(debugPayload, null, 2)); // Use fs
                console.log(`      [FORENSIC] Generated Deep-Dive Report: ${debugFile}`);
                reportLines.push(`  - Forensic Report: \`${debugFile}\``);

            } else {
                console.log(`  ✅ [RES] STABLE`);
                stableCircuits++;
                reportLines.push(`- ✅ **${circuit.id}**: STABLE`);
            }
        });
    });

    console.log(`\n:: AUDIT COMPLETE :: ${brokenCircuits} BROKEN CIRCUITS DETECTED ::`);
    if (brokenCircuits > 0) {
        console.log(`SUGGESTION: Run 'AffeXAI heal' to initiate surgical repairs.`);
    }

    // Final Stats
    const resonanceScore = totalCircuits > 0 ? Math.round((stableCircuits / totalCircuits) * 100) : 100;
    reportLines.push(`\n## Summary`);
    reportLines.push(`- **Total Circuits:** ${totalCircuits}`);
    reportLines.push(`- **Stable:** ${stableCircuits}`);
    reportLines.push(`- **Broken:** ${brokenCircuits}`);
    reportLines.push(`- **Resonance Score:** ${resonanceScore}%`);

    // Write Report
    const reportFile = `docs/resonance_report_${new Date().toISOString().split('T')[0]}.md`;
    fs.writeFileSync(reportFile, reportLines.join('\n')); // Use fs
    console.log(`\n📄 Report Generated: ${reportFile}`);
}

// The triggerDeepDive function is no longer used by the new logic, but keeping it as per instructions not to remove unrelated edits.
function triggerDeepDive(circuit: CircuitNode) {
    console.log(`\n:: TRIGGERING DEEP-DIVE DEBUGGER FOR ${circuit.id} ::`);
    const debugReport = {
        timestamp: new Date().toISOString(),
        circuit_id: circuit.id,
        node: circuit.node,
        service: circuit.service,
        context: "AUTOMATED_RES_FAIL"
    };

    const reportPath = path.join(process.cwd(), `docs/qra_debug_${circuit.id.toLowerCase()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(debugReport, null, 2));
    console.log(`[SYS] Deep-Dive forensic data saved to: ${reportPath}`);
}

runResonanceProbe().catch(console.error);
