'use server';

import {
  saveSiteSettings as saveTenantSiteSettings,
  type SaveSettingsState,
} from '../../../[tenant]/admin/settings/site/actions';

export type { SaveSettingsState };

export async function saveSiteSettings(
  previousState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  return saveTenantSiteSettings(previousState, formData);
}
