import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './entities/page.entity';
import { Component } from './entities/component.entity';
import { Category } from './entities/category.entity';
import { Menu } from './entities/menu.entity';
import { MenuItem } from './entities/menu-item.entity';
import { CmsMetric } from './entities/cms-metric.entity';
import { PageTemplate } from './entities/page-template.entity';
import { ReusableComponent } from './entities/reusable-component.entity';
import { ReusableSection } from './entities/reusable-section.entity';
import { SectionComponent } from './entities/section-component.entity';
import { ComponentFavorite } from './entities/component-favorite.entity';
import { ComponentUsageHistory } from './entities/component-usage-history.entity';
import { PageService } from './services/page.service';
import { ComponentService } from './services/component.service';
import { CategoryService } from './services/category.service';
import { MenuService } from './services/menu.service';
import { CmsMetricsService } from './services/cms-metrics.service';
import { TemplateService } from './services/template.service';
import { ReusableComponentsService } from './services/reusable-components.service';
import { ReusableSectionsService } from './services/reusable-sections.service';
import { PageController } from './controllers/page.controller';
import { ComponentController } from './controllers/component.controller';
import { CategoryController } from './controllers/category.controller';
import { MenuController } from './controllers/menu.controller';
import { CmsMetricsController } from './controllers/cms-metrics.controller';
import { TemplateController } from './controllers/template.controller';
import { ReusableComponentsController } from './controllers/reusable-components.controller';
import { ReusableSectionsController } from './controllers/reusable-sections.controller';
import { ThemeSettings } from './entities/theme-settings.entity';
import { ThemeSettingsService } from './services/theme-settings.service';
import { ThemeSettingsController } from './controllers/theme-settings.controller';
import { PlatformIntegrationModule } from '../platform-integration/platform-integration.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Page,
      Component,
      Category,
      Menu,
      MenuItem,
      CmsMetric,
      PageTemplate,
      ReusableComponent,
      ReusableSection,
      SectionComponent,
      ComponentFavorite,
      ComponentUsageHistory,
      ThemeSettings,
    ]),
    PlatformIntegrationModule,
    UsersModule,
  ],
  controllers: [
    PageController,
    ComponentController,
    CategoryController,
    MenuController,
    CmsMetricsController,
    TemplateController,
    ReusableComponentsController,
    ReusableSectionsController,
    ThemeSettingsController,
  ],
  providers: [
    PageService,
    ComponentService,
    CategoryService,
    MenuService,
    CmsMetricsService,
    TemplateService,
    ReusableComponentsService,
    ReusableSectionsService,
    ThemeSettingsService,
  ],
  exports: [
    PageService,
    ComponentService,
    CategoryService,
    MenuService,
    CmsMetricsService,
    TemplateService,
    ReusableComponentsService,
    ReusableSectionsService,
    ThemeSettingsService,
  ],
})
export class CmsModule {}