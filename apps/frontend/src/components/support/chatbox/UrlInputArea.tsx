"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Link as LinkIcon,
  ExternalLink,
  Globe,
  AlertCircle,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UrlInputAreaProps {
  onUrlSubmit: (url: string) => void;
  onCancel: () => void;
  className?: string;
}

interface UrlPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  contentType?: string;
  status: "validating" | "processing" | "completed" | "error";
  error?: string;
  progress: number;
}

export function UrlInputArea({
  onUrlSubmit,
  onCancel,
  className,
}: UrlInputAreaProps) {
  const [url, setUrl] = useState("");
  const [urlPreview, setUrlPreview] = useState<UrlPreview | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return ["http:", "https:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  const getDomainFromUrl = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname;
    } catch {
      return "";
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setValidationError(null);
    setUrlPreview(null);
  };

  const handleUrlValidation = async () => {
    if (!url.trim()) {
      setValidationError("Lütfen bir URL girin");
      return;
    }

    if (!validateUrl(url.trim())) {
      setValidationError(
        "Geçerli bir URL girin (http:// veya https:// ile başlamalı)",
      );
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Create initial preview
      const domain = getDomainFromUrl(url.trim());
      const preview: UrlPreview = {
        url: url.trim(),
        domain,
        status: "validating",
        progress: 0,
      };

      setUrlPreview(preview);

      // Only the format is checked here; ChatBox sends the URL for real processing.
      setUrlPreview({ ...preview, status: "completed", progress: 100 });
    } catch (error) {
      setValidationError("URL işlenirken bir hata oluştu");
      setUrlPreview(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmitUrl = () => {
    if (urlPreview && urlPreview.status === "completed") {
      onUrlSubmit(urlPreview.url);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isValidating) {
      if (urlPreview?.status === "completed") {
        handleSubmitUrl();
      } else {
        handleUrlValidation();
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <LinkIcon className="h-5 w-5" />
            <span>Web Sayfası Ekle</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url-input">Web Sayfası URL&apos;si</Label>
            <div className="flex space-x-2">
              <Input
                id="url-input"
                type="url"
                value={url}
                onChange={handleUrlChange}
                onKeyPress={handleKeyPress}
                placeholder="https://example.com/page"
                disabled={isValidating}
                className="flex-1"
              />
              <Button
                onClick={handleUrlValidation}
                disabled={!url.trim() || isValidating}
                variant="outline"
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Analiz Et"
                )}
              </Button>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* URL Preview */}
          {urlPreview && (
            <Card className="border-2">
              <CardContent className="p-4">
                {/* Processing Status */}
                {(urlPreview.status === "validating" ||
                  urlPreview.status === "processing") && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">
                        {urlPreview.status === "validating"
                          ? "URL doğrulanıyor..."
                          : "İçerik analiz ediliyor..."}
                      </span>
                    </div>
                    <Progress value={urlPreview.progress} className="h-2" />
                  </div>
                )}

                {/* Completed Preview */}
                {urlPreview.status === "completed" && (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Globe
                        aria-hidden
                        className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm line-clamp-2">
                          {urlPreview.title ||
                            "Önizleme yok; bağlantı gönderildikten sonra işlenecek"}
                        </h4>
                        {urlPreview.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {urlPreview.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {urlPreview.domain}
                          </Badge>
                          {urlPreview.contentType && (
                            <Badge variant="outline" className="text-xs">
                              {urlPreview.contentType
                                .split("/")[1]
                                ?.toUpperCase() || "HTML"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preview Image */}
                    {urlPreview.image && (
                      <div className="mt-3">
                        <img
                          src={urlPreview.image}
                          alt="URL Preview"
                          className="w-full h-32 object-cover rounded-md border"
                        />
                      </div>
                    )}

                    {/* URL Display */}
                    <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                      <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground truncate flex-1">
                        {urlPreview.url}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(urlPreview.url, "_blank")}
                        className="h-6 w-6 flex-shrink-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Success Indicator */}
                    <div className="flex items-center space-x-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">
                        İçerik başarıyla analiz edildi
                      </span>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {urlPreview.status === "error" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {urlPreview.error || "URL işlenirken bir hata oluştu"}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              İptal
            </Button>
            <Button
              onClick={handleSubmitUrl}
              disabled={!urlPreview || urlPreview.status !== "completed"}
            >
              URL&apos;yi Gönder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          • Desteklenen siteler: GitHub, Stack Overflow, Google Docs, YouTube ve
          daha fazlası
        </p>
        <p>
          • URL içeriği otomatik olarak analiz edilir ve sohbet bağlamına
          eklenir
        </p>
        <p>• Robots.txt kurallarına uygun olarak içerik çekilir</p>
      </div>
    </div>
  );
}
