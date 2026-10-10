import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketAssignmentRulesService } from '../services/ticket-assignment-rules.service';
import { TicketAssignmentRule } from '../entities/ticket-assignment-rule.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@ApiTags('Ticket Assignment Rules')
@Controller('tickets/assignment-rules')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
export class TicketAssignmentRulesController {
  constructor(
    private readonly assignmentRulesService: TicketAssignmentRulesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all ticket assignment rules' })
  @ApiResponse({ status: 200, description: 'Return all ticket assignment rules.' })
  async findAll(): Promise<TicketAssignmentRule[]> {
    return this.assignmentRulesService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active ticket assignment rules' })
  @ApiResponse({ status: 200, description: 'Return active ticket assignment rules.' })
  async findActive(): Promise<TicketAssignmentRule[]> {
    return this.assignmentRulesService.getActiveRules();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket assignment rule by ID' })
  @ApiResponse({ status: 200, description: 'Return ticket assignment rule.' })
  @ApiResponse({ status: 404, description: 'Ticket assignment rule not found.' })
  async findOne(@Param('id') id: string): Promise<TicketAssignmentRule> {
    return this.assignmentRulesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new ticket assignment rule' })
  @ApiResponse({ status: 201, description: 'Ticket assignment rule created successfully.' })
  async create(
    @Body() data: Partial<TicketAssignmentRule>,
  ): Promise<TicketAssignmentRule> {
    return this.assignmentRulesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ticket assignment rule' })
  @ApiResponse({ status: 200, description: 'Ticket assignment rule updated successfully.' })
  @ApiResponse({ status: 404, description: 'Ticket assignment rule not found.' })
  async update(
    @Param('id') id: string,
    @Body() data: Partial<TicketAssignmentRule>,
  ): Promise<TicketAssignmentRule> {
    return this.assignmentRulesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ticket assignment rule' })
  @ApiResponse({ status: 200, description: 'Ticket assignment rule deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Ticket assignment rule not found.' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.assignmentRulesService.delete(id);
  }

  @Put(':id/toggle')
  @ApiOperation({ summary: 'Toggle ticket assignment rule active status' })
  @ApiResponse({ status: 200, description: 'Ticket assignment rule status toggled successfully.' })
  @ApiResponse({ status: 404, description: 'Ticket assignment rule not found.' })
  async toggle(@Param('id') id: string): Promise<TicketAssignmentRule> {
    return this.assignmentRulesService.toggle(id);
  }
}