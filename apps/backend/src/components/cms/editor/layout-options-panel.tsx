'use client';

import React from 'react';
import { LayoutComponent } from './layout-component';

interface LayoutOptions {
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  showTitle?: boolean;
}

interface LayoutOptionsPanelProps {
  layoutOptions: LayoutOptions;
  onLayoutOptionsChange: (layoutOptions: LayoutOptions) => void;
}

export const LayoutOptionsPanel: React.FC<LayoutOptionsPanelProps> = ({ 
  layoutOptions, 
  onLayoutOptionsChange 
}) => {
  return (
    <div className="p-4">
      <LayoutComponent
        showHeader={layoutOptions.showHeader}
        showFooter={layoutOptions.showFooter}
        fullWidth={layoutOptions.fullWidth}
        backgroundColor={layoutOptions.backgroundColor}
        showTitle={layoutOptions.showTitle}
        onLayoutChange={onLayoutOptionsChange}
      />
    </div>
  );
};

export default LayoutOptionsPanel;