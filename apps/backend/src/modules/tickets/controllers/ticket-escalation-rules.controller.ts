import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketEscalationRulesService } from '../services/ticket-escalation-rules.service';
import { TicketEscalationRule } from '../entities/ticket-escalation-rule.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@ApiTags('Ticket Escalation Rules')
@Controller('tickets/escalation-rules')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT_MANAGER)
export class TicketEscalationRulesController {
  constructor(
    private readonly escalationRulesService: TicketEscalationRulesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all ticket escalation rules' })
  @ApiResponse({ status: 200, description: 'Return all ticket escalation rules.' })
  async findAll(): Promise<TicketEscalationRule[]> {
    return this.escalationRulesService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active ticket escalation rules' })
  @ApiResponse({ status: 200, description: 'Return active ticket escalation rules.' })
  async findActive(): Promise<TicketEscalationRule[]> {
    return this.escalationRulesService.getActiveRules();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket escalation rule by ID' })
  @ApiResponse({ status: 200, description: 'Return ticket escalation rule.' })
  @ApiResponse({ status: 404, description: 'Ticket escalation rule not found.' })
  async findOne(@Param('id') id: string): Promise<TicketEscalationRule> {
    return this.escalationRulesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new ticket escalation rule' })
  @ApiResponse({ status: 201, description: 'Ticket escalation rule created successfully.' })
  async create(
    @Body() data: Partial<TicketEscalationRule>,
  ): Promise<TicketEscalationRule> {
    return this.escalationRulesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ticket escalation rule' })
  @ApiResponse({ status: 200, description: 'Ticket escalation rule updated successfully.' })
  @ApiResponse({ status: 404, description: 'Ticket escalation rule not found.' })
  async update(
    @Param('id') id: string,
    @Body() data: Partial<TicketEscalationRule>,
  ): Promise<TicketEscalationRule> {
    return this.escalationRulesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ticket escalation rule' })
  @ApiResponse({ status: 200, description: 'Ticket escalation rule deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Ticket escalation rule not found.' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.escalationRulesService.delete(id);
  }

  @Put(':id/toggle')
  @ApiOperation({ summary: 'Toggle ticket escalation rule active status' })
  @ApiResponse({ status: 200, description: 'Ticket escalation rule status toggled successfully.' })
  @ApiResponse({ status: 404, description: 'Ticket escalation rule not found.' })
  async toggle(@Param('id') id: string): Promise<TicketEscalationRule> {
    return this.escalationRulesService.toggle(id);
  }
}