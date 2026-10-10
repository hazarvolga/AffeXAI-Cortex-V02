import { httpClient } from '@/lib/api/http-client';

// DTOs matching backend structure
export interface TopBarLink {
  text: string;
  href: string;
  order: number;
  icon?: string;
}

export interface CtaButton {
  show: boolean;
  text: string;
  href: string;
}

export interface AuthLinks {
  showLogin: boolean;
  showSignup: boolean;
  loginText: string;
  signupText: string;
  loginUrl?: string;
  signupUrl?: string;
}

export interface Layout {
  sticky: boolean;
  transparent: boolean;
  shadow: boolean;
}

export interface HeaderConfig {
  topBarLinks?: TopBarLink[];
  ctaButtons?: {
    contact?: CtaButton;
    demo?: CtaButton;
  };
  authLinks?: AuthLinks;
  layout?: Layout;
}

export interface CustomLink {
  name: string;
  href: string;
  order: number;
}

export interface FooterSection {
  title: string;
  menuId?: string;
  customLinks?: CustomLink[];
}

export interface FooterConfig {
  sections?: FooterSection[];
  showLanguageSelector?: boolean;
  languageText?: string;
  copyrightText?: string;
}

export interface ThemeSettings {
  id: string;
  name: string;
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
  headerMenuId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateThemeSettingsDto {
  name: string;
  headerConfig?: HeaderConfig;
  headerMenuId?: string;
  footerConfig?: FooterConfig;
  isActive?: boolean;
}

export interface UpdateThemeSettingsDto {
  name?: string;
  headerConfig?: HeaderConfig;
  headerMenuId?: string;
  footerConfig?: FooterConfig;
  isActive?: boolean;
}

export class ThemeSettingsService {
  /**
   * Get active theme settings (public endpoint - no auth required)
   */
  static async getActiveTheme(): Promise<ThemeSettings> {
    return httpClient.getWrapped<ThemeSettings>('/cms/theme-settings/active');
  }

  /**
   * Get all theme settings (admin only)
   */
  static async getAll(): Promise<ThemeSettings[]> {
    return httpClient.getWrapped<ThemeSettings[]>('/cms/theme-settings');
  }

  /**
   * Get theme settings by ID (admin only)
   */
  static async getById(id: string): Promise<ThemeSettings> {
    return httpClient.getWrapped<ThemeSettings>(`/cms/theme-settings/${id}`);
  }

  /**
   * Create new theme settings (admin only)
   */
  static async create(dto: CreateThemeSettingsDto): Promise<ThemeSettings> {
    return httpClient.postWrapped<ThemeSettings, CreateThemeSettingsDto>(
      '/cms/theme-settings',
      dto
    );
  }

  /**
   * Update theme settings (admin only)
   */
  static async update(id: string, dto: UpdateThemeSettingsDto): Promise<ThemeSettings> {
    return httpClient.patchWrapped<ThemeSettings, UpdateThemeSettingsDto>(
      `/cms/theme-settings/${id}`,
      dto
    );
  }

  /**
   * Activate a theme (admin only)
   */
  static async activate(id: string): Promise<ThemeSettings> {
    return httpClient.postWrapped<ThemeSettings, {}>(
      `/cms/theme-settings/${id}/activate`,
      {}
    );
  }

  /**
   * Delete theme settings (admin only)
   */
  static async delete(id: string): Promise<void> {
    return httpClient.deleteWrapped<void>(`/cms/theme-settings/${id}`);
  }
}
