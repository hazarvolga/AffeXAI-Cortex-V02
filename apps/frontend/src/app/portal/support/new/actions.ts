"use server";

import { z } from "zod";
import { cookies } from "next/headers";

const FormSchema = z.object({
  title: z.string().min(10, "Başlık en az 10 karakter olmalıdır.").max(300),
  problemDescription: z
    .string()
    .min(50, "Lütfen sorununuzu en az 50 karakterle açıklayın.")
    .max(20000),
  category: z.string().uuid("Geçerli bir kategori seçin."),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  attachmentIds: z
    .array(z.string().uuid())
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length),
});

export type FormState = {
  step: 1 | 2;
  message: string;
  creating?: boolean;
  ticketCreated?: boolean;
  ticketId?: string;
  originalInput?: z.infer<typeof FormSchema>;
  data?: { analysisAvailable: boolean; summary: string; priority: string; suggestion: string };
};

export async function analyzeSupportTicket(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  if (formData.get("action") === "back")
    return { step: 1, message: "", originalInput: prevState.originalInput };
  const creating = formData.get("action") === "create_ticket";
  const errorStep = creating ? 2 : 1;
  let attachments: unknown;
  try {
    attachments = JSON.parse(String(formData.get("attachmentIds") || "[]"));
  } catch {
    return {
      ...prevState,
      step: errorStep,
      message: "Dosya bilgileri geçersiz.",
    };
  }
  const parsed = FormSchema.safeParse({
    title: formData.get("title"),
    problemDescription: formData.get("problemDescription"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    attachmentIds: attachments,
  });
  if (!parsed.success)
    return {
      ...prevState,
      step: errorStep,
      message: parsed.error.issues.map((issue) => issue.message).join(", "),
    };
  const input = parsed.data;
  const store = await cookies();
  const token =
    store.get("auth_token")?.value || store.get("aluplan_access_token")?.value;
  if (!token)
    return {
      ...prevState,
      step: errorStep,
      message: "Devam etmek için oturum açın.",
    };
  const configured =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:9006";
  const base = configured.replace(/\/+$/, "").replace(/\/api$/, "");
  const body = creating
    ? {
        subject: input.title,
        description: input.problemDescription,
        priority: input.priority,
        categoryId: input.category,
        attachmentIds: input.attachmentIds,
      }
    : {
        title: input.title,
        problemDescription: input.problemDescription,
        category: input.category,
      };
  try {
    const response = await fetch(
      `${base}/api/tickets${creating ? "" : "/analyze"}`,
      {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok)
      return {
        ...prevState,
        step: errorStep,
        originalInput: input,
        message:
          response.status === 401
            ? "Oturumunuz sona erdi. Yeniden giriş yapın."
            : "İşlem tamamlanamadı. Bilgileri kontrol edip tekrar deneyin.",
      };
    const payload = await response.json();
    const data =
      payload?.success === true &&
      Object.prototype.hasOwnProperty.call(payload, "data")
        ? payload.data
        : payload;
    if (creating) {
      if (typeof data?.id !== "string")
        throw new Error("Invalid ticket response");
      return {
        step: 2,
        message: data.notificationWarnings?.length ? "Destek talebiniz oluşturuldu; e-posta bildirimi gönderilemedi." : "Destek talebiniz başarıyla oluşturuldu!",
        ticketCreated: true,
        ticketId: data.id,
        originalInput: input,
        data: prevState.data,
      };
    }
    if (
      !data ||
      !["summary", "priority", "suggestion"].every(
        (key) => typeof data[key] === "string",
      )
    )
      throw new Error("Invalid analysis response");
    const analysisAvailable = data.analysisAvailable === true;
    return {
      step: 2,
      message: analysisAvailable ? "Analiz başarılı!" : "AI analizi kullanılamıyor. Talebinizi kontrol edip oluşturabilirsiniz.",
      originalInput: input,
      data: analysisAvailable ? { ...data, analysisAvailable: true } : {
        analysisAvailable: false,
        summary: input.title,
        priority: input.priority,
        suggestion: "AI önerisi oluşturulmadı. Seçtiğiniz öncelik korundu; talebinizi destek ekibine gönderebilirsiniz.",
      },
    };
  } catch {
    return {
      ...prevState,
      step: errorStep,
      originalInput: input,
      message: "Destek hizmetine şu anda ulaşılamıyor. Lütfen tekrar deneyin.",
    };
  }
}
