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
} from '@nestjs/common';
import { ComponentService } from '../services/component.service';
import { CreateComponentDto } from '../dto/create-component.dto';
import { UpdateComponentDto } from '../dto/update-component.dto';

import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('cms/components')
@UseGuards(JwtAuthGuard)
export class ComponentController {
  constructor(private readonly componentService: ComponentService) { }

  @Post()
  async create(@Body() createComponentDto: CreateComponentDto) {
    return this.componentService.create(createComponentDto);
  }

  @Get()
  async findAll(@Query('pageId') pageId?: string) {
    return this.componentService.findAll(pageId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.componentService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateComponentDto: UpdateComponentDto) {
    return this.componentService.update(id, updateComponentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.componentService.remove(id);
  }

  @Post('reorder')
  async reorder(@Body() body: { componentIds: string[]; orderIndexes: number[] }) {
    return this.componentService.reorderComponents(body.componentIds, body.orderIndexes);
  }
}