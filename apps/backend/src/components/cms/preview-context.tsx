'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type PreviewMode = 'public' | 'preview' | 'edit';

interface PreviewContextType {
  mode: PreviewMode;
  setMode: (mode: PreviewMode) => void;
  isPreviewMode: boolean;
  isEditMode: boolean;
  isPublicMode: boolean;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({
  children,
  initialMode = 'public',
}: {
  children: ReactNode;
  initialMode?: PreviewMode;
}) {
  const [mode, setMode] = useState<PreviewMode>(initialMode);

  const value = {
    mode,
    setMode,
    isPreviewMode: mode === 'preview',
    isEditMode: mode === 'edit',
    isPublicMode: mode === 'public',
  };

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
}