'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LayoutComponentProps {
  showHeader?: boolean;
  showFooter?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  showTitle?: boolean;
  onLayoutChange: (layoutOptions: {
    showHeader?: boolean;
    showFooter?: boolean;
    fullWidth?: boolean;
    backgroundColor?: string;
    showTitle?: boolean;
  }) => void;
}

export const LayoutComponent: React.FC<LayoutComponentProps> = ({
  showHeader = true,
  showFooter = true,
  fullWidth = false,
  backgroundColor = 'bg-background',
  showTitle = true,
  onLayoutChange,
}) => {
  const handleToggle = (field: keyof LayoutComponentProps, value: boolean) => {
    onLayoutChange({ [field]: value } as any);
  };

  const handleSelectChange = (field: keyof LayoutComponentProps, value: string) => {
    onLayoutChange({ [field]: value } as any);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Layout Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showHeader"
              checked={showHeader}
              onCheckedChange={(checked) => handleToggle('showHeader', !!checked)}
            />
            <Label htmlFor="showHeader">Show Header</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showFooter"
              checked={showFooter}
              onCheckedChange={(checked) => handleToggle('showFooter', !!checked)}
            />
            <Label htmlFor="showFooter">Show Footer</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fullWidth"
              checked={fullWidth}
              onCheckedChange={(checked) => handleToggle('fullWidth', !!checked)}
            />
            <Label htmlFor="fullWidth">Full Width Layout</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showTitle"
              checked={showTitle}
              onCheckedChange={(checked) => handleToggle('showTitle', !!checked)}
            />
            <Label htmlFor="showTitle">Show Page Title</Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <Select
            value={backgroundColor}
            onValueChange={(value) => handleSelectChange('backgroundColor', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bg-background">Default Background</SelectItem>
              <SelectItem value="bg-white">White</SelectItem>
              <SelectItem value="bg-gray-50">Light Gray</SelectItem>
              <SelectItem value="bg-gray-100">Gray</SelectItem>
              <SelectItem value="bg-blue-50">Light Blue</SelectItem>
              <SelectItem value="bg-green-50">Light Green</SelectItem>
              <SelectItem value="bg-yellow-50">Light Yellow</SelectItem>
              <SelectItem value="bg-red-50">Light Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default LayoutComponent;