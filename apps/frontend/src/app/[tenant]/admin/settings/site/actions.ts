'use server';

import { revalidatePath } from 'next/cache';

import { httpClient } from '@/lib/api/http-client';
import { parseSiteSettingsForm } from './site-settings-form';

export type SaveSettingsState = {
  message: string;
  success: boolean;
};

function persistedSiteSettingsMatch(
  requested: Record<string, any>,
  persisted: Record<string, any>,
): boolean {
  return (
    persisted.companyName === requested.companyName &&
    persisted.domain === requested.domain &&
    persisted.contact?.email === requested.contact?.email &&
    persisted.seo?.defaultTitle === requested.seo?.defaultTitle
  );
}

export async function saveSiteSettings(
  _prevState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  const parsed = parseSiteSettingsForm(formData);
  if (!parsed.success) {
    return { message: parsed.message, success: false };
  }

  try {
    await httpClient.putWrapped('/settings/site', parsed.data);
    const persisted = await httpClient.getWrapped<Record<string, any>>(
      '/settings/site/admin',
    );
    if (!persistedSiteSettingsMatch(parsed.data, persisted)) {
      return {
        message: 'Ayarlar yazıldı ancak kalıcılık doğrulaması başarısız oldu.',
        success: false,
      };
    }

    revalidatePath('/', 'layout');
    return { message: 'Site ayarları başarıyla kaydedildi.', success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return {
      message: `Ayarlar kaydedilemedi: ${message}`,
      success: false,
    };
  }
}
