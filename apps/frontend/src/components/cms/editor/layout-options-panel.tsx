'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LayoutOptions {
  showHeader: boolean;
  showFooter: boolean;
  fullWidth: boolean;
  backgroundColor: string;
  showTitle: boolean; // Add showTitle property
}

interface LayoutOptionsPanelProps {
  layoutOptions: LayoutOptions;
  onLayoutOptionsChange: (layoutOptions: LayoutOptions) => void;
}

export const LayoutOptionsPanel: React.FC<LayoutOptionsPanelProps> = ({ 
  layoutOptions, 
  onLayoutOptionsChange 
}) => {
  const handleToggle = (field: keyof LayoutOptions, value: boolean) => {
    console.log('Toggle changed:', field, value);
    const newLayoutOptions = {
      ...layoutOptions,
      [field]: value
    };
    console.log('New layout options:', newLayoutOptions);
    onLayoutOptionsChange(newLayoutOptions);
  };

  const handleBackgroundColorChange = (value: string) => {
    console.log('Background color changed:', value);
    const newLayoutOptions = {
      ...layoutOptions,
      backgroundColor: value
    };
    console.log('New layout options:', newLayoutOptions);
    onLayoutOptionsChange(newLayoutOptions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Layout Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-title">Show Title</Label>
          <Switch
            id="show-title"
            checked={layoutOptions.showTitle}
            onCheckedChange={(checked) => handleToggle('showTitle', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-header">Show Header</Label>
          <Switch
            id="show-header"
            checked={layoutOptions.showHeader}
            onCheckedChange={(checked) => handleToggle('showHeader', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-footer">Show Footer</Label>
          <Switch
            id="show-footer"
            checked={layoutOptions.showFooter}
            onCheckedChange={(checked) => handleToggle('showFooter', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="full-width">Full Width</Label>
          <Switch
            id="full-width"
            checked={layoutOptions.fullWidth}
            onCheckedChange={(checked) => handleToggle('fullWidth', checked)}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Background Color</Label>
          <Select 
            value={layoutOptions.backgroundColor} 
            onValueChange={handleBackgroundColorChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select background color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bg-background">Default</SelectItem>
              <SelectItem value="bg-white">White</SelectItem>
              <SelectItem value="bg-gray-50">Light Gray</SelectItem>
              <SelectItem value="bg-gray-100">Gray</SelectItem>
              <SelectItem value="bg-blue-50">Light Blue</SelectItem>
              <SelectItem value="bg-green-50">Light Green</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default LayoutOptionsPanel;