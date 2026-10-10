import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateCrmCustomerDto } from './dto/create-crm-customer.dto';
import { ImportCrmCustomersDto } from './dto/import-crm-customers.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { UpdateCrmCustomerDto } from './dto/update-crm-customer.dto';
import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../../lib/permissions';
import { Throttle } from '@nestjs/throttler';
import { ListCrmCustomersDto } from './dto/list-crm-customers.dto';

@Controller('crm')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) { }

  /**
   * Get all CRM customers
   * Admin only
   */
  @Get()
  @RequirePermissions(PERMISSIONS.CRM_VIEW)
  async findAll(@Query() query: ListCrmCustomersDto) {
    const customers = await this.crmService.findAll(query.page, query.limit);
    const stats = await this.crmService.getStats();
    return {
      success: true,
      data: customers,
      meta: {
        count: customers.length,
        total: stats.total,
        page: query.page,
        limit: query.limit,
      },
    };
  }

  /**
   * Get CRM statistics
   * Admin only
   */
  @Get('stats')
  @RequirePermissions(PERMISSIONS.CRM_VIEW)
  async getStats() {
    const stats = await this.crmService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get single CRM customer
   * Admin only
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.CRM_VIEW)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.crmService.findOne(id);
    return { success: true, data: customer };
  }

  /**
   * Create single CRM customer
   * Admin only
   */
  @Post()
  @RequirePermissions(PERMISSIONS.CRM_MANAGE)
  async create(@Body() createDto: CreateCrmCustomerDto) {
    const customer = await this.crmService.create(createDto);
    return { success: true, message: 'CRM customer created successfully', data: customer };
  }

  /**
   * Bulk import CRM customers
   * Admin only
   */
  @Post('import')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @RequirePermissions(PERMISSIONS.CRM_MANAGE)
  async bulkImport(@Body() importDto: ImportCrmCustomersDto) {
    const result = await this.crmService.bulkImport(importDto.customers);
    return {
      success: true,
      message: `Successfully imported ${result.imported} customers`,
      data: result,
    };
  }

  /**
   * Update CRM customer
   * Admin only
   */
  @Put(':id')
  @RequirePermissions(PERMISSIONS.CRM_MANAGE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCrmCustomerDto,
  ) {
    const customer = await this.crmService.update(id, updateDto);
    return { success: true, message: 'CRM customer updated successfully', data: customer };
  }

  /**
   * Soft delete CRM customer (set isActive = false)
   * Admin only
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CRM_MANAGE)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.crmService.remove(id);
    return { success: true, message: 'CRM customer deactivated successfully' };
  }

  /**
   * Hard delete CRM customer (permanently delete)
   * Admin only
   */
  @Delete(':id/hard')
  @RequirePermissions(PERMISSIONS.CRM_DELETE)
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.crmService.hardDelete(id);
    return { success: true, message: 'CRM customer permanently deleted' };
  }
}
