import { PermissionsGuard } from '../../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../core/auth/decorators/permissions.decorator';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { CustomFieldService } from '../services/custom-field.service';
import type { CreateCustomFieldDto, UpdateCustomFieldDto } from '../services/custom-field.service';

@ApiTags('Custom Fields')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@Controller('email-marketing/custom-fields')
export class CustomFieldController {
  constructor(private readonly customFieldService: CustomFieldService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new custom field' })
  @ApiResponse({ status: 201, description: 'Custom field created successfully' })
  async create(@Body() createDto: CreateCustomFieldDto) {
    const field = await this.customFieldService.create(createDto);
    return {
      success: true,
      message: 'Custom field created successfully',
      data: field
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all custom fields' })
  @ApiResponse({ status: 200, description: 'Custom fields retrieved successfully' })
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const fields = await this.customFieldService.findAll(activeOnly === 'true');
    return {
      success: true,
      data: fields
    };
  }

  @Get('mapping-options')
  @ApiOperation({ summary: 'Get fields available for column mapping' })
  @ApiResponse({ status: 200, description: 'Mapping options retrieved successfully' })
  async getMappingOptions() {
    console.log('🔐 CustomFieldController: mapping-options endpoint called');
    const fields = await this.customFieldService.getFieldsForMapping();
    return {
      success: true,
      data: fields
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a custom field by ID' })
  @ApiResponse({ status: 200, description: 'Custom field retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const field = await this.customFieldService.findOne(id);
    return {
      success: true,
      data: field
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a custom field' })
  @ApiResponse({ status: 200, description: 'Custom field updated successfully' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateCustomFieldDto) {
    const field = await this.customFieldService.update(id, updateDto);
    return {
      success: true,
      message: 'Custom field updated successfully',
      data: field
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a custom field' })
  @ApiResponse({ status: 200, description: 'Custom field deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.customFieldService.remove(id);
    return {
      success: true,
      message: 'Custom field deleted successfully'
    };
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Reorder custom fields' })
  @ApiResponse({ status: 200, description: 'Custom fields reordered successfully' })
  async reorder(@Body() body: { fieldIds: string[] }) {
    await this.customFieldService.reorder(body.fieldIds);
    return {
      success: true,
      message: 'Custom fields reordered successfully'
    };
  }
}