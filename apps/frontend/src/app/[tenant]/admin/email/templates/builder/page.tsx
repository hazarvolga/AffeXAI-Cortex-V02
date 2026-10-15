"use client";

import { useMemo, useState } from "react";
import { EmailBuilderCanvas } from "@/components/email-builder/email-builder-canvas";
import { BlockLibrarySidebar } from "@/components/email-builder/block-library-sidebar";
import { PropertiesPanel } from "@/components/email-builder/properties-panel";
import {
  EmailPreview,
  createSimpleHtmlPreview,
} from "@/components/email-builder/email-preview";
import {
  appendBlock,
  replaceBlock,
  type EmailBlock,
  type EmailStructure,
} from "@/components/email-builder/email-structure";
import { EmailTemplatesService } from "@/services/email-templates.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, Eye, Code, Smartphone, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { promptDialog } from "@/lib/dialogs/dialog-queue";

const makeId = () => crypto.randomUUID();

export default function EmailBuilderPage() {
  const { toast } = useToast();
  const [emailStructure, setEmailStructure] = useState<EmailStructure>({
    rows: [],
    settings: {
      backgroundColor: "#f5f5f5",
      contentWidth: "600px",
      fonts: [],
    },
  });

  const [selectedBlock, setSelectedBlock] = useState<EmailBlock | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const html = useMemo(
    () => (showCode ? createSimpleHtmlPreview(emailStructure) : ""),
    [showCode, emailStructure],
  );

  const handleBlockUpdate = (updated: EmailBlock) => {
    setEmailStructure((structure) => replaceBlock(structure, updated));
    setSelectedBlock(updated);
  };

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);

      const name = await promptDialog({
        title: "Şablonu kaydet",
        label: "Şablon adı",
        defaultValue: "Yeni e-posta şablonu",
      });
      if (!name) return;

      const description = await promptDialog({
        title: "Şablon açıklaması",
        label: "Açıklama (isteğe bağlı)",
      });

      const result = await EmailTemplatesService.createTemplate({
        name,
        description: description || undefined,
        structure: emailStructure,
        type: "CUSTOM",
        isActive: true,
      });

      toast({
        title: "Şablon kaydedildi",
        description: `"${result.name}" şablonlar listesine eklendi.`,
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Şablon kaydedilemedi",
        description: error instanceof Error ? error.message : "Tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-background">
      {/* Header Toolbar */}
      <div className="border-b bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-xl font-semibold">Şablon tasarımcısı</h1>
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label="Önizleme genişliği"
          >
            <Button
              variant={previewMode === "desktop" ? "default" : "outline"}
              size="sm"
              aria-pressed={previewMode === "desktop"}
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="h-4 w-4 mr-2" aria-hidden="true" />
              Masaüstü
            </Button>
            <Button
              variant={previewMode === "mobile" ? "default" : "outline"}
              size="sm"
              aria-pressed={previewMode === "mobile"}
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="h-4 w-4 mr-2" aria-hidden="true" />
              Mobil
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-pressed={showPreview}
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
            {showPreview ? "Önizlemeyi gizle" : "Önizlemeyi göster"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCode(true)}>
            <Code className="h-4 w-4 mr-2" aria-hidden="true" />
            HTML kodu
          </Button>
          <Button size="sm" onClick={handleSaveTemplate} disabled={saving}>
            <Save className="h-4 w-4 mr-2" aria-hidden="true" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto md:flex-row md:overflow-hidden">
        <BlockLibrarySidebar
          onBlockSelect={(block: { id: string }) =>
            setEmailStructure((structure) =>
              appendBlock(structure, block.id, makeId),
            )
          }
        />

        <div
          role="region"
          aria-label="Şablon kanvası"
          tabIndex={0}
          className="flex-1 min-h-[400px] overflow-auto bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <EmailBuilderCanvas
            structure={emailStructure}
            onStructureChange={setEmailStructure}
            selectedBlock={selectedBlock}
            onBlockSelect={setSelectedBlock}
            previewMode={previewMode}
          />
        </div>

        {selectedBlock && (
          <PropertiesPanel
            block={selectedBlock}
            onBlockUpdate={handleBlockUpdate}
          />
        )}

        {showPreview && (
          <EmailPreview structure={emailStructure} previewMode={previewMode} />
        )}
      </div>

      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>HTML kodu</DialogTitle>
            <DialogDescription>
              Önizlemede kullanılan HTML. Gönderimde e-posta istemcileri için
              ayrıca derlenir.
            </DialogDescription>
          </DialogHeader>
          <pre
            tabIndex={0}
            aria-label="Şablonun HTML kodu"
            className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-4 text-xs"
          >
            {html}
          </pre>
          <Button
            variant="outline"
            onClick={() =>
              void navigator.clipboard
                .writeText(html)
                .then(() =>
                  toast({
                    title: "Kopyalandı",
                    description: "HTML panoya kopyalandı.",
                  }),
                )
                .catch(() =>
                  toast({
                    title: "Kopyalanamadı",
                    description: "Metni elle seçip kopyalayın.",
                    variant: "destructive",
                  }),
                )
            }
          >
            Kopyala
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
