import { DataSource } from 'typeorm';
import { ThemeSettings } from '../../../modules/cms/entities/theme-settings.entity';

export async function seedThemeSettings(dataSource: DataSource) {
  const themeSettingsRepo = dataSource.getRepository(ThemeSettings);

  // Check if theme settings already exist
  const existingTheme = await themeSettingsRepo.findOne({
    where: { isActive: true },
  });

  if (existingTheme) {
    console.log('✅ Active theme settings already exist');
    return;
  }

  // Create default theme settings
  const defaultTheme = themeSettingsRepo.create({
    name: 'Default Theme',
    isActive: true,
    headerMenuId: null, // No menu selected by default
    headerConfig: {
      topBarLinks: [],
      ctaButtons: {
        contact: {
          show: true,
          text: 'İletişim',
          href: '/contact',
        },
        demo: {
          show: true,
          text: 'Demo İste',
          href: '#demo',
        },
      },
      authLinks: {
        showLogin: true,
        showSignup: true,
        loginText: 'Giriş',
        signupText: 'Kayıt Ol',
      },
      layout: {
        sticky: true,
        transparent: false,
        shadow: true,
      },
    },
    footerConfig: {
      sections: [],
      showLanguageSelector: true,
      languageText: 'Dil',
      copyrightText: `© ${new Date().getFullYear()} Affexai. Tüm hakları saklıdır.`,
    },
  });

  await themeSettingsRepo.save(defaultTheme);
  console.log('✅ Default theme settings created successfully');
}
