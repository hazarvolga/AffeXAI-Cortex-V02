import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Ticket } from './entities/ticket.entity';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { TicketFiltersDto } from './dto/ticket-filters.dto';
import { MergeTicketsDto } from './dto/merge-tickets.dto';
import { SplitTicketDto } from './dto/split-ticket.dto';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { Public } from '../../core/auth/decorators/public.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { TicketEmailParserService } from './services/ticket-email-parser.service';
import { EmailWebhookAdapterFactory } from './services/email-webhook-adapter-factory.service';
class BoundedCreateTicketDto extends CreateTicketDto {
  @MaxLength(300)
  subject: string;

  @MaxLength(20000)
  description: string;
}

class AnalyzeTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  problemDescription: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  category: string;
}

type TicketActor = { id: string; roleNames?: string[]; isPlatformAdmin?: boolean };
const STAFF_ROLES = new Set<string>([
  UserRole.ADMIN, UserRole.EDITOR, UserRole.SUPPORT,
  UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT,
]);
function isTicketStaff(user: TicketActor): boolean {
  return user.isPlatformAdmin === true || (user.roleNames ?? []).some(role => STAFF_ROLES.has(role));
}
function visibleTicket(ticket: Ticket, user: TicketActor): Ticket {
  return isTicketStaff(user) ? ticket : {
    ...ticket,
    messages: ticket.messages?.filter(message => !message.isInternal),
  };
}


/**
 * Tickets Controller
 * RESTful API endpoints for ticket management
 * Protected with JWT authentication
 */
@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly emailParserService: TicketEmailParserService,
    private readonly adapterFactory: EmailWebhookAdapterFactory,
  ) { }

  /**
   * Create a new support ticket
   * Available to: CUSTOMER role and above
   */
  @Post()
    @ApiOperation({ summary: 'Create a new support ticket (authenticated)' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(
    @Body() createTicketDto: BoundedCreateTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.create(userId, createTicketDto);
  }

  /** Legacy URL retained as an authenticated, actor-owned creation alias. */
  @Post('public')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a support ticket for the authenticated user (legacy URL)' })
  async createPublic(
    @Body() createTicketDto: BoundedCreateTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.create(userId, createTicketDto);
  }

  /**
   * Get all tickets with filters
   * Role-based access:
   * - CUSTOMER: Only their own tickets
   * - ADMIN/EDITOR: All tickets
   */
  @Get()
  @ApiOperation({ summary: 'Get all tickets with filters' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async findAll(
    @Query() filters: TicketFiltersDto,
    @CurrentUser() user: TicketActor,
  ) {
    return this.ticketsService.findAll(isTicketStaff(user) ? filters : { ...filters, userId: user.id });
  }

  /**
   * Get a single ticket by ID
   * Customers can only view their own tickets
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details by ID' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your ticket' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: TicketActor,
  ) {
    const ticket = await this.ticketsService.findOne(id);

    // Customers can only view their own tickets
    if (!isTicketStaff(user) && ticket.userId !== user.id) {
      throw new ForbiddenException('You can only view your own tickets');
    }

    return visibleTicket(ticket, user);
  }

  /**
   * Update ticket status
   * Available to:
   * - ADMIN and EDITOR: Can set any status
   * - CUSTOMER: Can only set their own tickets to 'resolved' or 'cancelled'
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser() user: TicketActor,
  ) {
    // Get ticket to check ownership
    const ticket = await this.ticketsService.findOne(id);

    // Customers have restricted permissions
    if (!isTicketStaff(user)) {
      // Customers can only update their own tickets
      if (ticket.userId !== user.id) {
        throw new ForbiddenException('You can only update your own tickets');
      }

      // Customers can only set status to 'resolved' or 'cancelled'
      const allowedStatuses = ['resolved', 'cancelled', 'closed'];
      if (!allowedStatuses.includes(updateStatusDto.status)) {
        throw new ForbiddenException(
          'Customers can only mark tickets as resolved, cancelled, or closed'
        );
      }
    }

    const updated = await this.ticketsService.updateStatus(id, updateStatusDto.status, userId);
    return visibleTicket(updated, user);
  }

  /**
   * Assign ticket to a support agent
   * Available to: ADMIN, EDITOR, and SUPPORT_MANAGER roles
   */
  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.SUPPORT_MANAGER)
  @ApiOperation({ summary: 'Assign ticket to a support agent' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async assign(
    @Param('id') id: string,
    @Body() assignTicketDto: AssignTicketDto,
    @CurrentUser('id') assignerId: string,
    @CurrentUser() user: TicketActor,
  ) {
    return this.ticketsService.assignTo(id, assignTicketDto.assignedToId, assignerId);
  }

  /**
   * Add a message to a ticket
   * All authenticated users can add messages to tickets they have access to
   */
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a message to a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to message this ticket' })
  async addMessage(
    @Param('id') id: string,
    @Body() addMessageDto: AddMessageDto,
    @CurrentUser('id') userId: string,
    @CurrentUser() user: TicketActor,
  ) {
    const ticket = await this.ticketsService.findOne(id);

    // Check if user has access to this ticket
    if (!isTicketStaff(user) && ticket.userId !== user.id) {
      throw new ForbiddenException('You can only add messages to your own tickets');
    }

    if (!isTicketStaff(user) && addMessageDto.isInternal) {
      throw new ForbiddenException('Internal notes are restricted to support staff');
    }
    return this.ticketsService.addMessage(id, userId, addMessageDto);
  }

  /**
   * Get ticket statistics
   * Available to: ADMIN, EDITOR, and SUPPORT_MANAGER roles
   */
  @Get('stats/overview')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.SUPPORT_MANAGER)
  @ApiOperation({ summary: 'Get ticket statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getStats() {
    return this.ticketsService.getStats();
  }


  /**
   * Manually escalate a ticket
   * Available to: ADMIN and EDITOR roles only
   */
  @Post(':id/escalate')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually escalate a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket escalated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 400, description: 'Escalation failed' })
  async escalateTicket(
    @Param('id') id: string,
    @Body() body: { reason?: string; escalateTo?: string },
    @Req() req: any,
  ) {
    return this.ticketsService.escalateTicket(
      id,
      req.user.id,
      body.reason,
      body.escalateTo
    );
  }

  /**
   * Get all ticket categories
   */
  @Get('categories/list')
  @ApiOperation({ summary: 'Get all ticket categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.ticketsService.findAllCategories();
  }

  /**
   * Merge tickets
   * Available to: ADMIN and EDITOR roles only
   */
  @Post('merge')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Merge multiple tickets into one' })
  @ApiResponse({ status: 200, description: 'Tickets merged successfully' })
  @ApiResponse({
    status: 400, description: 'Invalid input data'   // No changes needed for merge/split as they will use findOne internally (which has been updated)
    // But explicit check is safer if we update them later
    // For now skipping as methods were not fully visible in provided view
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'One or more tickets not found' })
  async mergeTickets(
    @Body() mergeTicketsDto: MergeTicketsDto,
    @CurrentUser('id') userId: string,
    @CurrentUser() user: TicketActor,
  ) {
    return this.ticketsService.mergeTickets(
      mergeTicketsDto.ticketIds,
      mergeTicketsDto.targetTicketId,
      userId,
      mergeTicketsDto.mergeNote
    );
  }

  /**
   * Split ticket
   * Available to: ADMIN and EDITOR roles only
   */
  @Post('split')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Split a ticket into two tickets' })
  @ApiResponse({ status: 201, description: 'Ticket split successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async splitTicket(
    @Body() splitTicketDto: SplitTicketDto,
    @CurrentUser('id') userId: string,
    @CurrentUser() user: TicketActor,
  ) {
    // Validate required fields
    if (!splitTicketDto.newTicketPriority) {
      throw new BadRequestException('newTicketPriority is required');
    }

    if (!splitTicketDto.messageIds || splitTicketDto.messageIds.length === 0) {
      throw new BadRequestException('messageIds is required and must not be empty');
    }

    return this.ticketsService.splitTicket(
      splitTicketDto.originalTicketId,
      {
        newTicketSubject: splitTicketDto.newTicketSubject,
        newTicketDescription: splitTicketDto.newTicketDescription,
        newTicketPriority: splitTicketDto.newTicketPriority,
        newTicketCategoryId: splitTicketDto.newTicketCategoryId,
        messageIds: splitTicketDto.messageIds,
        splitNote: splitTicketDto.splitNote,
      },
      userId
    );
  }

  /** Authenticated, bounded AI analysis before ticket creation. */
  @Post('analyze')
  @ApiOperation({ summary: 'Analyze ticket description for the authenticated user' })
  async analyzeTicket(@Body() body: AnalyzeTicketDto) {
    return this.ticketsService.analyzeTicketWithAI(body.problemDescription, body.category);
  }

  /** No trusted signed reply capability exists yet; never impersonate an email sender. */
  @Post('inbound-email')
  @Public()
  @ApiOperation({ summary: 'Inbound ticket replies unavailable pending verified reply capability' })
  async processInboundEmail() {
    throw new ServiceUnavailableException('Inbound ticket replies are not configured for verified delivery');
  }

  /**
   * [NEURAL GRID] Get Ticket Context from RAG
   * Returns insights from Email/Social history relevant to this ticket.
   */
  @Get(':id/neural-context')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.SUPPORT, UserRole.SUPPORT_MANAGER, UserRole.SUPPORT_AGENT)
  @ApiOperation({ summary: 'Get Brand Intelligence for this ticket' })
  @ApiResponse({ status: 200, description: 'Neural context retrieved' })
  async getNeuralContext(
    @Param('id') id: string,
    @CurrentUser() user: TicketActor,
  ) {
    const ticket = await this.ticketsService.findOne(id);
    if (!isTicketStaff(user) && ticket.userId !== user.id) {
      throw new ForbiddenException('You can only access your own ticket context');
    }
    return this.ticketsService.getTicketSignal(id);
  }
}



