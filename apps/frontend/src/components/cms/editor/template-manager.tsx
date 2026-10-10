'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, Download, Plus, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  components: any[];
  layoutOptions: any;
}

interface TemplateManagerProps {
  onSaveTemplate: (template: Omit<Template, 'id'>) => void;
  onLoadTemplate: (template: Template) => void;
  currentComponents: any[];
  currentLayoutOptions: any;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  onSaveTemplate,
  onLoadTemplate,
  currentComponents,
  currentLayoutOptions
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
  });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');

  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    const template: Omit<Template, 'id'> = {
      name: newTemplate.name,
      description: newTemplate.description,
      components: currentComponents,
      layoutOptions: currentLayoutOptions,
    };

    onSaveTemplate(template);
    
    // Add to local templates list
    const newTemplateWithId: Template = {
      ...template,
      id: `template-${Date.now()}`,
    };
    
    setTemplates(prev => [...prev, newTemplateWithId]);
    
    // Reset form
    setNewTemplate({ name: '', description: '' });
    setIsSaveDialogOpen(false);
    
    toast({
      title: "Template Saved",
      description: "Template has been saved successfully",
    });
  };

  const handleLoadTemplate = (template: Template) => {
    onLoadTemplate(template);
    toast({
      title: "Template Loaded",
      description: `${template.name} has been loaded`,
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Template Deleted",
      description: "Template has been deleted",
    });
  };

  const handleExportTemplates = () => {
    const jsonStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cms-templates.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Templates Exported",
      description: "All templates have been exported",
    });
  };

  const handleImportTemplates = () => {
    try {
      const importedTemplates: Template[] = JSON.parse(importData);
      if (Array.isArray(importedTemplates)) {
        setTemplates(importedTemplates);
        setImportData('');
        setIsImportDialogOpen(false);
        toast({
          title: "Templates Imported",
          description: `${importedTemplates.length} templates have been imported`,
        });
      } else {
        throw new Error('Invalid template format');
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Invalid template data format",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Template Manager</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Current as Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter template description"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTemplate}>
                      Save Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Templates
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Templates</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-data">Paste Template Data</Label>
                    <Textarea
                      id="import-data"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Paste JSON template data here"
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleImportTemplates}>
                      Import Templates
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={handleExportTemplates}>
              <Download className="h-4 w-4 mr-2" />
              Export All Templates
            </Button>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Saved Templates ({templates.length})</h3>
            
            {templates.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground/20 mb-2" />
                <p>No templates saved yet</p>
                <p className="text-sm mt-1">Save your current layout as a template to reuse it later</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div 
                    key={template.id} 
                    className="border rounded-lg p-4 flex justify-between items-start"
                  >
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.components.length} components
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleLoadTemplate(template)}
                      >
                        Load
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateManager;