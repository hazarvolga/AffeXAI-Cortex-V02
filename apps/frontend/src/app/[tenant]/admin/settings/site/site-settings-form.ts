import { z } from 'zod';

const settingsSchema = z.object({
  companyName: z.string().trim().min(1, 'Şirket adı boş olamaz.'),
  domain: z.string().trim().min(1, 'Domain boş olamaz.'),
  logoUrl: z.string().trim(),
  logoDarkUrl: z.string().trim(),
  address: z.string().trim(),
  phone: z.string().trim(),
  email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
  defaultTitle: z.string().trim().min(1, 'Site başlığı boş olamaz.'),
  defaultDescription: z.string().trim(),
  radarCycle: z.enum(['weekly', 'bi-weekly', 'monthly', 'daily']),
});

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function parseStringArray(value: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
      return null;
    }
    return parsed.map((item) => item.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

export type SiteSettingsFormResult =
  | { success: true; data: Record<string, any> }
  | { success: false; message: string };

export function parseSiteSettingsForm(formData: FormData): SiteSettingsFormResult {
  const validated = settingsSchema.safeParse({
    companyName: readString(formData, 'companyName'),
    domain: readString(formData, 'domain'),
    logoUrl: readString(formData, 'logoUrl'),
    logoDarkUrl: readString(formData, 'logoDarkUrl'),
    address: readString(formData, 'address'),
    phone: readString(formData, 'phone'),
    email: readString(formData, 'email'),
    defaultTitle: readString(formData, 'defaultTitle'),
    defaultDescription: readString(formData, 'defaultDescription'),
    radarCycle: readString(formData, 'radarCycle') || 'weekly',
  });

  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || 'Form verileri geçersiz.',
    };
  }

  const competitors = parseStringArray(readString(formData, 'radarCompetitors'));
  const keywords = parseStringArray(readString(formData, 'radarKeywords'));
  if (!competitors || !keywords) {
    return {
      success: false,
      message: 'Rakip ve anahtar kelime listeleri geçerli JSON dizileri olmalıdır.',
    };
  }

  const socialMedia = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key, value]) => key.startsWith('social-') && typeof value === 'string')
      .map(([key, value]) => [key.slice('social-'.length), String(value).trim()])
      .filter(([, value]) => value.length > 0),
  );
  const radarEnabled = formData.get('radarEnabled') === 'on';

  return {
    success: true,
    data: {
      companyName: validated.data.companyName,
      domain: validated.data.domain,
      logoUrl: validated.data.logoUrl || undefined,
      logoDarkUrl: validated.data.logoDarkUrl || undefined,
      contact: {
        address: validated.data.address,
        phone: validated.data.phone,
        email: validated.data.email,
      },
      socialMedia,
      seo: {
        defaultTitle: validated.data.defaultTitle,
        defaultDescription: validated.data.defaultDescription,
      },
      strategicRadar: {
        competitors: { enabled: radarEnabled, urls: competitors },
        focusPulse: { enabled: radarEnabled, keywords },
        reportingCycle: validated.data.radarCycle,
      },
    },
  };
}
