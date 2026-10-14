"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api/api-fetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDesignTokens } from "@/providers/DesignTokensProvider";
import {
  exportToJSON,
  importFromJSON,
  exportToCSS,
  exportToSCSS,
} from "@/lib/design-tokens/resolver";
import type { DesignTokens, TokenExportFormat } from "@/types/design-tokens";
import {
  adminLightTokensProduction,
  adminDarkTokensProduction,
} from "@/lib/design-tokens/production-tokens";
import {
  Palette,
  Paintbrush,
  Layers,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  Sun,
  Moon,
  Download,
  Upload,
  FileJson,
  FileCode,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { cn } from "@/lib/utils";
import { useAsyncEffect } from "@/hooks/use-async-effect";

// Color utility functions
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

function hslToHex(hsl: string): string {
  // Parse HSL string "222 47% 11%"
  const parts = hsl.trim().split(/\s+/);
  const h = parseInt(parts[0]) / 360;
  const s = parseInt(parts[1]) / 100;
  const l = parseInt(parts[2]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return toHex(r) + toHex(g) + toHex(b);
}

function isLightColor(color: string): boolean {
  // Parse HSL or convert from hex
  let l = 50; // default

  if (color.includes("%")) {
    const parts = color.trim().split(/\s+/);
    l = parseInt(parts[2] || "50");
  }

  return l > 50;
}

const DesignSettingsLayoutWrapper = ({
  children,
  tokens,
  mode,
}: {
  children: React.ReactNode;
  tokens: DesignTokens;
  mode: "light" | "dark";
}) => {
  return (
    <BccEditorialWrapper
      theme="tenant-admin"
      headerTitle="Design Resonance"
      headerSubtitle="Calibrating systemic visual tokens and core brand vectors."
      headerBadge="Editorial Console"
      telemetryData={[
        {
          label: "Token Groups",
          value: Object.keys(tokens).length.toString(),
          color: "#ff8c00",
        },
        { label: "Sync Status", value: "Live", color: "#ff8c00" },
        { label: "Current Mode", value: mode.toUpperCase(), color: "#ff8c00" },
      ]}
    >
      <div className="relative z-10 w-full min-h-screen flex flex-col pt-0">
        {children}
      </div>
    </BccEditorialWrapper>
  );
};

export default function DesignManagementPage() {
  const {
    context,
    mode,
    tokens,
    setContext,
    setMode,
    updateTokens,
    resetTokens,
    getCSSVariables,
  } = useDesignTokens();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("tokens");
  const [hasChanges, setHasChanges] = useState(false);
  const [localTokens, setLocalTokens] = useState<DesignTokens>(tokens);
  const [livePreview, setLivePreview] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch - wait for client-side mount
  useAsyncEffect(() => {
    setMounted(true);
  }, []);

  // Sync local tokens with provider
  useAsyncEffect(() => {
    setLocalTokens(tokens);
  }, [tokens]);

  // Track changes
  useAsyncEffect(() => {
    setHasChanges(JSON.stringify(localTokens) !== JSON.stringify(tokens));
  }, [localTokens, tokens]);

  // Live preview - update provider immediately when livePreview is enabled
  useEffect(() => {
    if (livePreview && hasChanges) {
      console.log("🔄 Live preview: updating tokens");
      updateTokens(localTokens);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTokens, livePreview, hasChanges]);

  // Update token value
  const updateToken = (path: string, value: any) => {
    console.log("🎨 updateToken called:", { path, value });

    const parts = path.split(".");
    // Deep clone to avoid mutation issues
    const updated = JSON.parse(JSON.stringify(localTokens));
    let current: any = updated;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }

    const lastKey = parts[parts.length - 1];

    // Preserve $type and $description, update $value
    current[lastKey] = {
      ...current[lastKey],
      $value: value,
    };

    console.log("🎨 Updated token at path:", path, "→", current[lastKey]);
    setLocalTokens(updated);
  };

  // Get token value by path
  const getTokenValue = (path: string): any => {
    const parts = path.split(".");
    let current: any = localTokens;

    for (const part of parts) {
      if (!current?.[part]) return "";
      current = current[part];
    }

    return current?.$value || "";
  };

  // Save changes
  const handleSave = async () => {
    try {
      updateTokens(localTokens);

      // TODO: Save to database via API
      const response = await apiFetch("/api/design-tokens", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          mode,
          tokens: localTokens,
        }),
      });

      if (!response.ok) throw new Error("Failed to save tokens");

      toast({
        title: "Saved Successfully",
        description: "Design tokens have been saved.",
        variant: "default",
      });

      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description:
          error instanceof Error ? error.message : "Failed to save tokens",
        variant: "destructive",
      });
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    setShowResetDialog(false);

    try {
      resetTokens();
      setLocalTokens(tokens);

      toast({
        title: "Reset Complete",
        description: "All tokens have been reset to default values.",
        variant: "default",
      });

      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset tokens",
        variant: "destructive",
      });
    }
  };

  // Export to W3C JSON
  const handleExportJSON = () => {
    const exportData = exportToJSON(localTokens, {
      name: `affexai-cortex-${context}-${mode}`,
      description: `AffeXAI Cortex Design Tokens - ${context} theme (${mode} mode)`,
      author: "AffeXAI Cortex Design System",
      exportedAt: new Date().toISOString(),
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affexai-cortex-tokens-${context}-${mode}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Tokens exported as W3C JSON format",
    });
  };

  // Export to CSS
  const handleExportCSS = () => {
    const css = getCSSVariables();
    const blob = new Blob([css], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affexai-cortex-tokens-${context}-${mode}.css`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Tokens exported as CSS custom properties",
    });
  };

  // Export to SCSS
  const handleExportSCSS = () => {
    const scss = exportToSCSS(localTokens, { prefix: "aluplan" });
    const blob = new Blob([scss], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affexai-cortex-tokens-${context}-${mode}.scss`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Tokens exported as SCSS variables",
    });
  };

  // Import from JSON
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as TokenExportFormat;

      const imported = importFromJSON(data);
      setLocalTokens(imported);

      toast({
        title: "Imported",
        description: `Imported ${Object.keys(imported).length} token groups`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Invalid token format",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <DesignSettingsLayoutWrapper tokens={localTokens} mode={mode}>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="border-l-2 border-[#ff8c00] pl-6 py-2">
          <h1 className="text-4xl font-bold tracking-tighter uppercase font-mono italic">
            Design System
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em] mt-2">
            Manage design tokens and theme configuration
          </p>
        </div>

        {/* Context Selector - Compact Buttons */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            onClick={() => setContext("admin")}
            className={`py-3 px-4 rounded-lg border-2 transition-all ${
              context === "admin"
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border hover:border-primary/50 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${context === "admin" ? "bg-primary" : "bg-muted-foreground"}`}
              />
              <span className="font-semibold">Admin Panel</span>
              {context === "admin" && (
                <span className="text-xs text-primary ml-1">✓</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Yönetim paneli renk şeması
            </p>
          </button>

          <button
            onClick={() => setContext("public")}
            className={`py-3 px-4 rounded-lg border-2 transition-all ${
              context === "public"
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border hover:border-primary/50 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${context === "public" ? "bg-primary" : "bg-muted-foreground"}`}
              />
              <span className="font-semibold">Public Website</span>
              {context === "public" && (
                <span className="text-xs text-primary ml-1">✓</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Ana web sitesi renk şeması
            </p>
          </button>

          <button
            onClick={() => setContext("portal")}
            className={`py-3 px-4 rounded-lg border-2 transition-all ${
              context === "portal"
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border hover:border-primary/50 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${context === "portal" ? "bg-primary" : "bg-muted-foreground"}`}
              />
              <span className="font-semibold">User Portal</span>
              {context === "portal" && (
                <span className="text-xs text-primary ml-1">✓</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Kullanıcı portal renk şeması
            </p>
          </button>
        </div>
      </div>

      {/* Theme Mode & Controls */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          {/* Theme Mode Toggle */}
          {mounted && (
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as "light" | "dark")}
              className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-lg p-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="light"
                  id="mode-light"
                  className="sr-only"
                />
                <Label
                  htmlFor="mode-light"
                  className={`cursor-pointer px-3 py-1.5 rounded-md transition-colors ${
                    mode === "light"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Sun className="h-4 w-4" />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="dark"
                  id="mode-dark"
                  className="sr-only"
                />
                <Label
                  htmlFor="mode-dark"
                  className={`cursor-pointer px-3 py-1.5 rounded-md transition-colors ${
                    mode === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Moon className="h-4 w-4" />
                </Label>
              </div>
            </RadioGroup>
          )}

          {/* Context Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Context:</Label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value as any)}
              className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium border-0 cursor-pointer hover:bg-muted/80"
            >
              <option value="admin">ADMIN</option>
              <option value="public">PUBLIC</option>
              <option value="portal">PORTAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={!hasChanges || livePreview}>
            <Save className="mr-2 h-4 w-4" />
            {livePreview ? "Auto-Saved" : "Save Changes"}
          </Button>
          <Button onClick={() => setShowResetDialog(true)} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <div className="flex items-center gap-2 ml-4 px-3 py-2 border rounded-md">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Label
              htmlFor="live-preview-toggle"
              className="text-sm cursor-pointer"
            >
              Live Preview
            </Label>
            <input
              id="live-preview-toggle"
              type="checkbox"
              checked={livePreview}
              onChange={(e) => setLivePreview(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleImport} variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={handleExportJSON} variant="outline" size="sm">
            <FileJson className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button onClick={handleExportCSS} variant="outline" size="sm">
            <FileCode className="mr-2 h-4 w-4" />
            Export CSS
          </Button>
          <Button onClick={handleExportSCSS} variant="outline" size="sm">
            <FileCode className="mr-2 h-4 w-4" />
            Export SCSS
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Status Indicator */}
      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-[#ff8c00]/10 border border-[#ff8c00]/20 rounded-lg animate-pulse">
          <AlertCircle className="h-4 w-4 text-[#ff8c00]" />
          <span className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold">
            UNCOMMITTED CHANGES DETECTED
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger
            value="tokens"
            className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8 font-bold"
          >
            <Palette className="mr-2 h-3 w-3" />
            Tokens
          </TabsTrigger>
          <TabsTrigger
            value="colors"
            className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8 font-bold"
          >
            <Paintbrush className="mr-2 h-3 w-3" />
            Colors
          </TabsTrigger>
          <TabsTrigger
            value="typography"
            className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8 font-bold"
          >
            <Layers className="mr-2 h-3 w-3" />
            Typography
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="data-[state=active]:bg-[#ff8c00] data-[state=active]:text-black text-[10px] uppercase tracking-widest px-8 font-bold"
          >
            <Eye className="mr-2 h-3 w-3" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Tokens Tab */}
        <TabsContent
          value="tokens"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <Card className="bcc-glass border-none bg-white/[0.02]">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#ff8c00]"></div>
                <div>
                  <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">
                    Design Tokens Overview
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">
                    W3C Design Tokens format - Semantic design system variables.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-6 bg-white/[0.03] border border-white/5 rounded-sm space-y-1">
                  <div className="text-2xl font-bold font-mono tracking-tighter text-[#ff8c00]">
                    {Object.keys(localTokens).length}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-white/40">
                    Token Groups
                  </div>
                </div>
                <div className="p-6 bg-white/[0.03] border border-white/5 rounded-sm space-y-1">
                  <div className="text-2xl font-bold font-mono tracking-tighter text-[#ff8c00]">
                    {localTokens.color
                      ? Object.keys(localTokens.color).length
                      : 0}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-white/40">
                    Colors
                  </div>
                </div>
                <div className="p-6 bg-white/[0.03] border border-white/5 rounded-sm space-y-1">
                  <div className="text-2xl font-bold font-mono tracking-tighter text-[#ff8c00]">
                    {localTokens.spacing
                      ? Object.keys(localTokens.spacing).length
                      : 0}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-white/40">
                    Spacing
                  </div>
                </div>
                <div className="p-6 bg-white/[0.03] border border-white/5 rounded-sm space-y-1">
                  <div className="text-2xl font-bold font-mono tracking-tighter text-[#ff8c00]">
                    {mode.toUpperCase()}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-white/40">
                    Active Vector
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent
          value="colors"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <Card className="bcc-glass border-none bg-white/[0.02]">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-[#ff8c00]"></div>
                  <div>
                    <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">
                      Color Tokens
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">
                      Semantic color system based on W3C Design Tokens.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
                  <Label
                    htmlFor="live-preview"
                    className="text-[9px] uppercase tracking-widest text-[#ff8c00] font-bold cursor-pointer"
                  >
                    Live Preview
                  </Label>
                  <input
                    id="live-preview"
                    type="checkbox"
                    checked={livePreview}
                    onChange={(e) => setLivePreview(e.target.checked)}
                    className="w-3 h-3 cursor-pointer accent-[#ff8c00]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-2 gap-6">
                {localTokens.color &&
                  (() => {
                    // Flatten nested color tokens for rendering
                    const flatColors: Array<{
                      path: string;
                      key: string;
                      token: any;
                    }> = [];

                    Object.entries(localTokens.color).forEach(
                      ([key, value]: [string, any]) => {
                        if (value.$value) {
                          // Direct color token (e.g., border, input, ring)
                          flatColors.push({
                            path: `color.${key}`,
                            key,
                            token: value,
                          });
                        } else if (
                          typeof value === "object" &&
                          !Array.isArray(value)
                        ) {
                          // Nested color token (e.g., primary.background, success.foreground)
                          Object.entries(value).forEach(
                            ([subKey, subValue]: [string, any]) => {
                              if (
                                subValue &&
                                typeof subValue === "object" &&
                                subValue.$value
                              ) {
                                flatColors.push({
                                  path: `color.${key}.${subKey}`,
                                  key: `${key}.${subKey}`,
                                  token: subValue,
                                });
                              }
                            },
                          );
                        }
                      },
                    );

                    return flatColors.map(({ path, key, token }) => {
                      const isHSL =
                        typeof token.$value === "string" &&
                        (token.$value.includes("hsl") ||
                          (!token.$value.startsWith("#") &&
                            !token.$value.startsWith("rgb")));
                      const colorValue = isHSL
                        ? token.$value.replace("hsl(", "").replace(")", "")
                        : token.$value;

                      return (
                        <div
                          key={path}
                          className="space-y-4 p-5 bg-white/[0.03] border border-white/5 rounded-sm hover:border-[#ff8c00]/20 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase tracking-widest text-white/60 font-bold group-hover:text-white transition-colors">
                              {key}
                            </Label>
                            {livePreview && (
                              <span className="text-[8px] uppercase tracking-[0.2em] text-[#ff8c00] font-bold">
                                ● Active Signal
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Color Picker */}
                            <div className="relative group/picker">
                              <input
                                type="color"
                                value={
                                  isHSL
                                    ? `#${hslToHex(colorValue)}`
                                    : colorValue
                                }
                                onChange={(e) => {
                                  const hex = e.target.value;
                                  const hsl = hexToHSL(hex);
                                  updateToken(path, hsl);
                                }}
                                className="w-12 h-12 rounded-sm border border-white/10 cursor-pointer bg-transparent"
                              />
                              <div className="absolute inset-0 w-12 h-12 rounded-sm border border-[#ff8c00]/40 pointer-events-none opacity-0 group-hover/picker:opacity-100 transition-opacity" />
                            </div>

                            {/* Value Input */}
                            <div className="flex-1 space-y-2">
                              <Input
                                value={colorValue}
                                onChange={(e) =>
                                  updateToken(path, e.target.value)
                                }
                                className="font-mono text-xs bg-black/40 border-white/10"
                                placeholder="0 0% 0%"
                              />
                              <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/30">
                                <span className="px-1.5 py-0.5 bg-white/5 rounded-sm border border-white/5 text-[#ff8c00]/60">
                                  {isHSL ? "HSL" : "HEX"}
                                </span>
                                {token.$description && (
                                  <span className="font-mono italic">
                                    • {token.$description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="flex gap-2">
                            <div
                              className="flex-1 h-8 rounded border flex items-center justify-center text-xs"
                              style={{
                                backgroundColor: isHSL
                                  ? `hsl(${colorValue})`
                                  : colorValue,
                                color: isLightColor(colorValue)
                                  ? "#000"
                                  : "#fff",
                              }}
                            >
                              Preview
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Card */}
          <Card className="bcc-glass border-none bg-white/[0.02]">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#ff8c00]"></div>
                <div>
                  <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">
                    Live Color Preview
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">
                    See all color tokens in action across the semantic stack.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-2 gap-4">
                {/* Background */}
                <div className="p-4 bg-background text-foreground border rounded">
                  <p className="font-semibold">Background</p>
                  <p className="text-sm text-muted-foreground">
                    bg-background + text-foreground
                  </p>
                </div>

                {/* Card */}
                <div className="p-4 bg-card text-card-foreground border rounded">
                  <p className="font-semibold">Card</p>
                  <p className="text-sm">bg-card + text-card-foreground</p>
                </div>

                {/* Primary */}
                <div className="p-4 bg-primary text-primary-foreground rounded">
                  <p className="font-semibold">Primary</p>
                  <p className="text-sm">
                    bg-primary + text-primary-foreground
                  </p>
                </div>

                {/* Secondary */}
                <div className="p-4 bg-secondary text-secondary-foreground rounded">
                  <p className="font-semibold">Secondary</p>
                  <p className="text-sm">
                    bg-secondary + text-secondary-foreground
                  </p>
                </div>

                {/* Muted */}
                <div className="p-4 bg-muted text-muted-foreground rounded">
                  <p className="font-semibold">Muted</p>
                  <p className="text-sm">bg-muted + text-muted-foreground</p>
                </div>

                {/* Accent */}
                <div className="p-4 bg-accent text-accent-foreground rounded">
                  <p className="font-semibold">Accent</p>
                  <p className="text-sm">bg-accent + text-accent-foreground</p>
                </div>

                {/* Destructive */}
                <div className="p-4 bg-destructive text-destructive-foreground rounded">
                  <p className="font-semibold">Destructive</p>
                  <p className="text-sm">
                    bg-destructive + text-destructive-foreground
                  </p>
                </div>

                {/* Success */}
                <div className="p-4 bg-success text-success-foreground rounded">
                  <p className="font-semibold">Success</p>
                  <p className="text-sm">
                    bg-success + text-success-foreground
                  </p>
                </div>

                {/* Warning */}
                <div className="p-4 bg-warning text-warning-foreground rounded">
                  <p className="font-semibold">Warning</p>
                  <p className="text-sm">
                    bg-warning + text-warning-foreground
                  </p>
                </div>

                {/* Info */}
                <div className="p-4 bg-info text-info-foreground rounded">
                  <p className="font-semibold">Info</p>
                  <p className="text-sm">bg-info + text-info-foreground</p>
                </div>

                {/* Border/Input/Ring */}
                <div className="col-span-2 p-4 border-4 rounded space-y-2">
                  <div className="p-2 border border-input rounded bg-background">
                    <p className="text-sm">Input border: border-input</p>
                  </div>
                  <div className="p-2 rounded ring-2 ring-ring ring-offset-2">
                    <p className="text-sm">Focus ring: ring-ring</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent
          value="typography"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <Card className="bcc-glass border-none bg-white/[0.02]">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#ff8c00]"></div>
                <div>
                  <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">
                    Typography Tokens
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">
                    Font families, sizes, weights, and line heights.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-12">
              {/* Font Families */}
              {localTokens.fontFamily && (
                <div className="space-y-6">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold">
                    Font Families
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    {Object.entries(localTokens.fontFamily).map(
                      ([key, token]: [string, any]) => (
                        <div
                          key={key}
                          className="p-6 bg-white/[0.03] border border-white/5 rounded-sm space-y-4 group"
                        >
                          <Label className="text-[10px] uppercase tracking-widest text-white/60 font-bold group-hover:text-white transition-colors">
                            {key}
                          </Label>
                          <Input
                            value={token.$value}
                            onChange={(e) =>
                              updateToken(`fontFamily.${key}`, e.target.value)
                            }
                            placeholder="'Inter', sans-serif"
                            className="font-mono text-xs bg-black/40 border-white/10"
                          />
                          <div
                            className="p-6 bg-black/40 border border-white/5 rounded-sm text-lg"
                            style={{ fontFamily: token.$value }}
                          >
                            THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="h-px bg-white/5 w-full" />

              {/* Font Weights */}
              {localTokens.fontWeight && (
                <div className="space-y-6">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold">
                    Font Weights
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(localTokens.fontWeight).map(
                      ([key, token]: [string, any]) => (
                        <div
                          key={key}
                          className="space-y-3 p-4 bg-white/[0.03] border border-white/5 rounded-sm"
                        >
                          <Label className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                            {key}
                          </Label>
                          <Input
                            value={token.$value}
                            onChange={(e) =>
                              updateToken(`fontWeight.${key}`, e.target.value)
                            }
                            placeholder="400"
                            type="number"
                            className="font-mono text-xs bg-black/40 border-white/10"
                          />
                          <div
                            className="p-3 bg-black/40 rounded-sm text-sm text-center border border-white/5 text-[#ff8c00]"
                            style={{ fontWeight: token.$value }}
                          >
                            {token.$value}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="h-px bg-white/5 w-full" />

              {/* Font Sizes */}
              {localTokens.fontSize && (
                <div className="space-y-6">
                  <h3 className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold">
                    Font Sizes
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    {Object.entries(localTokens.fontSize).map(
                      ([key, token]: [string, any]) => (
                        <div
                          key={key}
                          className="space-y-3 p-4 bg-white/[0.03] border border-white/5 rounded-sm"
                        >
                          <Label className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                            {key}
                          </Label>
                          <Input
                            value={token.$value}
                            onChange={(e) =>
                              updateToken(`fontSize.${key}`, e.target.value)
                            }
                            placeholder="1rem"
                            className="font-mono text-xs bg-black/40 border-white/10"
                          />
                          <div
                            className="p-4 bg-black/40 rounded-sm border border-white/5 flex items-center justify-center overflow-hidden"
                            style={{ fontSize: token.$value }}
                          >
                            SAMPLE
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent
          value="preview"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <Card className="bcc-glass border-none bg-white/[0.02]">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#ff8c00]"></div>
                <div>
                  <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold text-white/90">
                    Live System Preview
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase text-white/40 tracking-wider">
                    Evaluating design token injection and peripheral component
                    resonance.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold">
                  Generated CSS Topology
                </h3>
                <pre className="p-6 bg-black/60 border border-white/5 rounded-sm overflow-auto max-h-96 text-[10px] font-mono text-[#ff8c00]/60 selection:bg-[#ff8c00] selection:text-black">
                  {getCSSVariables()}
                </pre>
              </div>

              <div className="h-px bg-white/5 w-full" />

              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-widest text-[#ff8c00] font-bold">
                  Component Resonance
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <Button className="bg-[#ff8c00] text-black hover:bg-[#ff8c00]/80 text-[10px] uppercase tracking-tighter font-bold h-12">
                    Primary Action
                  </Button>
                  <Button
                    variant="secondary"
                    className="bg-white/5 border-white/10 hover:bg-white/10 text-[10px] uppercase tracking-tighter h-12"
                  >
                    Secondary Wave
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-[10px] uppercase tracking-tighter h-12"
                  >
                    Boundary Edge
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-white/40 hover:text-[#ff8c00] hover:bg-[#ff8c00]/5 text-[10px] uppercase tracking-tighter h-12"
                  >
                    Ghost Trace
                  </Button>
                </div>

                <Card className="bg-white/[0.03] border border-white/5 p-8 rounded-sm">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff8c00]" />
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/80">
                        Recursive Node Test
                      </h4>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed uppercase tracking-widest max-w-xl italic text-justify">
                      Building deep-layered visual hiearchies using semantic
                      injection points. All components are reactive to the
                      systemic tokens managed within this console. De-facto
                      standards for brand resonance.
                    </p>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bcc-glass border-white/10 bg-[#0a0a0a]/90">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white uppercase tracking-widest text-sm font-bold">
              Resonance Reset?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-[10px] uppercase tracking-wider">
              This action will reset all design tokens to their default values.
              Custom signal chains will be lost. This process is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-[10px] uppercase tracking-widest px-6 font-bold">
              Abort
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-red-500 text-white hover:bg-red-600 border-none text-[10px] uppercase tracking-widest px-6 font-bold"
            >
              Execute Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DesignSettingsLayoutWrapper>
  );
}
