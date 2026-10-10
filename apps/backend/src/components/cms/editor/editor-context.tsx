'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EditorContextType {
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
  updateComponentProps: (componentId: string, props: any) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
  onComponentUpdate: (id: string, props: any) => void;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ 
  children, 
  onComponentUpdate 
}) => {
  const [isEditMode, setIsEditMode] = useState(true);

  const updateComponentProps = (componentId: string, props: any) => {
    onComponentUpdate(componentId, props);
  };

  return (
    <EditorContext.Provider 
      value={{ 
        isEditMode, 
        setIsEditMode, 
        updateComponentProps 
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};