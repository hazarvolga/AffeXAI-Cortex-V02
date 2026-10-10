import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TicketMacroService } from '../services/ticket-macro.service';
import type { CreateMacroDto } from '../services/ticket-macro.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

/**
 * Ticket Macro Controller
 * Manages bulk actions and predefined workflows
 */
@ApiTags('Ticket Macros')
@ApiBearerAuth()
@Controller('tickets/macros')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketMacroController {
  constructor(private readonly macroService: TicketMacroService) { }

  /**
   * Create a new macro (ADMIN/EDITOR only)
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Create a new ticket macro' })
  @ApiResponse({ status: 201, description: 'Macro created successfully' })
  async createMacro(
    @Body() dto: CreateMacroDto,
    @CurrentUser() user: any,
  ) {
    return await this.macroService.createMacro(user.id, dto);
  }

  /**
   * Update a macro (ADMIN/EDITOR only)
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Update a ticket macro' })
  @ApiResponse({ status: 200, description: 'Macro updated successfully' })
  async updateMacro(
    @Param('id') id: string,
    @Body() updates: Partial<CreateMacroDto>,
    @CurrentUser() user: any,
  ) {
    return await this.macroService.updateMacro(id, updates);
  }

  /**
   * Delete a macro (ADMIN only)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a ticket macro' })
  @ApiResponse({ status: 200, description: 'Macro deleted successfully' })
  async deleteMacro(@Param('id') id: string, @CurrentUser() user: any) {
    await this.macroService.deleteMacro(id);
    return { message: 'Macro deleted successfully' };
  }

  /**
   * Get macro by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get macro by ID' })
  @ApiResponse({ status: 200, description: 'Macro retrieved successfully' })
  async getMacro(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.macroService.getMacro(id);
  }

  /**
   * Get all macros
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get all macros' })
  @ApiResponse({ status: 200, description: 'Macros retrieved successfully' })
  async getAllMacros(@CurrentUser() user: any) {
    return await this.macroService.getAllMacros(user.id);
  }

  /**
   * Execute macro on tickets
   */
  @Post(':id/execute')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Execute macro on tickets' })
  @ApiResponse({ status: 200, description: 'Macro executed successfully' })
  async executeMacro(
    @Param('id') id: string,
    @Body() body: { ticketIds: string[] },
    @CurrentUser() user: any,
  ) {
    return await this.macroService.executeMacro(id, body.ticketIds, user.id);
  }

  /**
   * Get popular macros
   */
  @Get('popular/list')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get popular macros' })
  @ApiResponse({ status: 200, description: 'Popular macros retrieved' })
  async getPopularMacros(@Query('limit') limit?: string) {
    return await this.macroService.getPopularMacros(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * Get macro statistics
   */
  @Get('stats/overview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get macro statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics() {
    return await this.macroService.getStatistics();
  }
}
