/**
 * TemplatePreview Component
 *
 * Live preview of templates with resolved design tokens
 * Shows responsive views and token usage analytics
 */

"use client";

import { resolveColorScheme } from "@/lib/cms/token-resolver";
import React, { useState } from "react";
import type { PageTemplate } from "@/types/cms-template";
import { useDesignTokens } from "@/providers/DesignTokensProvider";
import { resolveBlocks } from "@/lib/cms/token-resolver";
import {
  getTokenUsageReport,
  validateTemplateTokens,
} from "@/lib/cms/token-validator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Palette,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  X,
} from "lucide-react";
import { toCssColor } from "./css-color";

interface TemplatePreviewProps {
  template: PageTemplate;
  onApply?: (template: PageTemplate) => void;
  onClose?: () => void;
}

/**
 * Responsive viewport toggle
 */
type Viewport = "desktop" | "tablet" | "mobile";

const viewportSizes: Record<
  Viewport,
  { width: string; label: string; icon: React.ReactNode }
> = {
  desktop: {
    width: "100%",
    label: "Desktop",
    icon: <Monitor className="h-4 w-4" />,
  },
  tablet: {
    width: "768px",
    label: "Tablet",
    icon: <Tablet className="h-4 w-4" />,
  },
  mobile: {
    width: "375px",
    label: "Mobile",
    icon: <Smartphone className="h-4 w-4" />,
  },
};

/**
 * Token Usage Stats Component
 */
function TokenUsageStats({ template }: { template: PageTemplate }) {
  const usageReport = getTokenUsageReport(template);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Code className="h-5 w-5" />
          Token Usage
        </CardTitle>
        <CardDescription>
          {usageReport.totalReferences} token references across{" "}
          {usageReport.uniqueTokens.length} unique tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token categories */}
        <div className="space-y-2">
          <div className="text-sm font-medium">By Category:</div>
          {Object.entries(usageReport.tokensByCategory).map(
            ([category, tokens]) => (
              <div key={category} className="flex items-center justify-between">
                <Badge variant="outline">{category}</Badge>
                <span className="text-sm text-muted-foreground">
                  {tokens.length} tokens
                </span>
              </div>
            ),
          )}
        </div>

        {/* Block usage */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Blocks Using Tokens:</div>
          <div className="space-y-1">
            {usageReport.blocksUsingTokens.map((block) => (
              <div
                key={block.blockId}
                className="text-xs text-muted-foreground"
              >
                <span className="font-mono">{block.blockType}</span>:{" "}
                {block.tokenCount} tokens
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Template Validation Display
 */
function TemplateValidation({ template }: { template: PageTemplate }) {
  const { tokens } = useDesignTokens();
  const validation = validateTemplateTokens(template, tokens);

  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle>Valid Template</AlertTitle>
        <AlertDescription>
          All design tokens are correctly configured and available in the
          current theme.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {/* Errors */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            Validation Errors ({validation.errors.length})
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validation.errors.slice(0, 3).map((error, index) => (
                <li key={index} className="text-sm">
                  {error.message}
                </li>
              ))}
              {validation.errors.length > 3 && (
                <li className="text-sm">
                  ...and {validation.errors.length - 3} more
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Warnings ({validation.warnings.length})</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validation.warnings.slice(0, 3).map((warning, index) => (
                <li key={index} className="text-sm">
                  {warning.message}
                </li>
              ))}
              {validation.warnings.length > 3 && (
                <li className="text-sm">
                  ...and {validation.warnings.length - 3} more
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Color Scheme Display
 */
function ColorSchemeDisplay({ template }: { template: PageTemplate }) {
  const { tokens } = useDesignTokens();

  const resolvedColors = resolveColorScheme(
    template.designSystem.colorScheme,
    tokens,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Scheme
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(resolvedColors).map(([key, value]) => {
            const cssColor = toCssColor(value);
            if (!cssColor) return null;

            return (
              <div key={key} className="space-y-2">
                <div className="text-sm font-medium capitalize">{key}</div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-10 w-10 rounded border border-border shadow-sm"
                    style={{ backgroundColor: cssColor }}
                  />
                  <div className="text-xs text-muted-foreground font-mono">
                    {value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main TemplatePreview Component
 */
export function TemplatePreview({
  template,
  onApply,
  onClose,
}: TemplatePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [activeTab, setActiveTab] = useState<"preview" | "info" | "tokens">(
    "preview",
  );
  const { tokens } = useDesignTokens();

  // Resolve all blocks with current tokens
  const resolvedBlocks = resolveBlocks(template.blocks, tokens);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-background">
        <div>
          <h2 className="text-xl font-bold">{template.name}</h2>
          <p className="text-sm text-muted-foreground">
            {template.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onApply?.(template)}>
            <Download className="h-4 w-4 mr-2" />
            Apply Template
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
          <TabsTrigger value="preview" className="rounded-none">
            Preview
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-none">
            Template Info
          </TabsTrigger>
          <TabsTrigger value="tokens" className="rounded-none">
            Design Tokens
          </TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="flex-1 p-4 space-y-4">
          {/* Viewport Toggle */}
          <div className="flex items-center gap-2">
            {(Object.keys(viewportSizes) as Viewport[]).map((size) => (
              <Button
                key={size}
                variant={viewport === size ? "default" : "outline"}
                size="sm"
                onClick={() => setViewport(size)}
              >
                {viewportSizes[size].icon}
                <span className="ml-2">{viewportSizes[size].label}</span>
              </Button>
            ))}
          </div>

          {/* Preview Frame */}
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            <div
              className="mx-auto transition-all"
              style={{ width: viewportSizes[viewport].width }}
            >
              <div className="bg-background min-h-[600px] p-8">
                {/* Render resolved blocks */}
                <div className="space-y-4">
                  {resolvedBlocks.map((block, index) => (
                    <div
                      key={block.id || index}
                      className="border rounded-lg p-6 bg-card"
                    >
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        {block.type}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {JSON.stringify(block.properties, null, 2).slice(
                          0,
                          200,
                        )}
                        ...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Template Info Tab */}
        <TabsContent
          value="info"
          className="flex-1 p-4 space-y-4 overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <Badge>{template.category}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Blocks</div>
                  <div className="font-medium">{template.blocks.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Usage Count
                  </div>
                  <div className="font-medium">{template.usageCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Version</div>
                  <div className="font-medium">v{template.version}</div>
                </div>
              </CardContent>
            </Card>

            {/* Contexts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supported Contexts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.designSystem.supportedContexts.map((context) => (
                    <Badge key={context} variant="secondary">
                      {context}
                    </Badge>
                  ))}
                </div>
                {template.designSystem.preferredMode && (
                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground">
                      Preferred Mode
                    </div>
                    <Badge variant="outline">
                      {template.designSystem.preferredMode}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Color Scheme */}
            <ColorSchemeDisplay template={template} />

            {/* Validation */}
            <div>
              <TemplateValidation template={template} />
            </div>
          </div>
        </TabsContent>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="flex-1 p-4 overflow-y-auto">
          <TokenUsageStats template={template} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Full-screen Template Preview Modal
 */
export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onApply,
}: {
  template: PageTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (template: PageTemplate) => void;
}) {
  if (!template || !open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <TemplatePreview
        template={template}
        onApply={onApply}
        onClose={() => onOpenChange(false)}
      />
    </div>
  );
}
