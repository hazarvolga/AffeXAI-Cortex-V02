import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThemeSettings } from '../entities/theme-settings.entity';
import { CreateThemeSettingsDto, UpdateThemeSettingsDto } from '../dto/theme-settings.dto';
import { TenantService } from '../../../core/tenant/tenant.service';

@Injectable()
export class ThemeSettingsService {
  constructor(
    @InjectRepository(ThemeSettings)
    private readonly themeSettingsRepository: Repository<ThemeSettings>,
    private readonly tenantService: TenantService,
  ) { }

  private get tenantId(): string {
    return this.tenantService.getTenantId();
  }

  /**
   * Get active theme settings
   * Returns the currently active theme for the tenant or creates default if none exists
   */
  async getActiveTheme(): Promise<ThemeSettings> {
    let activeTheme = await this.themeSettingsRepository.findOne({
      where: { isActive: true, tenantId: this.tenantId },
      relations: ['headerMenu', 'headerMenu.items'],
    });

    // If no active theme exists, create a default one
    if (!activeTheme) {
      activeTheme = await this.createDefaultTheme();
    }

    return activeTheme;
  }

  /**
   * Get all theme settings
   */
  async findAll(): Promise<ThemeSettings[]> {
    return await this.themeSettingsRepository.find({
      where: { tenantId: this.tenantId },
      relations: ['headerMenu'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get theme settings by ID
   */
  async findOne(id: string): Promise<ThemeSettings> {
    const theme = await this.themeSettingsRepository.findOne({
      where: { id, tenantId: this.tenantId },
      relations: ['headerMenu', 'headerMenu.items'],
    });

    if (!theme) {
      throw new NotFoundException(`Theme settings with ID "${id}" not found`);
    }

    return theme;
  }

  /**
   * Create new theme settings
   */
  async create(
    createDto: CreateThemeSettingsDto,
    userId?: number,
  ): Promise<ThemeSettings> {
    // If marking as active, deactivate all other themes
    if (createDto.isActive) {
      await this.deactivateAllThemes();
    }

    const theme = this.themeSettingsRepository.create({
      ...createDto,
      createdById: userId,
      updatedById: userId,
      tenantId: this.tenantId,
    });

    return await this.themeSettingsRepository.save(theme);
  }

  /**
   * Update theme settings
   */
  async update(
    id: string,
    updateDto: UpdateThemeSettingsDto,
    userId?: number,
  ): Promise<ThemeSettings> {
    const theme = await this.findOne(id);

    // If marking as active, deactivate all other themes
    if (updateDto.isActive && !theme.isActive) {
      await this.deactivateAllThemes();
    }

    Object.assign(theme, updateDto);
    theme.updatedById = userId;
    theme.updatedAt = new Date();

    return await this.themeSettingsRepository.save(theme);
  }

  /**
   * Delete theme settings
   */
  async delete(id: string): Promise<void> {
    const theme = await this.findOne(id);

    if (theme.isActive) {
      throw new BadRequestException('Cannot delete active theme. Please activate another theme first.');
    }

    await this.themeSettingsRepository.remove(theme);
  }

  /**
   * Activate a theme
   */
  async activateTheme(id: string): Promise<ThemeSettings> {
    const theme = await this.findOne(id);

    // Deactivate all themes
    await this.deactivateAllThemes();

    // Activate this theme
    theme.isActive = true;
    return await this.themeSettingsRepository.save(theme);
  }

  /**
   * Deactivate all themes (private helper)
   */
  private async deactivateAllThemes(): Promise<void> {
    await this.themeSettingsRepository.update(
      { isActive: true, tenantId: this.tenantId },
      { isActive: false },
    );
  }

  /**
   * Create default theme settings
   */
  private async createDefaultTheme(): Promise<ThemeSettings> {
    const defaultTheme = this.themeSettingsRepository.create({
      name: 'Default Theme',
      headerConfig: {
        topBarLinks: [
          { text: 'Yardım Merkezi', href: '/help', order: 1 },
          { text: 'ALLPLAN FAQ', href: '/downloads#faq', order: 2 },
          { text: 'LEARN NOW', href: '/education/training', order: 3 },
          { text: 'Duyurular', href: '#', order: 4 },
          { text: 'Microsoft Teams', href: '/downloads#remote', order: 5 },
          { text: 'Product Lifecycle', href: '#', order: 6 },
          { text: 'Allplan Connect: Login', href: '/downloads#customer', order: 7 },
          { text: 'Allplan Connect License', href: '/downloads#license', order: 8 },
        ],
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
          loginText: 'Giriş Yap',
          signupText: 'Kayıt Ol',
        },
        layout: {
          sticky: true,
          transparent: false,
          shadow: true,
        },
      },
      footerConfig: {
        sections: [
          {
            title: 'Keşfet',
            customLinks: [
              { name: 'Çözümler', href: '/solutions', order: 1 },
              { name: 'Ürünler', href: '/products', order: 2 },
              { name: 'Başarı Hikayeleri', href: '/case-studies', order: 3 },
            ],
          },
          {
            title: 'Destek',
            customLinks: [
              { name: 'Eğitim & Destek', href: '/education', order: 1 },
              { name: 'İndirme Merkezi', href: '/downloads', order: 2 },
              { name: 'İletişim', href: '/contact', order: 3 },
            ],
          },
          {
            title: 'Yasal',
            customLinks: [
              { name: 'Gizlilik Politikası', href: '/privacy', order: 1 },
              { name: 'Kullanım Koşulları', href: '/terms', order: 2 },
            ],
          },
        ],
        showLanguageSelector: true,
        languageText: 'Türkiye (Türkçe)',
        copyrightText: 'Tüm hakları saklıdır.',
      },
      isActive: true,
      tenantId: this.tenantId,
    });

    return await this.themeSettingsRepository.save(defaultTheme);
  }
}
