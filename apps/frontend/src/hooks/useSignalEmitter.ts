'use client';

import { useCallback } from 'react';
import { httpClient } from '@/lib/api/http-client';

export enum SignalType {
    SENTIMENT = 'SENTIMENT',
    INTENT = 'INTENT',
    INTERACTION = 'INTERACTION',
    FRICTION = 'FRICTION',
    RESONANCE = 'RESONANCE'
}

export enum SignalSource {
    FORM = 'FORM',
    EVENT = 'EVENT',
    CMS = 'CMS',
    SUPPORT = 'SUPPORT',
    SYSTEM = 'SYSTEM'
}

interface EmitSignalParams {
    type: SignalType;
    source: SignalSource;
    intensity: number;
    message?: string;
    metadata?: Record<string, any>;
}

export function useSignalEmitter() {
    const emitSignal = useCallback(async (params: EmitSignalParams) => {
        try {
            // Non-blocking fire and forget using centralized httpClient for auth token
            httpClient.post('/bcc/emit', params)
                .catch(err => console.error('Signal emission failed:', err));
        } catch (error) {
            // Silently fail to not disrupt user experience
            console.error('BCC Signal Error:', error);
        }
    }, []);

    const emitFriction = useCallback((source: SignalSource, message: string, metadata?: any) => {
        emitSignal({
            type: SignalType.FRICTION,
            source,
            intensity: 0.8,
            message,
            metadata
        });
    }, [emitSignal]);

    const emitInteraction = useCallback((source: SignalSource, message: string, metadata?: any) => {
        emitSignal({
            type: SignalType.INTERACTION,
            source,
            intensity: 0.2,
            message,
            metadata
        });
    }, [emitSignal]);

    return {
        emitSignal,
        emitFriction,
        emitInteraction
    };
}
