'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Download, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DebugPanelProps {
  pageData: any;
  components: any[];
  layoutOptions: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  pageData, 
  components, 
  layoutOptions 
}) => {
  const { toast } = useToast();
  const [debugView, setDebugView] = useState('page');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Debug information copied successfully",
    });
  };

  const exportToJson = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: `${filename} exported successfully`,
    });
  };

  const renderDebugView = () => {
    switch (debugView) {
      case 'page':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Page Data</h3>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => copyToClipboard(JSON.stringify(pageData, null, 2))}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <Textarea
              value={JSON.stringify(pageData, null, 2)}
              readOnly
              className="min-h-[200px] font-mono text-xs"
            />
            <Button 
              onClick={() => exportToJson(pageData, 'page-data.json')}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-1" />
              Export Page Data
            </Button>
          </div>
        );
      
      case 'components':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Components ({components.length})</h3>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => copyToClipboard(JSON.stringify(components, null, 2))}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <Textarea
              value={JSON.stringify(components, null, 2)}
              readOnly
              className="min-h-[200px] font-mono text-xs"
            />
            <Button 
              onClick={() => exportToJson(components, 'components.json')}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-1" />
              Export Components
            </Button>
          </div>
        );
      
      case 'layout':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Layout Options</h3>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => copyToClipboard(JSON.stringify(layoutOptions, null, 2))}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <Textarea
              value={JSON.stringify(layoutOptions, null, 2)}
              readOnly
              className="min-h-[200px] font-mono text-xs"
            />
            <Button 
              onClick={() => exportToJson(layoutOptions, 'layout-options.json')}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-1" />
              Export Layout Options
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bug className="h-5 w-5 mr-2" />
          Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <Alert className="mb-4">
          <AlertDescription>
            This panel provides debugging information for the CMS editor. Use it to inspect page data, components, and layout options.
          </AlertDescription>
        </Alert>
        
        <div className="flex space-x-2 mb-4">
          <Button
            variant={debugView === 'page' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDebugView('page')}
          >
            Page
          </Button>
          <Button
            variant={debugView === 'components' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDebugView('components')}
          >
            Components
          </Button>
          <Button
            variant={debugView === 'layout' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDebugView('layout')}
          >
            Layout
          </Button>
        </div>
        
        {renderDebugView()}
      </CardContent>
    </Card>
  );
};

export default DebugPanel;