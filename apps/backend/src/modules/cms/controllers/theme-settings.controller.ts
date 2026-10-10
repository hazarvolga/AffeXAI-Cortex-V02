import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ThemeSettingsService } from '../services/theme-settings.service';
import { CreateThemeSettingsDto, UpdateThemeSettingsDto } from '../dto/theme-settings.dto';

@Controller('cms/theme-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ThemeSettingsController {
  constructor(private readonly themeSettingsService: ThemeSettingsService) { }

  /**
   * Get active theme settings (public endpoint - no auth required)
   */
  @Public()
  @Get('active')
  async getActiveTheme() {
    return await this.themeSettingsService.getActiveTheme();
  }

  /**
   * Get all theme settings
   * @requires Admin role
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return await this.themeSettingsService.findAll();
  }

  /**
   * Get theme settings by ID
   * @requires Admin role
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return await this.themeSettingsService.findOne(id);
  }

  /**
   * Create new theme settings
   * @requires Admin role
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createDto: CreateThemeSettingsDto,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    return await this.themeSettingsService.create(createDto, userId);
  }

  /**
   * Update theme settings
   * @requires Admin role
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateThemeSettingsDto,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    return await this.themeSettingsService.update(id, updateDto, userId);
  }

  /**
   * Activate a theme (deactivates all others)
   * @requires Admin role
   */
  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async activateTheme(@Param('id') id: string) {
    return await this.themeSettingsService.activateTheme(id);
  }

  /**
   * Delete theme settings
   * @requires Admin role
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.themeSettingsService.delete(id);
  }
}
