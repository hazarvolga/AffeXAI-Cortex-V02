"use client";

import { useState } from "react";
import { httpClient } from "@/lib/api/http-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSmartStructure } from "@/lib/email-template-designer";

const DEFAULT_EMAIL_BUILDER_STRUCTURE = {
  rows: [
    {
      id: "row-header",
      type: "section",
      columns: [
        {
          id: "col-header",
          width: "100%",
          blocks: [
            {
              id: "block-heading",
              type: "heading",
              properties: {
                level: 1,
                content: "{{subject}}",
              },
              styles: {
                color: "#1a202c",
                fontSize: "28px",
                fontWeight: "bold",
                textAlign: "center",
                marginTop: "0",
                marginBottom: "16px",
              },
            },
          ],
        },
      ],
      settings: {
        padding: "32px 24px",
        backgroundColor: "#f7fafc",
      },
    },
    {
      id: "row-content",
      type: "section",
      columns: [
        {
          id: "col-content",
          width: "100%",
          blocks: [
            {
              id: "block-text",
              type: "text",
              properties: {
                content: "{{content}}",
              },
              styles: {
                color: "#4a5568",
                fontSize: "16px",
                fontWeight: "normal",
                textAlign: "left",
                lineHeight: "1.6",
              },
            },
          ],
        },
      ],
      settings: {
        padding: "24px",
        backgroundColor: "#ffffff",
      },
    },
    {
      id: "row-cta",
      type: "section",
      columns: [
        {
          id: "col-cta",
          width: "100%",
          blocks: [
            {
              id: "block-button",
              type: "button",
              properties: {
                text: "Take Action",
                url: "#",
              },
              styles: {
                backgroundColor: "#3182ce",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "600",
                borderRadius: "6px",
                paddingX: "32px",
                paddingY: "14px",
                align: "center",
              },
            },
          ],
        },
      ],
      settings: {
        padding: "24px",
        backgroundColor: "#ffffff",
      },
    },
    {
      id: "row-divider",
      type: "section",
      columns: [
        {
          id: "col-divider",
          width: "100%",
          blocks: [
            {
              id: "block-divider",
              type: "divider",
              properties: {},
              styles: {
                color: "#e2e8f0",
                height: "1px",
                marginTop: "24px",
                marginBottom: "24px",
                borderStyle: "solid",
              },
            },
          ],
        },
      ],
      settings: {
        padding: "0 24px",
        backgroundColor: "#ffffff",
      },
    },
    {
      id: "row-footer",
      type: "section",
      columns: [
        {
          id: "col-footer",
          width: "100%",
          blocks: [
            {
              id: "block-footer-text",
              type: "text",
              properties: {
                content: "© 2025 Your Company. All rights reserved.",
              },
              styles: {
                color: "#a0aec0",
                fontSize: "12px",
                fontWeight: "normal",
                textAlign: "center",
                lineHeight: "1.5",
              },
            },
          ],
        },
      ],
      settings: {
        padding: "24px",
        backgroundColor: "#f7fafc",
      },
    },
  ],
  settings: {
    backgroundColor: "#f5f5f5",
    contentWidth: "600px",
    fonts: ["Inter", "Roboto"],
  },
};

export default function TemplateUtilitiesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    updated: number;
    total: number;
  } | null>(null);
  const { toast } = useToast();

  const updateEmptyTemplates = async () => {
    try {
      setLoading(true);
      setResult(null);

      // Fetch all templates
      const data = {
        data: await httpClient.getWrapped<any>("/email-templates"),
      };

      // Handle API response format: { success: true, data: { dbTemplates: [], fileTemplates: [] } }
      let templates = [];
      if (Array.isArray(data)) {
        templates = data;
      } else if (data.data) {
        // ONLY use dbTemplates - fileTemplates are read-only!
        templates = data.data.dbTemplates || [];
      } else if (data.data && Array.isArray(data.data)) {
        templates = data.data;
      }

      console.log(`📊 Total database templates: ${templates.length}`);

      // Filter empty templates (no structure or empty structure)
      const emptyTemplates = templates.filter(
        (t: any) =>
          !t.structure ||
          (typeof t.structure === "object" &&
            Object.keys(t.structure).length === 0),
      );

      console.log(`📦 Empty templates to update: ${emptyTemplates.length}`);

      console.log(`Found ${emptyTemplates.length} empty templates`);

      let updated = 0;

      // Update each empty template with SMART structure
      for (const template of emptyTemplates) {
        try {
          // Generate context-aware structure based on template name
          const smartStructure = generateSmartStructure({
            name: template.name,
            type: template.type,
            description: template.description,
          });

          console.log(`🎨 Generating smart design for: ${template.name}`);

          const updateOk = await httpClient
            .patchWrapped(`/email-templates/${template.id}`, {
              structure: smartStructure,
              type: "custom",
              variables: [
                "subject",
                "content",
                "profileUrl",
                "resetUrl",
                "shopUrl",
              ],
            })
            .then(
              () => true,
              () => false,
            );

          if (updateOk) {
            updated++;
            console.log(`✅ Updated: ${template.name}`);
          } else {
            console.error(`❌ Failed to update: ${template.name}`);
          }
        } catch (error) {
          console.error(`❌ Error updating ${template.name}:`, error);
        }
      }

      setResult({ updated, total: emptyTemplates.length });

      toast({
        title: "Başarılı!",
        description: `${updated} şablon Email Builder yapısı ile güncellendi.`,
      });
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        title: "Hata",
        description: "Şablonlar güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Template Utilities</h1>
        <p className="text-muted-foreground mt-2">
          Yönetim araçları ve bakım işlemleri
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Boş Şablonları Güncelle
          </CardTitle>
          <CardDescription>
            Yapısı boş olan tüm email şablonlarına varsayılan Email Builder
            yapısı ekler. Bu işlem şablonların preview ve edit sayfalarında
            düzgün görünmesini sağlar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={updateEmptyTemplates} disabled={loading} size="lg">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Boş Şablonları Güncelle
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className="mt-6 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-start gap-3">
                {result.updated > 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">İşlem Tamamlandı</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>{result.total}</strong> boş şablon bulundu
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>{result.updated}</strong> şablon başarıyla
                    güncellendi
                  </p>
                  {result.updated > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✅ Şablonlar artık preview ve edit sayfalarında görünecek
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg border bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              📝 Yapılan Değişiklikler
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>5 satırlı Email Builder yapısı eklenir</li>
              <li>Header, content, button, divider ve footer blokları</li>
              <li>Template type &apos;custom&apos; olarak ayarlanır</li>
              <li>Değişkenler: subject, content</li>
              <li>Preview ve edit sayfaları düzgün çalışır</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
