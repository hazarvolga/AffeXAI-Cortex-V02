/**
 * Design Tokens Theme Provider
 * Centralized theme management with React Context
 * SSR-safe with hydration mismatch prevention
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { DesignTokens, ThemeContext as ThemeContextType, ThemeMode } from '@/types/design-tokens';
import { resolveAllTokens, exportToCSS } from '@/lib/design-tokens/resolver';
import {
  adminLightTokensProduction,
  adminDarkTokensProduction,
  publicLightTokensProduction,
  publicDarkTokensProduction,
  portalLightTokensProduction,
  portalDarkTokensProduction,
} from '@/lib/design-tokens/production-tokens';

// ============================================================================
// TYPES
// ============================================================================

interface ThemeContextValue {
  context: ThemeContextType;
  mode: ThemeMode;
  tokens: DesignTokens;
  setContext: (context: ThemeContextType) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  updateTokens: (tokens: DesignTokens) => void;
  resetTokens: () => void;
  injectCSS: () => void;
  getCSSVariables: () => string;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultContext?: ThemeContextType;
  defaultMode?: ThemeMode;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useDesignTokens() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useDesignTokens must be used within DesignTokensProvider');
  }
  return context;
}

// ============================================================================
// STORAGE UTILITIES (SSR-SAFE)
// ============================================================================

const STORAGE_KEYS = {
  CONTEXT: 'theme-context',
  MODE: 'theme-mode',
  CUSTOM_TOKENS: 'custom-tokens',
} as const;

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredValue(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to store value:', error);
  }
}

// ============================================================================
// TOKEN UTILITIES
// ============================================================================

function getDefaultTokens(context: ThemeContextType, mode: ThemeMode): DesignTokens {
  if (context === 'admin') {
    return mode === 'dark' ? adminDarkTokensProduction : adminLightTokensProduction;
  } else if (context === 'portal') {
    return mode === 'dark' ? portalDarkTokensProduction : portalLightTokensProduction;
  } else {
    return mode === 'dark' ? publicDarkTokensProduction : publicLightTokensProduction;
  }
}

function mergeCustomTokens(defaults: DesignTokens, custom: Partial<DesignTokens>): DesignTokens {
  const merged = JSON.parse(JSON.stringify(defaults)); // Deep clone

  // Deep merge custom tokens
  function deepMerge(target: any, source: any) {
    for (const key in source) {
      if (source[key] !== undefined && source[key] !== null) {
        if (typeof source[key] === 'object' && !source[key].$value && !Array.isArray(source[key])) {
          // If nested object (not a token), merge recursively
          target[key] = target[key] || {};
          deepMerge(target[key], source[key]);
        } else {
          // If token with $value or primitive, replace
          target[key] = source[key];
        }
      }
    }
  }

  deepMerge(merged, custom);
  return merged;
}

// ============================================================================
// CSS INJECTION
// ============================================================================

function injectCSSVariables(tokens: DesignTokens, context: ThemeContextType, mode: ThemeMode): void {
  if (typeof window === 'undefined') return;

  try {
    console.log('💉 injectCSSVariables called:', { context, mode });
    
    const resolved = resolveAllTokens(tokens);
    console.log('📋 Resolved tokens:', resolved);
    
    // Higher specificity than globals.css: repeat selector to increase specificity
    // .dark .theme-admin.theme-admin (0-3-0) > .dark .theme-admin (0-2-0)
    const baseSelector = `.theme-${context}`;
    const selector = mode === 'dark' 
      ? `.dark ${baseSelector}${baseSelector}`  // Extra specificity for dark mode
      : `${baseSelector}${baseSelector}`;        // Extra specificity for light mode
    
    const css = exportToCSS(resolved, { selector });
    console.log('📝 Generated CSS selector:', selector);
    console.log('📝 Generated CSS (first 500 chars):', css.substring(0, 500));

    // Remove existing style element
    const existingStyle = document.getElementById(`theme-${context}-${mode}`);
    if (existingStyle) {
      console.log('🗑️ Removing existing style tag');
      existingStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = `theme-${context}-${mode}`;
    style.textContent = css;
    
    // Append to end of head to ensure it loads after globals.css
    document.head.appendChild(style);

    console.log(`✅ Injected ${context} (${mode}) theme CSS variables - Style tag ID: theme-${context}-${mode}`);
  } catch (error) {
    console.error('Failed to inject CSS variables:', error);
  }
}

// ============================================================================
// PROVIDER COMPONENT (SSR-SAFE)
// ============================================================================

export function DesignTokensProvider({
  children,
  defaultContext = 'public',
  defaultMode = 'light',
}: ThemeProviderProps) {
  // State - Initialize with defaults to prevent hydration mismatch
  const [context, setContextState] = useState<ThemeContextType>(defaultContext);
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [customTokens, setCustomTokens] = useState<Partial<DesignTokens>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage AFTER client-side hydration
  useEffect(() => {
    const storedContext = getStoredValue(STORAGE_KEYS.CONTEXT, defaultContext);
    const storedMode = getStoredValue(STORAGE_KEYS.MODE, defaultMode);
    const storedCustomTokens = getStoredValue(STORAGE_KEYS.CUSTOM_TOKENS, {});
    
    console.log('💾 Loaded from localStorage:', { storedContext, storedMode, storedCustomTokens });
    
    setContextState(storedContext);
    setModeState(storedMode);
    setCustomTokens(storedCustomTokens);
    setIsHydrated(true);
  }, []); // Run once on mount

  // Computed tokens
  const defaultThemeTokens = getDefaultTokens(context, mode);
  const tokens = mergeCustomTokens(defaultThemeTokens, customTokens);
  
  console.log('🔧 Computed tokens:', { 
    context, 
    mode, 
    hasCustomTokens: Object.keys(customTokens).length > 0,
    customTokensKeys: Object.keys(customTokens)
  });

  // Context setter
  const setContext = useCallback((newContext: ThemeContextType) => {
    setContextState(newContext);
    setStoredValue(STORAGE_KEYS.CONTEXT, newContext);
  }, []);

  // Mode setter
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    setStoredValue(STORAGE_KEYS.MODE, newMode);
  }, []);

  // Mode toggler
  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  // Update tokens
  const updateTokens = useCallback((newTokens: DesignTokens) => {
    console.log('🔄 updateTokens called with:', newTokens);
    setCustomTokens(newTokens);
    setStoredValue(STORAGE_KEYS.CUSTOM_TOKENS, newTokens);
  }, []);

  // Reset to defaults
  const resetTokens = useCallback(() => {
    console.log('🔄 resetTokens called - clearing customTokens');
    setCustomTokens({});
    setStoredValue(STORAGE_KEYS.CUSTOM_TOKENS, {});
  }, []);

  // Inject CSS
  const injectCSS = useCallback(() => {
    injectCSSVariables(tokens, context, mode);
  }, [tokens, context, mode]);

  // Get CSS as string
  const getCSSVariables = useCallback(() => {
    const resolved = resolveAllTokens(tokens);
    return exportToCSS(resolved, { selector: `.theme-${context}` });
  }, [tokens, context]);

  // Update dark mode class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [mode]);

  // Auto-inject CSS when tokens change (ONLY AFTER HYDRATION)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      console.log('🎨 Auto-injecting CSS:', { context, mode, isHydrated });
      console.log('📦 Tokens to inject:', tokens);
      injectCSSVariables(tokens, context, mode);
    }
  }, [tokens, context, mode, isHydrated]);

  // Context value
  const value: ThemeContextValue = {
    context,
    mode,
    tokens,
    setContext,
    setMode,
    toggleMode,
    updateTokens,
    resetTokens,
    injectCSS,
    getCSSVariables,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ============================================================================
// EXPORT
// ============================================================================

export { ThemeContext };
export type { ThemeContextValue, ThemeProviderProps };
