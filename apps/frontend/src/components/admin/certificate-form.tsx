"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Save,
  FileText,
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import certificatesService from "@/lib/api/certificatesService";
import type {
  Certificate,
  CertificateTemplate,
} from "@/lib/api/certificatesService";
import { mediaService } from "@/lib/api/mediaService";
import type { Media } from "@/lib/api/mediaService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { siteSettingsData } from "@/lib/site-settings-data";
import { SiteSettings } from "@affexai/shared-types";

type CertificateFormProps = {
  certificate?: Certificate;
};

export function CertificateForm({ certificate }: CertificateFormProps) {
  const isEditing = !!certificate;
  const searchParams = useSearchParams();
  const router = useRouter();

  // Helper function to get company name from site settings
  const getCompanyName = () => {
    return siteSettingsData.companyName || "XYZ Company";
  };

  // Helper function to generate default description
  const generateDefaultDescription = (programName: string) => {
    const companyName = getCompanyName();
    return `${programName} eğitimini başarıyla tamamladınız.
Gösterdiğiniz özveri, ilgi ve öğrenme isteğiniz için teşekkür ederiz.

Bu sertifika, eğitim sürecinde edindiğiniz bilgi ve yetkinliklerin bir göstergesidir.
${companyName} olarak, sürekli gelişim yolculuğunuzda yanınızda olmaktan memnuniyet duyuyoruz.

Başarılarınızın devamını diler, gelecekteki çalışmalarınızda üstün başarılar temenni ederiz.

Saygılarımızla,
${companyName}`;
  };

  const [issuedAt, setIssuedAt] = useState<Date | undefined>(
    certificate ? new Date(certificate.issueDate) : new Date(),
  );
  const [validUntil, setValidUntil] = useState<Date | undefined>(
    certificate?.expiryDate ? new Date(certificate.expiryDate) : undefined,
  );

  const [recipientName, setRecipientName] = useState(
    certificate?.recipientName || "",
  );
  const [recipientEmail, setRecipientEmail] = useState(
    certificate?.recipientEmail || "",
  );
  const [certificateName, setCertificateName] = useState(
    certificate?.trainingTitle || certificate?.name || "",
  );

  // Initialize description with default template for new certificates
  const getInitialDescription = () => {
    if (certificate?.description) {
      return certificate.description;
    }
    // For new certificates, generate default description
    const initialName =
      certificate?.trainingTitle ||
      certificate?.name ||
      "[Eğitim Programı Adı]";
    return generateDefaultDescription(initialName);
  };

  const [description, setDescription] = useState(getInitialDescription());
  const [templateId, setTemplateId] = useState(certificate?.templateId || "");
  const [userId, setUserId] = useState(certificate?.userId || "");
  const [logoMediaId, setLogoMediaId] = useState<string | null>(
    certificate?.logoMediaId || null,
  );
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const { toast } = useToast();

  // A new certificate is prefilled from the URL whenever its query changes (adjusted during render).
  const prefillKey = isEditing ? null : searchParams.toString();
  const [appliedPrefill, setAppliedPrefill] = useState<string | null>(null);
  if (prefillKey !== null && prefillKey !== appliedPrefill) {
    setAppliedPrefill(prefillKey);
    setRecipientName(searchParams.get("userName") || "");
    setRecipientEmail(searchParams.get("userEmail") || "");
    const certName = searchParams.get("certificateName") || "";
    setCertificateName(certName);

    // Auto-generate description if certificate name is provided and description is empty
    if (certName && !description) {
      setDescription(generateDefaultDescription(certName));
    }
  }

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await certificatesService.getTemplates();
        setTemplates(data);
        // Set first template as default if no template selected
        if (!templateId && data.length > 0) {
          setTemplateId(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [templateId]);

  // Load logo preview if logoMediaId exists
  useEffect(() => {
    const loadLogoPreview = async () => {
      if (logoMediaId) {
        try {
          const url = await mediaService.getMediaUrl(logoMediaId);
          setLogoPreviewUrl(url);
        } catch (err) {
          console.error("Error loading logo preview:", err);
        }
      }
    };

    loadLogoPreview();
  }, [logoMediaId]);

  // Load media library when dialog opens
  useEffect(() => {
    const loadMediaLibrary = async () => {
      if (showMediaLibrary) {
        setLoadingMedia(true);
        try {
          const media = await mediaService.getAll();
          setMediaItems(media);
        } catch (err) {
          console.error("Error loading media:", err);
          toast({
            title: "Hata",
            description: "Media kütüphanesi yüklenirken bir hata oluştu",
            variant: "destructive",
          });
        } finally {
          setLoadingMedia(false);
        }
      }
    };

    loadMediaLibrary();
  }, [showMediaLibrary, toast]);

  const handleOpenMediaLibrary = () => {
    setShowMediaLibrary(true);
  };

  const handleSelectMedia = async (media: Media) => {
    setLogoMediaId(media.id);
    const url = await mediaService.getMediaUrl(media.id);
    setLogoPreviewUrl(url);
    setShowMediaLibrary(false);
    toast({
      title: "Başarılı",
      description: "Logo seçildi",
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Hata",
        description: "Lütfen sadece resim dosyası yükleyin",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingLogo(true);

      const media = await mediaService.uploadFile(file);
      setLogoMediaId(media.id);

      const url = await mediaService.getMediaUrl(media.id);
      setLogoPreviewUrl(url);

      // Refresh media library
      const updatedMedia = await mediaService.getAll();
      setMediaItems(updatedMedia);

      toast({
        title: "Başarılı",
        description: "Logo yüklendi",
      });
    } catch (err) {
      console.error("Logo upload error:", err);
      toast({
        title: "Hata",
        description: "Logo yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemoveLogo = () => {
    setLogoMediaId(null);
    setLogoPreviewUrl(null);
    toast({
      title: "Başarılı",
      description: "Logo kaldırıldı",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const certificateData = {
        recipientName,
        recipientEmail,
        trainingTitle: certificateName,
        description: description || undefined, // Send undefined instead of empty string
        templateId,
        issuedAt: issuedAt?.toISOString() || new Date().toISOString(),
        validUntil: validUntil?.toISOString() || null,
        userId: userId || undefined,
        logoMediaId: logoMediaId || undefined, // Add logo media ID
      };

      if (isEditing && certificate) {
        // Update existing certificate
        await certificatesService.update(certificate.id, certificateData);
      } else {
        // Create new certificate
        await certificatesService.create(certificateData);
      }

      setSuccess(true);
      // Redirect to certificates list after a short delay
      setTimeout(() => {
        router.push("/admin/certificates");
      }, 1500);
    } catch (err) {
      console.error("Error saving certificate:", err);
      setError(
        "Sertifika kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="max-w-4xl mx-auto" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Sertifikayı Düzenle" : "Yeni Sertifika Oluştur"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Sertifika detaylarını güncelleyin."
              : "Yeni bir katılımcı için sertifika oluşturun."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="border-green-500 text-green-700"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Başarılı</AlertTitle>
              <AlertDescription>
                Sertifika başarıyla kaydedildi. Yönlendiriliyorsunuz...
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Alıcı Adı Soyadı</Label>
              <Input
                id="recipientName"
                placeholder="Ahmet Yılmaz"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Alıcı E-posta</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="ahmet.yilmaz@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="certificateName">Sertifika / Eğitim Adı</Label>
            <Input
              id="certificateName"
              placeholder="XYZ Suite Temel Eğitimi"
              value={certificateName}
              onChange={(e) => {
                const newName = e.target.value;
                setCertificateName(newName);
                // Update description when name changes (only if not editing existing certificate)
                if (!isEditing && newName) {
                  setDescription(generateDefaultDescription(newName));
                }
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
            <Textarea
              id="description"
              placeholder="Sertifika hakkında ek bilgiler..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
            />
            <p className="text-xs text-gray-500">
              Bu metin sertifika PDF&apos;inde kullanılacaktır. Kullanıcı isteğe
              göre düzenleyebilir.
            </p>
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="certificateLogo">
              Sertifika Logosu (Opsiyonel)
            </Label>
            <div className="flex items-start gap-4">
              {/* Preview Area */}
              {logoPreviewUrl ? (
                <div className="relative group">
                  <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={logoPreviewUrl}
                      alt="Sertifika Logosu"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}

              {/* Select Button */}
              <div className="flex-1 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenMediaLibrary}
                  className="w-full"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {logoPreviewUrl ? "Logoyu Değiştir" : "Logo Seç"}
                </Button>
                <p className="text-xs text-gray-500">
                  Bu logo sertifika tasarımında ürün/konu logosu olarak
                  kullanılacaktır.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Sertifika Tasarımı</Label>
            <Select
              value={templateId}
              onValueChange={setTemplateId}
              disabled={loadingTemplates}
            >
              <SelectTrigger id="template">
                <SelectValue
                  placeholder={
                    loadingTemplates ? "Yükleniyor..." : "Bir tasarım seçin"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
                {templates.length === 0 && !loadingTemplates && (
                  <SelectItem value="none" disabled>
                    Tasarım bulunamadı
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Oluşturulma Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {issuedAt ? (
                      format(issuedAt, "PPP")
                    ) : (
                      <span>Bir tarih seçin</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={issuedAt}
                    onSelect={setIssuedAt}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Geçerlilik Tarihi (Opsiyonel)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validUntil ? (
                      format(validUntil, "PPP")
                    ) : (
                      <span>Süresiz</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validUntil}
                    onSelect={setValidUntil}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {!isEditing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bilgi</AlertTitle>
              <AlertDescription>
                Sertifika oluşturulduktan sonra alıcıya e-posta ile
                gönderilecektir. Ayrıca sertifikayı PDF olarak indirebilirsiniz.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" asChild type="button">
            <Link href="/admin/certificates">İptal</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <FileText className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Sertifikayı Güncelle" : "Sertifikayı Oluştur"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Media Library Dialog */}
      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Media Kütüphanesi</DialogTitle>
            <DialogDescription>
              Mevcut bir logo seçin veya yeni bir logo yükleyin
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Upload Section */}
            <div className="mb-4 p-4 border-2 border-dashed rounded-lg bg-gray-50">
              <Input
                id="mediaLibraryUpload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              <Label htmlFor="mediaLibraryUpload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingLogo}
                  className="cursor-pointer w-full"
                  asChild
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingLogo ? "Yükleniyor..." : "Yeni Logo Yükle"}
                  </span>
                </Button>
              </Label>
            </div>

            {/* Media Grid */}
            {loadingMedia ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Medya yükleniyor...</p>
                </div>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">Henüz medya bulunamadı</p>
                <p className="text-sm text-gray-400 mt-1">
                  Yukarıdan yeni bir logo yükleyin
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaItems.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => handleSelectMedia(media)}
                    className={`relative group aspect-square border-2 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer ${
                      logoMediaId === media.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={media.url}
                      alt={media.originalName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    {logoMediaId === media.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
