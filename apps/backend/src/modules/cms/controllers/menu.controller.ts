import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { MenuService } from '../services/menu.service';
import { CreateCmsMenuDto } from '../dto/create-menu.dto';
import { UpdateCmsMenuDto } from '../dto/update-menu.dto';
import { CreateCmsMenuItemDto } from '../dto/create-menu-item.dto';
import { UpdateCmsMenuItemDto } from '../dto/update-menu-item.dto';
import { ReorderMenuItemsDto } from '../dto/reorder-menu-items.dto';
import { MenuLocation } from '@affexai/shared-types';

@Controller('cms/menus')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  // ==========================================================================
  // Menu Endpoints
  // ==========================================================================

  @Post()
  async createMenu(@Body() createDto: CreateCmsMenuDto) {
    return this.menuService.createMenu(createDto);
  }

  @Get()
  async findAllMenus(
    @Query('location') location?: MenuLocation,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const params: any = {};

    if (location) {
      params.location = location;
    }

    if (isActive !== undefined) {
      params.isActive = isActive === 'true';
    }

    if (search) {
      params.search = search;
    }

    return this.menuService.findAllMenus(params);
  }

  @Get(':id')
  async findOneMenu(@Param('id') id: string) {
    return this.menuService.findOneMenu(id);
  }

  @Get('slug/:slug')
  async findMenuBySlug(@Param('slug') slug: string) {
    return this.menuService.findMenuBySlug(slug);
  }

  @Patch(':id')
  async updateMenu(
    @Param('id') id: string,
    @Body() updateDto: UpdateCmsMenuDto,
  ) {
    return this.menuService.updateMenu(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMenu(@Param('id') id: string) {
    await this.menuService.removeMenu(id);
  }

  // ==========================================================================
  // Menu Item Endpoints
  // ==========================================================================

  @Post('items')
  async createMenuItem(@Body() createDto: CreateCmsMenuItemDto) {
    return this.menuService.createMenuItem(createDto);
  }

  @Get(':menuId/items')
  async findMenuItems(@Param('menuId') menuId: string) {
    return this.menuService.findMenuItems(menuId);
  }

  @Get(':menuId/items/tree')
  async getMenuItemTree(@Param('menuId') menuId: string) {
    return this.menuService.getMenuItemTree(menuId);
  }

  @Get('items/:id')
  async findOneMenuItem(@Param('id') id: string) {
    return this.menuService.findOneMenuItem(id);
  }

  @Patch('items/:id')
  async updateMenuItem(
    @Param('id') id: string,
    @Body() updateDto: UpdateCmsMenuItemDto,
  ) {
    return this.menuService.updateMenuItem(id, updateDto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMenuItem(@Param('id') id: string) {
    await this.menuService.removeMenuItem(id);
  }

  @Post(':menuId/items/batch-update')
  @HttpCode(HttpStatus.OK)
  async batchUpdateMenuItems(
    @Param('menuId') menuId: string,
    @Body() updates: Array<{ id: string; parentId: string | null; orderIndex: number }>,
  ) {
    await this.menuService.batchUpdateMenuItems(menuId, updates);
    return { message: 'Menu items updated successfully' };
  }

  @Post('items/reorder')
  @HttpCode(HttpStatus.OK)
  async reorderMenuItems(@Body() dto: ReorderMenuItemsDto) {
    await this.menuService.reorderMenuItems(dto);
    return { message: 'Menu items reordered successfully' };
  }
}
