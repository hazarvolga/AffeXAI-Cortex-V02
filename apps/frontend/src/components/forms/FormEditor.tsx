"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ChevronLeft,
  Monitor,
  Save,
  Send,
  Smartphone,
} from "lucide-react";
import { toast } from "@/lib/notify";
import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { FormBlockSidebar } from "@/components/shared/visual-builder/FormBlockSidebar";
import {
  FormBuilderCanvas,
  type FormBlock as BuilderBlock,
  type FormStructure as BuilderStructure,
} from "@/components/shared/visual-builder/FormBuilderCanvas";
import { FormPropertiesSidebar } from "@/components/shared/visual-builder/FormPropertiesSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formsService,
  type FormSettings,
  type FormStatus,
  type FormStructure,
} from "@/services/forms.service";
import { FormErrorState, FormLoadingState } from "./FormPageState";

const EMPTY_STRUCTURE: FormStructure = {
  rows: [],
  settings: { theme: "modern", submitButtonText: "Gönder", width: "600px" },
  logicConfig: { rules: [] },
};

interface FormEditorProps {
  tenantId: string;
  formId?: string;
}

export function FormEditor({ tenantId, formId }: FormEditorProps) {
  const router = useRouter();
  const [name, setName] = useState("Yeni Form");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FormStatus>("draft");
  const [structure, setStructure] = useState<FormStructure>(EMPTY_STRUCTURE);
  const [settings, setSettings] = useState<FormSettings>({});
  const [selectedBlock, setSelectedBlock] = useState<BuilderBlock | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [loading, setLoading] = useState(Boolean(formId));
  const [error, setError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!formId) return;
    setLoading(true);
    setError(null);
    try {
      const form = await formsService.get(formId);
      setName(form.name);
      setDescription(form.description ?? "");
      setStatus(form.status);
      setStructure(form.structure);
      setSettings(form.settings ?? {});
    } catch {
      setError(
        "Form yüklenemedi. Erişiminizi ve bağlantınızı kontrol edip yeniden deneyin.",
      );
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const allBlocks = useMemo(
    () =>
      structure.rows.flatMap((row) =>
        row.columns.flatMap((column) => column.blocks),
      ),
    [structure.rows],
  );
  const fieldBlocks = useMemo(
    () =>
      allBlocks.filter((block) =>
        ["input", "textarea", "select", "radio"].includes(block.type),
      ),
    [allBlocks],
  );

  const updateSelectedBlock = (updatedBlock: BuilderBlock) => {
    setStructure((current) => ({
      ...current,
      rows: current.rows.map((row) => ({
        ...row,
        columns: row.columns.map((column) => ({
          ...column,
          blocks: column.blocks.map((block) =>
            block.id === updatedBlock.id ? updatedBlock : block,
          ),
        })),
      })),
    }));
    setSelectedBlock(updatedBlock);
  };

  const persist = async (nextStatus: FormStatus = status) => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Form adı zorunludur");
      return;
    }
    if (formId && status === "published") {
      if (nextStatus === "draft") {
        setSavingAction("draft");
        try {
          const saved = await formsService.unpublish(formId);
          setStatus(saved.status);
          toast.success("Form yayından kaldırıldı; artık düzenleyebilirsiniz");
        } catch {
          toast.error("Form yayından kaldırılamadı");
        } finally {
          setSavingAction(null);
        }
        return;
      }
      toast.error("Yayındaki formu değiştirmek için önce yayından kaldırın");
      return;
    }

    setSavingAction(nextStatus);
    try {
      const input = {
        name: cleanName,
        description: description.trim() || undefined,
        structure,
        settings: {
          ...settings,
          theme: structure.settings.theme,
          submitButtonText: structure.settings.submitButtonText,
        },
      };
      let saved = formId
        ? await formsService.update(formId, input)
        : await formsService.create(input);
      if (!formId) router.replace(`/${tenantId}/admin/forms/${saved.id}`);
      if (nextStatus === "published") {
        saved = await formsService.publish(saved.id);
      }
      setStatus(saved.status);
      toast.success(
        nextStatus === "published" ? "Form yayınlandı" : "Form kaydedildi",
      );
    } catch {
      toast.error("Form kaydedilemedi. Değişiklikleriniz ekranda korunuyor.");
    } finally {
      setSavingAction(null);
    }
  };

  const archive = async () => {
    if (!formId || !window.confirm("Bu form arşivlensin mi?")) return;
    setSavingAction("archived");
    try {
      await formsService.archive(formId);
      toast.success("Form arşivlendi");
      router.push(`/${tenantId}/admin/forms`);
    } catch {
      toast.error("Form arşivlenemedi");
      setSavingAction(null);
    }
  };

  if (loading) {
    return (
      <BccEditorialWrapper
        theme="tenant-admin"
        headerTitle={formId ? "Formu Düzenle" : "Yeni Form"}
        headerSubtitle="Form düzenleyici yükleniyor."
      >
        <FormLoadingState label="Form düzenleyici yükleniyor" />
      </BccEditorialWrapper>
    );
  }
  if (error) {
    return (
      <BccEditorialWrapper
        theme="tenant-admin"
        headerTitle={formId ? "Formu Düzenle" : "Yeni Form"}
        headerSubtitle="Form düzenleyici yüklenemedi."
      >
        <FormErrorState message={error} onRetry={() => void load()} />
      </BccEditorialWrapper>
    );
  }

  const moduleNav = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div
        className="hidden rounded-lg border border-white/10 bg-white/5 p-1 sm:flex"
        aria-label="Önizleme boyutu"
      >
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={previewMode === "desktop"}
          onClick={() => setPreviewMode("desktop")}
          className={
            previewMode === "desktop"
              ? "bg-[#ff8c00] text-black"
              : "text-white/50"
          }
        >
          <Monitor className="mr-2 h-4 w-4" /> Masaüstü
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={previewMode === "mobile"}
          onClick={() => setPreviewMode("mobile")}
          className={
            previewMode === "mobile"
              ? "bg-[#ff8c00] text-black"
              : "text-white/50"
          }
        >
          <Smartphone className="mr-2 h-4 w-4" /> Mobil
        </Button>
      </div>
      <Button
        variant="outline"
        disabled={Boolean(savingAction)}
        onClick={() => void persist(status === "archived" ? "draft" : status)}
      >
        <Save className="mr-2 h-4 w-4" /> Kaydet
      </Button>
      {status === "published" ? (
        <Button
          disabled={Boolean(savingAction)}
          onClick={() => void persist("draft")}
        >
          Yayından kaldır
        </Button>
      ) : (
        <Button
          disabled={Boolean(savingAction)}
          onClick={() => void persist("published")}
          className="bg-[#ff8c00] text-black hover:bg-[#ff8c00]/90"
        >
          <Send className="mr-2 h-4 w-4" /> Yayınla
        </Button>
      )}
      {formId && (
        <Button
          variant="ghost"
          disabled={Boolean(savingAction)}
          onClick={() => void archive()}
          className="text-red-400 hover:text-red-300"
        >
          <Archive className="mr-2 h-4 w-4" /> Arşivle
        </Button>
      )}
    </div>
  );

  return (
    <BccEditorialWrapper
      theme="tenant-admin"
      headerTitle={formId ? "Formu Düzenle" : "Yeni Form"}
      headerSubtitle="Alanları düzenleyin, kaydedin ve hazır olduğunda yayınlayın."
      headerBadge={status.toLocaleUpperCase("tr-TR")}
      moduleNav={moduleNav}
    >
      <div className="mb-6 rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Link
            href={`/${tenantId}/admin/forms`}
            aria-label="Form listesine dön"
          >
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
            <div>
              <label
                htmlFor="form-name"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50"
              >
                Form adı
              </label>
              <Input
                id="form-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                className="border-white/10 bg-black/30 text-white"
              />
            </div>
            <div>
              <label
                htmlFor="form-description"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50"
              >
                Açıklama
              </label>
              <Textarea
                id="form-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                rows={2}
                className="min-h-10 border-white/10 bg-black/30 text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-white/5 bg-[#0c0c0c] p-4 sm:p-6 lg:grid-cols-2">
        <div>
          <label
            htmlFor="form-success"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50"
          >
            Başarı mesajı
          </label>
          <Input
            id="form-success"
            value={settings.successMessage ?? ""}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                successMessage: event.target.value,
              }))
            }
            maxLength={500}
            placeholder="Yanıtınız alındı."
            className="border-white/10 bg-black/30 text-white"
          />
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 p-4">
          <label className="flex items-center gap-3 text-sm font-medium text-white">
            <input
              type="checkbox"
              checked={settings.crmLeadCapture?.enabled === true}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  crmLeadCapture: {
                    ...current.crmLeadCapture,
                    enabled: event.target.checked,
                  },
                }))
              }
              className="h-4 w-4 accent-[#ff8c00]"
            />
            Gönderimleri CRM adayı olarak kaydet
          </label>
          {settings.crmLeadCapture?.enabled && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["emailField", "E-posta alanı"],
                  ["phoneField", "Telefon alanı"],
                  ["contactNameField", "İlgili kişi alanı"],
                  ["companyField", "Şirket alanı"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-xs text-white/50">
                  {label}
                  <select
                    value={settings.crmLeadCapture?.[key] ?? ""}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        crmLeadCapture: {
                          enabled: true,
                          ...current.crmLeadCapture,
                          [key]: event.target.value || undefined,
                        },
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-sm text-white"
                  >
                    <option value="">Otomatik algıla</option>
                    {fieldBlocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {String(
                          block.properties.label ?? block.label ?? block.id,
                        )}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-[680px] overflow-hidden rounded-2xl border border-white/5 bg-[#050505]">
        <div className="hidden lg:block">
          <FormBlockSidebar />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-8">
          <FormBuilderCanvas
            structure={structure as BuilderStructure}
            onStructureChange={(next) => setStructure(next as FormStructure)}
            selectedBlock={selectedBlock}
            onBlockSelect={setSelectedBlock}
            previewMode={previewMode}
          />
        </main>
        <div className="hidden xl:block">
          <FormPropertiesSidebar
            selectedBlock={selectedBlock}
            onUpdateBlock={updateSelectedBlock}
            allBlocks={allBlocks as BuilderBlock[]}
            logicConfig={
              structure.logicConfig as BuilderStructure["logicConfig"]
            }
            onUpdateLogic={(logicConfig) =>
              setStructure((current) => ({ ...current, logicConfig }))
            }
          />
        </div>
      </div>
    </BccEditorialWrapper>
  );
}
