"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { canWriteInternalNote, safeTicketHtml } from "../ticket-presentation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
  User,
  Tag,
  Send,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { fileUploadService } from "@/lib/api/fileUploadService";
import { httpClient } from "@/lib/api/http-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Types
interface TicketMessage {
  id: string;
  content: string;
  isInternal: boolean;
  attachmentIds?: string[];
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  notificationWarnings?: string[];
  status: string;
  priority: string;
  userId: string;
  assignedToId: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  messages: TicketMessage[];
}

// Fetch functions
async function fetchTicket(ticketId: string): Promise<Ticket> {
  return httpClient.getWrapped<Ticket>(`/tickets/${ticketId}`);
}

async function addMessage(
  ticketId: string,
  content: string,
  isInternal: boolean,
) {
  const response = await httpClient.postWrapped<TicketMessage>(
    `/tickets/${ticketId}/messages`,
    {
      content,
      isInternal,
    },
  );
  return response;
}

async function updateStatus(ticketId: string, status: string) {
  const response = await httpClient.patchWrapped<Ticket>(
    `/tickets/${ticketId}/status`,
    { status },
  );
  return response;
}

// Status & Priority mappings
const getStatusBadge = (status: string) => {
  const statusMap: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    new: { label: "Yeni", variant: "default" },
    open: { label: "Açık", variant: "secondary" },
    in_progress: { label: "İşlemde", variant: "outline" },
    resolved: { label: "Çözüldü", variant: "default" },
    closed: { label: "Kapatıldı", variant: "outline" },
  };
  return statusMap[status] || { label: status, variant: "outline" };
};

const getPriorityBadge = (priority: string) => {
  const priorityMap: Record<string, { label: string; className: string }> = {
    low: {
      label: "Düşük",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    medium: {
      label: "Orta",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    high: {
      label: "Yüksek",
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    },
    urgent: {
      label: "Acil",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
  };
  return priorityMap[priority] || { label: priority, className: "" };
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const { user: currentUser } = useAuth();
  const staffNotesAllowed = canWriteInternalNote(currentUser);

  // Fetch ticket
  const {
    data: ticket,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicket(ticketId),
    retry: 1,
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: ({
      content,
      isInternal,
    }: {
      content: string;
      isInternal: boolean;
    }) => addMessage(ticketId, content, isInternal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      setNewMessage("");
      toast({
        title: "Başarılı!",
        description: "Mesajınız gönderildi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: error?.message || "Mesaj gönderilemedi.",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateStatus(ticketId, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast({
        title: "Başarılı!",
        description: updated.notificationWarnings?.length
          ? "Talep durumu güncellendi; e-posta bildirimi gönderilemedi."
          : "Ticket durumu güncellendi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: error?.message || "Durum güncellenemedi.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    addMessageMutation.mutate({
      content: newMessage,
      isInternal: staffNotesAllowed && isInternal,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Ticket yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    // Check if it's an authentication error
    const isAuthError = error && (error as any).status === 401;
    const errorMessage = isAuthError
      ? "Bu ticket'a erişim yetkiniz yok veya oturumunuz sonlanmış. Lütfen tekrar giriş yapın."
      : "Bu destek talebi bulunamadı veya yüklenemedi.";

    return (
      <div className="max-w-2xl mx-auto mt-8 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Destek talebi</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
            <div className="mt-2 flex gap-2">
              {isAuthError ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push("/login")}
                >
                  Giriş Yap
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/portal/support")}
                >
                  Destek taleplerini görüntüle
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusBadge = getStatusBadge(ticket.status);
  const priorityBadge = getPriorityBadge(ticket.priority);

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push("/portal/support")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Destek Taleplerine Dön
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - Messages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {ticket.category && (
                    <Badge variant="outline" className="mb-2">
                      {ticket.category.name}
                    </Badge>
                  )}
                  <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                    {ticket.subject}
                  </h1>
                  <CardDescription className="mt-2">
                    Talep ID: #{ticket.id.substring(0, 8)}
                  </CardDescription>
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </div>
                  <div>
                    <Badge className={priorityBadge.className}>
                      {priorityBadge.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {ticket.user.firstName} {ticket.user.lastName}
                </span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(ticket.createdAt), "dd MMMM yyyy HH:mm", {
                    locale: tr,
                  })}
                </span>
              </div>
              <div
                className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: safeTicketHtml(ticket.description),
                }}
              />
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mesajlar ({ticket.messages?.length || 0})
              </CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              <div className="space-y-4 mb-6">
                {ticket.messages && ticket.messages.length > 0 ? (
                  ticket.messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {message.author
                            ? getInitials(
                                message.author.firstName,
                                message.author.lastName,
                              )
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {message.author
                              ? `${message.author.firstName} ${message.author.lastName}`
                              : "Bilinmeyen Kullanıcı"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(message.createdAt),
                              "dd MMM HH:mm",
                              { locale: tr },
                            )}
                          </span>
                          {message.isInternal && (
                            <Badge variant="outline" className="text-xs">
                              Dahili
                            </Badge>
                          )}
                        </div>
                        <div
                          className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: safeTicketHtml(message.content),
                          }}
                        />
                        {!!message.attachmentIds?.length && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {message.attachmentIds.map((id, index) => (
                              <Button
                                key={id}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const metadata =
                                      await fileUploadService.getFile(id);
                                    const blob =
                                      await fileUploadService.downloadFile(id);
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    link.href = url;
                                    link.download = metadata.originalName;
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    setTimeout(
                                      () => URL.revokeObjectURL(url),
                                      1000,
                                    );
                                  } catch {
                                    toast({
                                      title: "Dosya indirilemedi",
                                      description:
                                        "Erişim izninizi ve bağlantınızı kontrol edin.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Ek {index + 1} indir
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Henüz mesaj yok
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              {/* New Message Form */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Mesajınızı yazın..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  disabled={addMessageMutation.isPending}
                />
                <div className="flex justify-between items-center">
                  {staffNotesAllowed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isInternal"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      <label
                        htmlFor="isInternal"
                        className="text-sm text-muted-foreground"
                      >
                        Dahili not (sadece ekip görür)
                      </label>
                    </div>
                  )}
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      !newMessage.trim() || addMessageMutation.isPending
                    }
                  >
                    {addMessageMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Gönder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Ticket Details */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Durum</p>
                <Badge variant={statusBadge.variant} className="text-sm">
                  {statusBadge.label}
                </Badge>
              </div>

              {/* Çözüldü Onayla Button - Only show when status is resolved */}
              {ticket.status === "resolved" && (
                <div>
                  <Button
                    onClick={() => updateStatusMutation.mutate("closed")}
                    disabled={updateStatusMutation.isPending}
                    className="w-full"
                    variant="default"
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kapatılıyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Çözüldü Onayla
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sorun çözüldüyse bu butona tıklayarak talebi
                    kapatabilirsiniz.
                  </p>
                </div>
              )}

              <Separator />

              {/* Mark as Resolved Button - Show for all open tickets */}
              {ticket.status !== "resolved" &&
                ticket.status !== "closed" &&
                ticket.status !== "cancelled" && (
                  <div>
                    <Button
                      onClick={() => updateStatusMutation.mutate("resolved")}
                      disabled={updateStatusMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                      variant="default"
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          İşleniyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Çözüldü Olarak İşaretle
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Sorununuz çözüldüyse bu butona tıklayarak destek ekibine
                      bildirebilirsiniz.
                    </p>
                  </div>
                )}

              {/* Cancel Ticket Button */}
              {ticket.status !== "cancelled" && ticket.status !== "closed" && (
                <div>
                  <Button
                    onClick={() => updateStatusMutation.mutate("cancelled")}
                    disabled={updateStatusMutation.isPending}
                    className="w-full"
                    variant="destructive"
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        İptal ediliyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        İptal Et
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Artık yardıma ihtiyacınız yoksa talebi iptal edebilirsiniz.
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">Öncelik</p>
                <Badge className={priorityBadge.className}>
                  {priorityBadge.label}
                </Badge>
              </div>

              <Separator />

              {ticket.assignedTo && (
                <div>
                  <p className="text-sm font-medium mb-1">Atanan</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(
                          ticket.assignedTo.firstName,
                          ticket.assignedTo.lastName,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                    </span>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">Oluşturan</p>
                <p className="text-sm text-muted-foreground">
                  {ticket.user.firstName} {ticket.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ticket.user.email}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">Oluşturulma</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(ticket.createdAt), "dd MMMM yyyy HH:mm", {
                    locale: tr,
                  })}
                </p>
              </div>

              {ticket.resolvedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Çözülme</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(ticket.resolvedAt),
                        "dd MMMM yyyy HH:mm",
                        { locale: tr },
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Success Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Destek talebiniz başarıyla oluşturuldu. Ekibimiz en kısa sürede
              size geri dönüş yapacaktır.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
