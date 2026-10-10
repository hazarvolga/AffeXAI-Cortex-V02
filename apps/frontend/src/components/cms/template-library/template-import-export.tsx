/**
 * TemplateImportExport Component
 *
 * Import and export templates in JSON format
 * Includes validation and error handling
 */

'use client';

import React, { useState, useRef } from 'react';
import type { PageTemplate, TemplateValidationResult } from '@/types/cms-template';
import { useDesignTokens } from '@/providers/DesignTokensProvider';
import { validateTemplateTokens, checkTemplateSafety } from '@/lib/cms/token-validator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, FileJson, AlertCircle, CheckCircle, Copy, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateImportExportProps {
  onImport?: (template: PageTemplate) => void;
  templates?: PageTemplate[];
}

/**
 * Export template to JSON file
 */
function exportTemplateToFile(template: PageTemplate, filename?: string) {
  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `template-${template.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export multiple templates as bundle
 */
function exportTemplateBundle(templates: PageTemplate[], filename?: string) {
  const bundle = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    templates: templates,
  };

  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `template-bundle-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate imported template JSON
 */
function parseTemplateJSON(json: string): { template?: PageTemplate; errors: string[] } {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(json);

    // Check if it's a template bundle
    if (parsed.templates && Array.isArray(parsed.templates)) {
      // For now, just take the first template
      if (parsed.templates.length === 0) {
        errors.push('Template bundle is empty');
        return { errors };
      }
      return parseTemplateJSON(JSON.stringify(parsed.templates[0]));
    }

    // Validate required fields
    if (!parsed.id) errors.push('Missing required field: id');
    if (!parsed.name) errors.push('Missing required field: name');
    if (!parsed.category) errors.push('Missing required field: category');
    if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
      errors.push('Missing or invalid field: blocks (must be an array)');
    }
    if (!parsed.designSystem) {
      errors.push('Missing required field: designSystem');
    } else {
      if (!parsed.designSystem.supportedContexts || !Array.isArray(parsed.designSystem.supportedContexts)) {
        errors.push('designSystem.supportedContexts must be an array');
      }
      if (!parsed.designSystem.colorScheme) {
        errors.push('designSystem.colorScheme is required');
      }
    }

    if (errors.length > 0) {
      return { errors };
    }

    // Ensure dates are Date objects
    const template: PageTemplate = {
      ...parsed,
      createdAt: new Date(parsed.createdAt || Date.now()),
      updatedAt: new Date(parsed.updatedAt || Date.now()),
    };

    return { template, errors: [] };
  } catch (error) {
    errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { errors };
  }
}

/**
 * Template Export Component
 */
function TemplateExport({ templates = [] }: { templates?: PageTemplate[] }) {
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleSelectTemplate = (templateId: string) => {
    const newSelection = new Set(selectedTemplates);
    if (newSelection.has(templateId)) {
      newSelection.delete(templateId);
    } else {
      newSelection.add(templateId);
    }
    setSelectedTemplates(newSelection);
  };

  const handleExportSelected = () => {
    const templatesToExport = templates.filter((t) => selectedTemplates.has(t.id));

    if (templatesToExport.length === 0) {
      toast({
        title: 'No templates selected',
        description: 'Please select at least one template to export',
        variant: 'destructive',
      });
      return;
    }

    if (templatesToExport.length === 1) {
      exportTemplateToFile(templatesToExport[0]);
      toast({
        title: 'Template exported',
        description: `${templatesToExport[0].name} exported successfully`,
      });
    } else {
      exportTemplateBundle(templatesToExport);
      toast({
        title: 'Templates exported',
        description: `${templatesToExport.length} templates exported as bundle`,
      });
    }
  };

  const handleExportSingle = (template: PageTemplate) => {
    exportTemplateToFile(template);
    toast({
      title: 'Template exported',
      description: `${template.name} exported successfully`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Export Templates</h3>
          <p className="text-sm text-muted-foreground">
            {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} selected
          </p>
        </div>
        <Button
          onClick={handleExportSelected}
          disabled={selectedTemplates.size === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Selected
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-colors ${
              selectedTemplates.has(template.id) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <CardHeader className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {template.blocks.length} blocks · {template.category}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    v{template.version}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportSingle(template);
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Template Import Component
 */
function TemplateImport({ onImport }: { onImport?: (template: PageTemplate) => void }) {
  const [importMethod, setImportMethod] = useState<'file' | 'json'>('file');
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    template?: PageTemplate;
    parseErrors: string[];
    tokenValidation?: TemplateValidationResult;
    safety?: ReturnType<typeof checkTemplateSafety>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tokens } = useDesignTokens();
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      validateAndPreview(content);
    };
    reader.readAsText(file);
  };

  const validateAndPreview = (json: string) => {
    const { template, errors: parseErrors } = parseTemplateJSON(json);

    if (!template) {
      setValidationResult({ parseErrors });
      return;
    }

    // Validate tokens
    const tokenValidation = validateTemplateTokens(template, tokens);
    const safety = checkTemplateSafety(template, tokens);

    setValidationResult({
      template,
      parseErrors,
      tokenValidation,
      safety,
    });
  };

  const handleImport = () => {
    if (!validationResult?.template) {
      toast({
        title: 'Import failed',
        description: 'No valid template to import',
        variant: 'destructive',
      });
      return;
    }

    if (!validationResult.safety?.isSafe) {
      toast({
        title: 'Import warning',
        description: 'Template has missing tokens but will be imported',
        variant: 'destructive',
      });
    }

    onImport?.(validationResult.template);
    toast({
      title: 'Template imported',
      description: `${validationResult.template.name} imported successfully`,
    });

    // Reset
    setJsonInput('');
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyToClipboard = () => {
    if (validationResult?.template) {
      const json = JSON.stringify(validationResult.template, null, 2);
      navigator.clipboard.writeText(json);
      toast({
        title: 'Copied',
        description: 'Template JSON copied to clipboard',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as 'file' | 'json')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file">
            <FileJson className="h-4 w-4 mr-2" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="json">
            <FileText className="h-4 w-4 mr-2" />
            Paste JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Upload Template JSON</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click to browse or drag and drop
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Paste template JSON here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
            <Button onClick={() => validateAndPreview(jsonInput)} className="w-full">
              Validate & Preview
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {validationResult.parseErrors.length === 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Validation Results
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Validation Errors
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Parse Errors */}
            {validationResult.parseErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Parse Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.parseErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Template Info */}
            {validationResult.template && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-medium">{validationResult.template.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Category</div>
                    <Badge>{validationResult.template.category}</Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Blocks</div>
                    <div className="font-medium">{validationResult.template.blocks.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Contexts</div>
                    <div className="flex gap-1">
                      {validationResult.template.designSystem.supportedContexts.map((ctx) => (
                        <Badge key={ctx} variant="outline" className="text-xs">{ctx}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Token Validation */}
                {validationResult.tokenValidation && !validationResult.tokenValidation.isValid && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Token Validation Issues</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult.tokenValidation.errors.slice(0, 3).map((error, index) => (
                          <li key={index} className="text-sm">{error.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Safety Check */}
                {validationResult.safety && !validationResult.safety.isSafe && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Missing Tokens</AlertTitle>
                    <AlertDescription>
                      <p className="text-sm mb-2">
                        {validationResult.safety.missingTokens.length} token(s) not found in current theme
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult.safety.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleImport} className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Template
                  </Button>
                  <Button variant="outline" onClick={handleCopyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy JSON
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Main TemplateImportExport Component
 */
export function TemplateImportExport({ onImport, templates = [] }: TemplateImportExportProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Import & Export Templates</h2>
        <p className="text-muted-foreground">
          Share templates as JSON files
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'import' | 'export')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <TemplateImport onImport={onImport} />
        </TabsContent>

        <TabsContent value="export">
          <TemplateExport templates={templates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Template Import/Export Dialog Modal
 */
export function TemplateImportExportModal({
  open,
  onOpenChange,
  onImport,
  templates = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: (template: PageTemplate) => void;
  templates?: PageTemplate[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import & Export Templates</DialogTitle>
          <DialogDescription>
            Share templates across projects or with team members
          </DialogDescription>
        </DialogHeader>
        <TemplateImportExport onImport={onImport} templates={templates} />
      </DialogContent>
    </Dialog>
  );
}
