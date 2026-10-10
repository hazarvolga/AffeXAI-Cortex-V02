'use client';

import React, { useEffect, useState, useRef } from 'react';

interface VoiceInterfaceProps {
    onCommand: (command: string) => void;
    isActive: boolean;
}

export function VoiceCommandInterface({ onCommand, isActive }: VoiceInterfaceProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript.trim();
                addLog(`> Voice: "${transcript}"`);
                onCommand(transcript);

                // Simple mock command handling
                if (transcript.toLowerCase().includes('open logs')) {
                    addLog("Executing: NAVIGATE_TO -> /admin/logs");
                } else if (transcript.toLowerCase().includes('status')) {
                    addLog("Executing: SYSTEM_STATUS_CHECK");
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech error", event.error);
                addLog(`! Error: ${event.error}`);
            };
        } else {
            addLog("! Web Speech API not supported in this browser.");
        }
    }, [onCommand]);

    useEffect(() => {
        if (isActive && recognitionRef.current) {
            try {
                recognitionRef.current.start();
                addLog("* Listening activated...");
            } catch (e) {
                // Already started
            }
        } else if (!isActive && recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                addLog("* Listening suspended.");
            } catch (e) {
                // Already stopped
            }
        }
    }, [isActive]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-9), msg]); // Keep last 10 logs
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px]">
                {logs.length === 0 && <span className="text-white/20 italic">System ready. Waiting for input...</span>}
                {logs.map((log, i) => (
                    <div key={i} className={log.startsWith('!') ? 'text-red-400' : log.startsWith('>') ? 'text-[#9df425]' : 'text-white/60'}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
}
