import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface ComponentConfigProps {
  componentType: string;
  initialProps: any;
  onPropsChange: (props: any) => void;
}

export const ComponentConfig: React.FC<ComponentConfigProps> = ({
  componentType,
  initialProps,
  onPropsChange,
}) => {
  const [props, setProps] = useState(initialProps);

  const updateProp = (key: string, value: any) => {
    const newProps = { ...props, [key]: value };
    setProps(newProps);
    onPropsChange(newProps);
  };

  const renderTextConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={props.content || ''}
          onChange={(e) => updateProp('content', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="variant">Variant</Label>
        <Select
          value={props.variant || 'body'}
          onValueChange={(value) => updateProp('variant', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="heading1">Heading 1</SelectItem>
            <SelectItem value="heading2">Heading 2</SelectItem>
            <SelectItem value="heading3">Heading 3</SelectItem>
            <SelectItem value="body">Body</SelectItem>
            <SelectItem value="caption">Caption</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="align">Alignment</Label>
        <Select
          value={props.align || 'left'}
          onValueChange={(value) => updateProp('align', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="justify">Justify</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="color">Color</Label>
        <Select
          value={props.color || 'primary'}
          onValueChange={(value) => updateProp('color', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="muted">Muted</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderButtonConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="text">Button Text</Label>
        <Input
          id="text"
          value={props.text || ''}
          onChange={(e) => updateProp('text', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="href">Link URL (optional)</Label>
        <Input
          id="href"
          value={props.href || ''}
          onChange={(e) => updateProp('href', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="variant">Variant</Label>
        <Select
          value={props.variant || 'default'}
          onValueChange={(value) => updateProp('variant', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="destructive">Destructive</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
            <SelectItem value="link">Link</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="size">Size</Label>
        <Select
          value={props.size || 'default'}
          onValueChange={(value) => updateProp('size', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="disabled"
          checked={props.disabled || false}
          onCheckedChange={(checked) => updateProp('disabled', checked)}
        />
        <Label htmlFor="disabled">Disabled</Label>
      </div>
    </div>
  );

  const renderContainerConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="padding">Padding</Label>
        <Select
          value={props.padding || 'md'}
          onValueChange={(value) => updateProp('padding', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="xs">Extra Small</SelectItem>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
            <SelectItem value="2xl">2X Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="background">Background</Label>
        <Select
          value={props.background || 'none'}
          onValueChange={(value) => updateProp('background', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="muted">Muted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="rounded">Rounded</Label>
        <Select
          value={props.rounded || 'none'}
          onValueChange={(value) => updateProp('rounded', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const getConfigPanel = () => {
    switch (componentType) {
      case 'text':
        return renderTextConfig();
      case 'button':
        return renderButtonConfig();
      case 'container':
        return renderContainerConfig();
      default:
        return <p>Configuration not available for this component type.</p>;
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Configure {componentType}</h3>
      {getConfigPanel()}
    </div>
  );
};

export default ComponentConfig;