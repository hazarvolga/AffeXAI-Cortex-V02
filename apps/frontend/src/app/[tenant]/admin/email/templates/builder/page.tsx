'use client';

import { useState } from 'react';
import { EmailBuilderCanvas } from '@/components/email-builder/email-builder-canvas';
import { BlockLibrarySidebar } from '@/components/email-builder/block-library-sidebar';
import { PropertiesPanel } from '@/components/email-builder/properties-panel';
import { EmailPreview } from '@/components/email-builder/email-preview';
import { EmailTemplatesService } from '@/services/email-templates.service';
import { Button } from '@/components/ui/button';
import { Save, Eye, Code, Smartphone, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Block {
  id: string;
  type: string;
  properties: Record<string, any>;
  styles: Record<string, any>;
}

interface Column {
  id: string;
  width: string;
  blocks: Block[];
}

interface Row {
  id: string;
  type: string;
  columns: Column[];
  settings: Record<string, any>;
}

interface EmailStructure {
  rows: Row[];
  settings: {
    backgroundColor?: string;
    contentWidth?: string;
    fonts?: string[];
  };
}

export default function EmailBuilderPage() {
  const { toast } = useToast();
  const [emailStructure, setEmailStructure] = useState<EmailStructure>({
    rows: [],
    settings: {
      backgroundColor: '#f5f5f5',
      contentWidth: '600px',
      fonts: [],
    },
  });

  const [selectedBlock, setSelectedBlock] = useState(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);

      const name = prompt('Template adı:', 'Yeni Email Şablonu');
      if (!name) return;

      const description = prompt('Açıklama (isteğe bağlı):');

      const result = await EmailTemplatesService.createTemplate({
        name,
        description: description || undefined,
        structure: emailStructure,
        type: 'CUSTOM',
        isActive: true,
      });

      toast({
        title: 'Başarılı!',
        description: `Template "${result.name}" başarıyla kaydedildi.`,
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Template kaydedilemedi.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header Toolbar */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Email Builder</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button variant="outline" size="sm">
            <Code className="h-4 w-4 mr-2" />
            View Code
          </Button>
          <Button size="sm" onClick={handleSaveTemplate} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Block Library Sidebar */}
        <BlockLibrarySidebar
          onBlockSelect={(block) => {
            // Add block to canvas
            console.log('Block selected:', block);
          }}
        />

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-muted/20">
          <EmailBuilderCanvas
            structure={emailStructure}
            onStructureChange={setEmailStructure}
            selectedBlock={selectedBlock}
            onBlockSelect={setSelectedBlock}
            previewMode={previewMode}
          />
        </div>

        {/* Properties Panel */}
        {selectedBlock && (
          <PropertiesPanel
            block={selectedBlock}
            onBlockUpdate={(updatedBlock) => {
              // Update block properties
              console.log('Block updated:', updatedBlock);
            }}
          />
        )}

        {/* Live Preview */}
        {showPreview && (
          <EmailPreview
            structure={emailStructure}
            previewMode={previewMode}
          />
        )}
      </div>
    </div>
  );
}
