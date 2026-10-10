'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * Loading State Interface
 * Defines the structure of a loading operation
 */
export interface LoadingState {
  /** Unique identifier for the loading operation */
  id: string;
  /** Human-readable message (optional) */
  message?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Component or feature triggering the loading */
  source?: string;
  /** Timestamp when loading started */
  startedAt: number;
}

/**
 * Loading Context Value Interface
 * Provides all loading state management functionality
 */
interface LoadingContextValue {
  /** All active loading operations */
  loadingStates: LoadingState[];
  /** Whether any loading is in progress */
  isLoading: boolean;
  /** Number of active loading operations */
  loadingCount: number;
  /** Start a new loading operation */
  startLoading: (id: string, options?: { message?: string; source?: string }) => void;
  /** Stop a loading operation */
  stopLoading: (id: string) => void;
  /** Update loading progress */
  updateProgress: (id: string, progress: number) => void;
  /** Update loading message */
  updateMessage: (id: string, message: string) => void;
  /** Stop all loading operations */
  stopAllLoading: () => void;
  /** Check if specific loading is active */
  isLoadingId: (id: string) => boolean;
  /** Get loading state by ID */
  getLoadingState: (id: string) => LoadingState | undefined;
}

/**
 * Loading Context
 * Provides global loading state management across the application
 */
const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

/**
 * Loading Provider Props
 */
interface LoadingProviderProps {
  children: React.ReactNode;
  /** Auto-stop loading after timeout (ms) to prevent stuck states */
  autoStopTimeout?: number;
}

/**
 * Loading Provider Component
 * Manages global loading states and provides context to children
 * 
 * @example
 * ```tsx
 * <LoadingProvider autoStopTimeout={30000}>
 *   <App />
 * </LoadingProvider>
 * ```
 */
export function LoadingProvider({ 
  children, 
  autoStopTimeout = 30000 // 30 seconds default
}: LoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Start a new loading operation
   */
  const startLoading = useCallback((
    id: string, 
    options?: { message?: string; source?: string }
  ) => {
    setLoadingStates(prev => {
      // If already loading with this ID, update it
      const existing = prev.find(state => state.id === id);
      if (existing) {
        return prev.map(state => 
          state.id === id 
            ? { ...state, ...options, startedAt: Date.now() }
            : state
        );
      }

      // Add new loading state
      return [...prev, {
        id,
        message: options?.message,
        source: options?.source,
        startedAt: Date.now(),
      }];
    });

    // Set auto-stop timeout
    if (autoStopTimeout > 0) {
      // Clear existing timeout if any
      const existingTimeout = timeoutRefs.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        console.warn(`Loading operation "${id}" auto-stopped after ${autoStopTimeout}ms`);
        stopLoading(id);
      }, autoStopTimeout);

      timeoutRefs.current.set(id, timeout);
    }
  }, [autoStopTimeout]);

  /**
   * Stop a loading operation
   */
  const stopLoading = useCallback((id: string) => {
    setLoadingStates(prev => prev.filter(state => state.id !== id));

    // Clear timeout
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  /**
   * Update loading progress
   */
  const updateProgress = useCallback((id: string, progress: number) => {
    setLoadingStates(prev => 
      prev.map(state => 
        state.id === id 
          ? { ...state, progress: Math.max(0, Math.min(100, progress)) }
          : state
      )
    );
  }, []);

  /**
   * Update loading message
   */
  const updateMessage = useCallback((id: string, message: string) => {
    setLoadingStates(prev => 
      prev.map(state => 
        state.id === id 
          ? { ...state, message }
          : state
      )
    );
  }, []);

  /**
   * Stop all loading operations
   */
  const stopAllLoading = useCallback(() => {
    setLoadingStates([]);
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  /**
   * Check if specific loading is active
   */
  const isLoadingId = useCallback((id: string) => {
    return loadingStates.some(state => state.id === id);
  }, [loadingStates]);

  /**
   * Get loading state by ID
   */
  const getLoadingState = useCallback((id: string) => {
    return loadingStates.find(state => state.id === id);
  }, [loadingStates]);

  const value: LoadingContextValue = {
    loadingStates,
    isLoading: loadingStates.length > 0,
    loadingCount: loadingStates.length,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
    stopAllLoading,
    isLoadingId,
    getLoadingState,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Hook to access loading context
 * Must be used within LoadingProvider
 * 
 * @example
 * ```tsx
 * const { startLoading, stopLoading, isLoading } = useLoadingContext();
 * 
 * // Start loading
 * startLoading('fetch-users', { 
 *   message: 'Kullanıcılar yükleniyor...',
 *   source: 'UserList'
 * });
 * 
 * // Stop loading
 * stopLoading('fetch-users');
 * ```
 */
export function useLoadingContext() {
  const context = useContext(LoadingContext);
  
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within LoadingProvider');
  }
  
  return context;
}
