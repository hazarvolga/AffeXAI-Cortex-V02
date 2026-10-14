"use client";

import React from "react";
import { apiFetch } from "@/lib/api/api-fetch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  X,
  Image as ImageIcon,
  Video,
  Youtube,
  Ban,
  File as FileIcon,
  ChevronDown,
  Upload,
} from "lucide-react";
import { LucideIconPicker } from "@/components/cms/editor/lucide-icon-picker";
import {
  toPropertySchema,
  type BlockPropertySchema,
} from "../schemas/property-schema-adapter";
import type { PropField } from "@/components/cms/schemas/block-schema";
import { MediaPicker } from "@/components/cms/editor/media-picker";
import { MediaLibrary } from "@/components/cms/editor/media-library";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Media, MediaType } from "@/lib/media/types";
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";
import { cn } from "@/lib/utils";

interface DynamicFormGeneratorProps {
  schema: PropField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

/**
 * DynamicFormGenerator - Automatically generates form fields from BlockPropertySchema
 *
 * Supports all property types from prebuild block configs:
 * - text, number, boolean, color, select, image, textarea, token, list
 * - Design token integration
 * - Media library integration (planned)
 * - Nested list structures
 */
export const DynamicFormGenerator: React.FC<DynamicFormGeneratorProps> = ({
  schema: fields,
  values,
  onChange,
}) => {
  const schema = toPropertySchema(fields);
  const { toast } = useToast();
  const [mediaLibraryOpen, setMediaLibraryOpen] = React.useState(false);
  const [currentMediaField, setCurrentMediaField] = React.useState<{
    fieldKey: string;
    onChange: (value: string) => void;
  } | null>(null);

  /**
   * Generate slug from text (Turkish character support)
   * Used for auto-generating IDs from labels
   */
  const generateSlug = (text: string): string => {
    if (!text || typeof text !== "string") return "";

    const turkishMap: Record<string, string> = {
      ç: "c",
      Ç: "C",
      ğ: "g",
      Ğ: "G",
      ı: "i",
      İ: "I",
      ö: "o",
      Ö: "O",
      ş: "s",
      Ş: "S",
      ü: "u",
      Ü: "U",
    };

    let slug = text;

    // Replace Turkish characters
    Object.keys(turkishMap).forEach((key) => {
      slug = slug.replace(new RegExp(key, "g"), turkishMap[key]);
    });

    // Convert to lowercase, replace spaces with hyphens, remove special characters
    slug = slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

    return slug;
  };

  /**
   * Open Media Library for a specific field
   */
  const openMediaLibrary = (
    fieldKey: string,
    onChange: (value: string) => void,
  ) => {
    setCurrentMediaField({ fieldKey, onChange });
    setMediaLibraryOpen(true);
  };

  /**
   * Handle media selection from Media Library
   */
  const handleMediaSelect = (media: Media) => {
    if (currentMediaField) {
      currentMediaField.onChange(media.url);
      toast({
        title: "Media selected",
        description: `${media.originalName} has been added`,
      });
    }
    setMediaLibraryOpen(false);
    setCurrentMediaField(null);
  };

  /**
   * Helper function to identify style properties
   * These will be shown in Style tab instead of Content tab
   */
  const isStyleProperty = (propName: string): boolean => {
    const styleKeywords = [
      "color",
      "background",
      "padding",
      "margin",
      "width",
      "height",
      "size",
      "variant",
      "align",
      "weight",
      "border",
      "shadow",
      "opacity",
      "radius",
      "rounded",
      "spacing",
      "gap",
      "font",
    ];

    const lowerProp = propName.toLowerCase();
    return styleKeywords.some((keyword) => lowerProp.includes(keyword));
  };

  /**
   * Render a single form field based on property type
   */
  const renderField = (
    key: string,
    config: BlockPropertySchema[string],
    currentValue: any,
    parentPath: string = "",
  ) => {
    const fieldKey = parentPath ? `${parentPath}.${key}` : key;
    const value = currentValue ?? config.defaultValue ?? "";

    // Special handling for mediaId fields (e.g., imageMediaId, logoMediaId, mediaId)
    if (key.toLowerCase().includes("mediaid")) {
      // Determine corresponding URL field name
      const urlFieldName = key
        .replace(/MediaId$/i, "Url")
        .replace(/mediaid$/i, "url");

      // For list items, we need to get the URL from the parent item
      // Extract index from parentPath if exists (e.g., "items[0]" -> index 0)
      let currentUrl = "";
      if (parentPath.includes("[")) {
        const match = parentPath.match(/\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          const listKey = parentPath.split("[")[0];
          const items = values[listKey];
          if (items && items[index]) {
            currentUrl = items[index][urlFieldName] || "";
          }
        }
      } else {
        currentUrl = values[urlFieldName] || "";
      }

      return (
        <div key={fieldKey} className="space-y-2">
          <Label>{config.label}</Label>
          <div className="border rounded-lg p-3 bg-gray-50">
            <MediaPicker
              value={value || undefined}
              onChange={async (mediaId) => {
                if (mediaId) {
                  // Update mediaId
                  onChange(key, mediaId);

                  // Fetch and update corresponding URL field
                  try {
                    const response = await apiFetch(`/api/media/${mediaId}`);

                    if (!response.ok) {
                      throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`,
                      );
                    }

                    const data = await response.json();

                    if (data.url) {
                      // For list items, we need to update the URL in the parent onChange
                      if (parentPath.includes("[")) {
                        const match = parentPath.match(/\[(\d+)\]/);
                        if (match) {
                          const index = parseInt(match[1]);
                          const listKey = parentPath.split("[")[0];
                          const items = [...(values[listKey] || [])];
                          if (items[index]) {
                            items[index] = {
                              ...items[index],
                              [urlFieldName]: data.url,
                            };
                            onChange(listKey, items);
                          }
                        }
                      } else {
                        onChange(urlFieldName, data.url);
                      }
                    } else {
                      throw new Error("Media URL not found in response");
                    }
                  } catch (err) {
                    const errorMessage =
                      err instanceof Error ? err.message : "Unknown error";
                    console.error(
                      "Error fetching media URL:",
                      errorMessage,
                      err,
                    );
                    toast({
                      title: "Error",
                      description: `Failed to load media URL: ${errorMessage}`,
                      variant: "destructive",
                    });
                  }
                } else {
                  // Clear both mediaId and URL
                  onChange(key, null);
                  if (parentPath.includes("[")) {
                    const match = parentPath.match(/\[(\d+)\]/);
                    if (match) {
                      const index = parseInt(match[1]);
                      const listKey = parentPath.split("[")[0];
                      const items = [...(values[listKey] || [])];
                      if (items[index]) {
                        items[index] = { ...items[index], [urlFieldName]: "" };
                        onChange(listKey, items);
                      }
                    }
                  } else {
                    onChange(urlFieldName, "");
                  }
                }
              }}
              placeholder={`Select ${config.label || "media"}`}
            />
          </div>
          {currentUrl && (
            <div className="relative group">
              <NextImage
                src={currentUrl}
                alt="Preview"
                width={300}
                height={128}
                className="w-full h-32 object-contain rounded border bg-white"
              />
              <button
                onClick={() => {
                  onChange(key, null);
                  if (parentPath.includes("[")) {
                    const match = parentPath.match(/\[(\d+)\]/);
                    if (match) {
                      const index = parseInt(match[1]);
                      const listKey = parentPath.split("[")[0];
                      const items = [...(values[listKey] || [])];
                      if (items[index]) {
                        items[index] = { ...items[index], [urlFieldName]: "" };
                        onChange(listKey, items);
                      }
                    }
                  } else {
                    onChange(urlFieldName, "");
                  }
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {value && (
            <div className="text-xs text-muted-foreground">
              Media ID: {value}
            </div>
          )}
        </div>
      );
    }

    // Special handling for *MediaUrl fields that have corresponding *MediaType field
    // (e.g., backgroundMediaUrl + backgroundMediaType, imageMediaUrl + imageMediaType)
    if (key.toLowerCase().endsWith("mediaurl")) {
      // Determine corresponding media type field name
      const mediaTypeField = key
        .replace(/MediaUrl$/i, "MediaType")
        .replace(/mediaurl$/i, "mediatype");

      // Only show Browse button if there's a corresponding mediaType field
      if (schema[mediaTypeField]) {
        // Get current media type to show appropriate preview
        let currentMediaType = "";
        if (parentPath.includes("[")) {
          const match = parentPath.match(/\[(\d+)\]/);
          if (match) {
            const index = parseInt(match[1]);
            const listKey = parentPath.split("[")[0];
            const items = values[listKey];
            if (items && items[index]) {
              currentMediaType = items[index][mediaTypeField] || "image";
            }
          }
        } else {
          currentMediaType = values[mediaTypeField] || "image";
        }

        return (
          <div key={fieldKey} className="space-y-2">
            <Label>{config.label}</Label>
            <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
              {/* Browse Button for Media Library */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentMediaField({
                    fieldKey: key,
                    onChange: (url: string) => {
                      if (parentPath.includes("[")) {
                        const match = parentPath.match(/\[(\d+)\]/);
                        if (match) {
                          const index = parseInt(match[1]);
                          const listKey = parentPath.split("[")[0];
                          const items = [...(values[listKey] || [])];
                          if (items[index]) {
                            items[index] = { ...items[index], [key]: url };
                            onChange(listKey, items);
                          }
                        }
                      } else {
                        onChange(key, url);
                      }
                    },
                  });
                  setMediaLibraryOpen(true);
                }}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Media Library
              </Button>

              {/* Direct URL Input */}
              <Input
                type="text"
                value={value}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder="Or paste direct URL"
              />
            </div>

            {/* Preview based on media type */}
            {value && currentMediaType === "image" && (
              <div className="relative group">
                <NextImage
                  src={value}
                  alt="Preview"
                  width={300}
                  height={128}
                  className="w-full h-32 object-contain rounded border bg-white"
                />
                <button
                  onClick={() => {
                    if (parentPath.includes("[")) {
                      const match = parentPath.match(/\[(\d+)\]/);
                      if (match) {
                        const index = parseInt(match[1]);
                        const listKey = parentPath.split("[")[0];
                        const items = [...(values[listKey] || [])];
                        if (items[index]) {
                          items[index] = { ...items[index], [key]: "" };
                          onChange(listKey, items);
                        }
                      }
                    } else {
                      onChange(key, "");
                    }
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {value && currentMediaType === "video" && (
              <div className="relative group">
                <video
                  src={value}
                  className="w-full h-32 object-contain rounded border bg-black"
                  controls
                />
                <button
                  onClick={() => {
                    if (parentPath.includes("[")) {
                      const match = parentPath.match(/\[(\d+)\]/);
                      if (match) {
                        const index = parseInt(match[1]);
                        const listKey = parentPath.split("[")[0];
                        const items = [...(values[listKey] || [])];
                        if (items[index]) {
                          items[index] = { ...items[index], [key]: "" };
                          onChange(listKey, items);
                        }
                      }
                    } else {
                      onChange(key, "");
                    }
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {value && currentMediaType === "youtube" && (
              <div className="text-sm text-muted-foreground">
                YouTube URL: {value}
              </div>
            )}
          </div>
        );
      }
    }

    switch (config.type) {
      case "text":
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{config.label}</Label>
            <Input
              id={fieldKey}
              type="text"
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={
                typeof config.defaultValue === "string"
                  ? config.defaultValue
                  : ""
              }
            />
            {config.tokenReference && (
              <p className="text-xs text-muted-foreground">
                💡 Can use design token:{" "}
                {config.tokenReference.suggestedPath ||
                  config.tokenReference.category}
              </p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{config.label}</Label>
            <Textarea
              id={fieldKey}
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={
                typeof config.defaultValue === "string"
                  ? config.defaultValue
                  : ""
              }
              rows={4}
            />
          </div>
        );

      case "number":
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{config.label}</Label>
            <Input
              id={fieldKey}
              type="number"
              value={value}
              onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
              placeholder={config.defaultValue?.toString() || "0"}
            />
            {config.tokenReference && (
              <p className="text-xs text-muted-foreground">
                💡 Can use design token:{" "}
                {config.tokenReference.suggestedPath ||
                  config.tokenReference.category}
              </p>
            )}
          </div>
        );

      case "boolean":
      case "checkbox":
        return (
          <div key={fieldKey} className="flex items-center space-x-2">
            <Checkbox
              id={fieldKey}
              checked={value || false}
              onCheckedChange={(checked) => onChange(key, checked)}
            />
            <Label htmlFor={fieldKey} className="cursor-pointer">
              {config.label}
            </Label>
          </div>
        );

      case "color":
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{config.label}</Label>
            <div className="flex gap-2">
              <Input
                id={fieldKey}
                type="color"
                value={value || "#000000"}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={value || ""}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
            {config.tokenReference && (
              <p className="text-xs text-muted-foreground">
                💡 Can use design token:{" "}
                {config.tokenReference.suggestedPath || "color.primary"}
              </p>
            )}
          </div>
        );

      case "select":
        // Enhanced UI for Media Type selectors
        const isMediaTypeField = config.label
          ?.toLowerCase()
          .includes("media type");

        if (isMediaTypeField && config.options) {
          return (
            <div key={fieldKey} className="space-y-2">
              <Label htmlFor={fieldKey}>{config.label}</Label>
              <div className="grid grid-cols-3 gap-2">
                {config.options.map((option) => {
                  const isSelected = (value || config.defaultValue) === option;

                  // Icon mapping for media types
                  const getMediaIcon = (type: string) => {
                    switch (type.toLowerCase()) {
                      case "none":
                        return <Ban className="h-4 w-4" />;
                      case "image":
                        return <ImageIcon className="h-4 w-4" />;
                      case "video":
                        return <Video className="h-4 w-4" />;
                      case "youtube":
                        return <Youtube className="h-4 w-4" />;
                      default:
                        return <FileIcon className="h-4 w-4" />;
                    }
                  };

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onChange(key, option)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-accent",
                      )}
                    >
                      {getMediaIcon(option)}
                      <span className="text-xs mt-1 font-medium capitalize">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        // Default dropdown for other select fields
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{config.label}</Label>
            <Select
              value={value || config.defaultValue || ""}
              onValueChange={(val) => onChange(key, val)}
            >
              <SelectTrigger id={fieldKey}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {config.optionLabels?.[option] || option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "image":
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{config.label}</Label>
            <div className="border rounded-lg p-3 bg-gray-50">
              <MediaPicker
                value={undefined}
                onChange={async (mediaId) => {
                  if (mediaId) {
                    try {
                      const response = await apiFetch(`/api/media/${mediaId}`);
                      if (!response.ok) {
                        throw new Error(
                          `HTTP ${response.status}: ${response.statusText}`,
                        );
                      }
                      const data = await response.json();
                      if (data.url) {
                        onChange(key, data.url);
                      } else {
                        throw new Error("Media URL not found in response");
                      }
                    } catch (err) {
                      const errorMessage =
                        err instanceof Error ? err.message : "Unknown error";
                      console.error(
                        "Error fetching media URL:",
                        errorMessage,
                        err,
                      );
                      toast({
                        title: "Error",
                        description: `Failed to load media URL: ${errorMessage}`,
                        variant: "destructive",
                      });
                    }
                  } else {
                    onChange(key, "");
                  }
                }}
                placeholder={`Select ${config.label || "image"}`}
                filterType={MediaType.IMAGE}
              />
            </div>
            {value && (
              <div className="relative group">
                <NextImage
                  src={value}
                  alt={config.label || "Image"}
                  width={300}
                  height={128}
                  className="w-full h-32 object-contain rounded border bg-white"
                />
                <button
                  onClick={() => onChange(key, "")}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );

      case "token":
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{config.label}</Label>
            <Input
              id={fieldKey}
              type="text"
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={config.tokenReference?.suggestedPath || "token.path"}
            />
            <p className="text-xs text-muted-foreground">
              🎨 Design token: {config.tokenReference?.category} -{" "}
              {config.tokenReference?.description}
            </p>
          </div>
        );

      case "icon":
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{config.label}</Label>
            <LucideIconPicker
              value={value || null}
              onChange={(iconName) => onChange(key, iconName)}
            />
          </div>
        );

      case "list":
      case "array":
        return renderListField(key, config, value || [], fieldKey);

      default:
        return (
          <div key={fieldKey} className="space-y-2">
            <Label>{config.label}</Label>
            <p className="text-sm text-muted-foreground">
              Unsupported field type: {config.type}
            </p>
          </div>
        );
    }
  };

  /**
   * Helper: Render individual field input (without wrapper)
   */
  const renderFieldInput = (
    key: string,
    config: BlockPropertySchema[string],
    value: any,
    fieldKey: string,
    onChange: (value: any) => void,
    parentItem?: any,
  ) => {
    // Special handling for mediaUrl - show Media Library integration for image/video
    if (key === "mediaUrl" && parentItem?.mediaType) {
      const mediaType = parentItem.mediaType;

      if (mediaType === "image" || mediaType === "video") {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                id={fieldKey}
                type="text"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`${mediaType === "image" ? "🖼️ Image" : "🎬 Video"} URL or upload path`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openMediaLibrary(fieldKey, onChange)}
                className="shrink-0"
              >
                {mediaType === "image" ? (
                  <ImageIcon className="h-4 w-4 mr-2" />
                ) : (
                  <Video className="h-4 w-4 mr-2" />
                )}
                Browse
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {mediaType === "image" ? "📷" : "🎥"} Paste URL or click Browse to
              upload from Media Library
            </p>
          </div>
        );
      }

      if (mediaType === "youtube") {
        return (
          <div className="space-y-2">
            <Input
              id={fieldKey}
              type="text"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste YouTube URL (e.g., https://youtu.be/... or https://youtube.com/watch?v=...)"
            />
            <p className="text-xs text-muted-foreground">
              📺 Paste any YouTube link - we&apos;ll extract the video ID
              automatically
            </p>
          </div>
        );
      }
    }

    switch (config.type) {
      case "text":
        return (
          <Input
            id={fieldKey}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              typeof config.defaultValue === "string" ? config.defaultValue : ""
            }
          />
        );

      case "textarea":
        return (
          <Textarea
            id={fieldKey}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              typeof config.defaultValue === "string" ? config.defaultValue : ""
            }
            rows={3}
          />
        );

      case "number":
        return (
          <Input
            id={fieldKey}
            type="number"
            value={value || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={config.defaultValue?.toString() || "0"}
          />
        );

      case "boolean":
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldKey}
              checked={value || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={fieldKey} className="cursor-pointer">
              {config.label}
            </Label>
          </div>
        );

      case "select":
        // Enhanced UI for Media Type selectors
        const isMediaTypeField = config.label
          ?.toLowerCase()
          .includes("media type");

        if (isMediaTypeField && config.options) {
          return (
            <div className="grid grid-cols-3 gap-2">
              {config.options.map((option) => {
                const isSelected = (value || config.defaultValue) === option;

                // Icon mapping for media types
                const getMediaIcon = (type: string) => {
                  switch (type.toLowerCase()) {
                    case "none":
                      return <Ban className="h-4 w-4" />;
                    case "image":
                      return <ImageIcon className="h-4 w-4" />;
                    case "video":
                      return <Video className="h-4 w-4" />;
                    case "youtube":
                      return <Youtube className="h-4 w-4" />;
                    default:
                      return <FileIcon className="h-4 w-4" />;
                  }
                };

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChange(option)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent",
                    )}
                  >
                    {getMediaIcon(option)}
                    <span className="text-xs mt-1 font-medium capitalize">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        }

        // Default dropdown for other select fields
        return (
          <Select
            value={value || config.defaultValue || ""}
            onValueChange={onChange}
          >
            <SelectTrigger id={fieldKey}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "icon":
        return (
          <LucideIconPicker
            value={value || null}
            onChange={(iconName) => onChange(iconName)}
          />
        );

      default:
        return (
          <Input
            id={fieldKey}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              typeof config.defaultValue === "string" ? config.defaultValue : ""
            }
          />
        );
    }
  };

  /**
   * Render nested list field (for arrays inside arrays, like subTabs inside mainTabs)
   */
  const renderNestedListField = (
    key: string,
    config: BlockPropertySchema[string],
    items: any[],
    fieldKey: string,
    onChange: (items: any[]) => void,
  ) => {
    const addItem = () => {
      const newItem: any = {};
      if (config.itemSchema) {
        Object.keys(config.itemSchema).forEach((subKey) => {
          newItem[subKey] = config.itemSchema![subKey].defaultValue ?? "";
        });
      }
      onChange([...items, newItem]);
    };

    const removeItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      onChange(newItems);
    };

    const updateItem = (index: number, subKey: string, subValue: any) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [subKey]: subValue };
      onChange(newItems);
    };

    return (
      <div
        key={fieldKey}
        className="space-y-3 ml-4 pl-4 border-l-2 border-blue-200"
      >
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-blue-700">
            {config.label}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add {config.label}
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No {config.label.toLowerCase()} yet.
          </p>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {items.map((item, index) => {
              // Get label for accordion trigger
              const itemLabel =
                item.label || item.title || `${config.label} #${index + 1}`;
              const itemIcon = item.icon || "";

              return (
                <AccordionItem
                  key={`${fieldKey}-${index}`}
                  value={`item-${index}`}
                  className="border border-blue-200 rounded-lg bg-blue-50"
                >
                  <div className="flex items-center">
                    <AccordionTrigger className="flex-1 px-3 py-2 hover:no-underline">
                      <div className="flex items-center w-full">
                        <span className="text-xs font-medium text-blue-800">
                          {itemIcon && <span className="mr-2">{itemIcon}</span>}
                          {itemLabel}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                      className="mr-3 h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <AccordionContent className="px-3 pb-3 pt-1">
                    <div className="space-y-2">
                      {config.itemSchema &&
                        Object.entries(config.itemSchema).map(
                          ([subKey, subConfig]) => {
                            // Skip rendering 'id' fields - they will be auto-generated from 'label'
                            if (subKey === "id" && config.itemSchema?.label) {
                              return null;
                            }

                            return (
                              <div
                                key={`${fieldKey}[${index}].${subKey}`}
                                className="space-y-1"
                              >
                                <Label
                                  htmlFor={`${fieldKey}[${index}].${subKey}`}
                                  className="text-xs"
                                >
                                  {subConfig.label}
                                </Label>
                                {renderFieldInput(
                                  subKey,
                                  subConfig,
                                  item[subKey],
                                  `${fieldKey}[${index}].${subKey}`,
                                  (subValue) => {
                                    // Auto-generate ID when label changes
                                    if (
                                      subKey === "label" &&
                                      config.itemSchema?.id
                                    ) {
                                      const autoId = generateSlug(subValue);
                                      const newItems = [...items];
                                      newItems[index] = {
                                        ...newItems[index],
                                        [subKey]: subValue,
                                        id: autoId,
                                      };
                                      onChange(newItems);
                                    } else {
                                      updateItem(index, subKey, subValue);
                                    }
                                  },
                                  item,
                                )}
                              </div>
                            );
                          },
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    );
  };

  /**
   * Render list field with add/remove items
   */
  const renderListField = (
    key: string,
    config: BlockPropertySchema[string],
    items: any[],
    fieldKey: string,
  ) => {
    const addItem = () => {
      const newItem: any = {};
      if (config.itemSchema) {
        Object.keys(config.itemSchema).forEach((subKey) => {
          newItem[subKey] = config.itemSchema![subKey].defaultValue ?? "";
        });
      }
      onChange(key, [...items, newItem]);
    };

    const removeItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      onChange(key, newItems);
    };

    const updateItem = (index: number, subKey: string, subValue: any) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [subKey]: subValue };
      onChange(key, newItems);
    };

    return (
      <div key={fieldKey} className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>{config.label}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No items yet. Click &quot;Add Item&quot; to create one.
          </p>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((item, index) => {
              // Get label for accordion trigger
              const itemLabel = item.label || item.title || `Item ${index + 1}`;
              const itemIcon = item.icon || "";

              return (
                <AccordionItem
                  key={`${fieldKey}-${index}`}
                  value={`item-${index}`}
                  className="border rounded-lg"
                >
                  <div className="flex items-center">
                    <AccordionTrigger className="flex-1 px-4 py-3 hover:no-underline">
                      <div className="flex items-center w-full">
                        <span className="text-sm font-medium">
                          {itemIcon && <span className="mr-2">{itemIcon}</span>}
                          {itemLabel}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                      className="mr-4 h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    <div className="space-y-3">
                      {config.itemSchema &&
                        Object.entries(config.itemSchema).map(
                          ([subKey, subConfig]) => {
                            // Skip rendering 'id' fields - they will be auto-generated from 'label'
                            if (subKey === "id" && config.itemSchema?.label) {
                              return null;
                            }

                            // For nested arrays (like subTabs inside mainTabs), create a custom onChange
                            const subOnChange = (subValue: any) => {
                              // Auto-generate ID when label changes
                              if (subKey === "label" && config.itemSchema?.id) {
                                const autoId = generateSlug(subValue);
                                const newItems = [...items];
                                newItems[index] = {
                                  ...newItems[index],
                                  [subKey]: subValue,
                                  id: autoId,
                                };
                                onChange(key, newItems);
                              } else {
                                updateItem(index, subKey, subValue);
                              }
                            };

                            // If this is a nested array, render it with renderNestedListField
                            if (
                              subConfig.type === "array" ||
                              subConfig.type === "list"
                            ) {
                              return renderNestedListField(
                                subKey,
                                subConfig,
                                item[subKey] || [],
                                `${fieldKey}[${index}].${subKey}`,
                                (nestedItems) =>
                                  updateItem(index, subKey, nestedItems),
                              );
                            }

                            // For other field types, use renderField with custom onChange
                            return (
                              <div
                                key={`${fieldKey}[${index}].${subKey}`}
                                className="space-y-2"
                              >
                                <Label
                                  htmlFor={`${fieldKey}[${index}].${subKey}`}
                                >
                                  {subConfig.label}
                                </Label>
                                {renderFieldInput(
                                  subKey,
                                  subConfig,
                                  item[subKey],
                                  `${fieldKey}[${index}].${subKey}`,
                                  subOnChange,
                                  item,
                                )}
                              </div>
                            );
                          },
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {Object.entries(schema)
          .filter(([key]) => !isStyleProperty(key) && key !== "className")
          .map(([key, config]) => renderField(key, config, values[key]))}
      </div>

      {/* Media Library Dialog */}
      <Dialog open={mediaLibraryOpen} onOpenChange={setMediaLibraryOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          <MediaLibrary onMediaSelect={handleMediaSelect} />
        </DialogContent>
      </Dialog>
    </>
  );
};
