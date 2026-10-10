import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../../modules/users/enums/user-role.enum';
import { ChatSupportAssignmentService } from '../services/chat-support-assignment.service';
import {
  CreateSupportAssignmentDto,
  TransferSupportAssignmentDto,
  EscalateSupportAssignmentDto,
  CompleteSupportAssignmentDto,
  SupportAssignmentQueryDto,
  SupportTeamAvailabilityResponseDto,
  AssignmentStatsResponseDto,
} from '../dto/support-assignment.dto';
import { ChatSupportAssignment } from '../entities/chat-support-assignment.entity';

@ApiTags('Chat Support Assignment')
@Controller('chat/support-assignment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupportAssignmentController {
  constructor(
    private readonly supportAssignmentService: ChatSupportAssignmentService,
  ) {}

  @Post()
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new support assignment' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully', type: ChatSupportAssignment })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Session or user not found' })
  async createAssignment(
    @Body() createDto: CreateSupportAssignmentDto,
    @Request() req: any,
  ): Promise<ChatSupportAssignment> {
    try {
      // Set assignedBy to current user if not provided
      if (!createDto.assignedBy) {
        createDto.assignedBy = req.user.userId;
      }

      return await this.supportAssignmentService.createAssignment(createDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create assignment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('transfer')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Transfer assignment between support users' })
  @ApiResponse({ status: 200, description: 'Assignment transferred successfully', type: ChatSupportAssignment })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async transferAssignment(
    @Body() transferDto: TransferSupportAssignmentDto,
    @Request() req: any,
  ): Promise<ChatSupportAssignment> {
    try {
      // Set transferredBy to current user if not provided
      if (!transferDto.transferredBy) {
        transferDto.transferredBy = req.user.userId;
      }

      return await this.supportAssignmentService.transferAssignment(transferDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to transfer assignment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('escalate')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Escalate assignment to manager' })
  @ApiResponse({ status: 201, description: 'Assignment escalated successfully', type: ChatSupportAssignment })
  @ApiResponse({ status: 400, description: 'Bad request - no available managers' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async escalateAssignment(
    @Body() escalateDto: EscalateSupportAssignmentDto,
    @Request() req: any,
  ): Promise<ChatSupportAssignment> {
    try {
      // Set escalatedBy to current user if not provided
      if (!escalateDto.escalatedBy) {
        escalateDto.escalatedBy = req.user.userId;
      }

      return await this.supportAssignmentService.escalateAssignment(
        escalateDto.sessionId,
        escalateDto.escalatedBy,
        escalateDto.notes,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to escalate assignment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('complete')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Complete an assignment' })
  @ApiResponse({ status: 200, description: 'Assignment completed successfully', type: ChatSupportAssignment })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async completeAssignment(
    @Body() completeDto: CompleteSupportAssignmentDto,
    @Request() req: any,
  ): Promise<ChatSupportAssignment> {
    try {
      // Set supportUserId to current user if not provided
      if (!completeDto.supportUserId) {
        completeDto.supportUserId = req.user.userId;
      }

      return await this.supportAssignmentService.completeAssignment(
        completeDto.sessionId,
        completeDto.supportUserId,
        completeDto.notes,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to complete assignment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auto-assign/:sessionId')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Auto-assign support to a session' })
  @ApiParam({ name: 'sessionId', description: 'Chat session ID' })
  @ApiResponse({ status: 201, description: 'Support auto-assigned successfully', type: ChatSupportAssignment })
  @ApiResponse({ status: 400, description: 'No available support users' })
  async autoAssignSupport(
    @Param('sessionId') sessionId: string,
  ): Promise<ChatSupportAssignment | null> {
    try {
      return await this.supportAssignmentService.autoAssignSupport(sessionId);
    } catch (error) {
      throw new HttpException(
        `Failed to auto-assign support: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('session/:sessionId')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get active assignment for a session' })
  @ApiParam({ name: 'sessionId', description: 'Chat session ID' })
  @ApiResponse({ status: 200, description: 'Active assignment retrieved', type: ChatSupportAssignment })
  @ApiResponse({ status: 404, description: 'No active assignment found' })
  async getActiveAssignment(
    @Param('sessionId') sessionId: string,
  ): Promise<ChatSupportAssignment | null> {
    return await this.supportAssignmentService.getActiveAssignment(sessionId);
  }

  @Get('session/:sessionId/all')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all assignments for a session' })
  @ApiParam({ name: 'sessionId', description: 'Chat session ID' })
  @ApiResponse({ status: 200, description: 'Session assignments retrieved', type: [ChatSupportAssignment] })
  async getSessionAssignments(
    @Param('sessionId') sessionId: string,
  ): Promise<ChatSupportAssignment[]> {
    return await this.supportAssignmentService.getSessionAssignments(sessionId);
  }

  @Get('user/:userId')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get active assignments for a support user' })
  @ApiParam({ name: 'userId', description: 'Support user ID' })
  @ApiResponse({ status: 200, description: 'User assignments retrieved', type: [ChatSupportAssignment] })
  async getSupportUserAssignments(
    @Param('userId') userId: string,
  ): Promise<ChatSupportAssignment[]> {
    return await this.supportAssignmentService.getSupportUserAssignments(userId);
  }

  @Get('my-assignments')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current user active assignments' })
  @ApiResponse({ status: 200, description: 'Current user assignments retrieved', type: [ChatSupportAssignment] })
  async getMyAssignments(
    @Request() req: any,
  ): Promise<ChatSupportAssignment[]> {
    return await this.supportAssignmentService.getSupportUserAssignments(req.user.userId);
  }

  @Get('availability')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get support team availability' })
  @ApiQuery({ name: 'userIds', description: 'Comma-separated user IDs to check', required: false })
  @ApiResponse({ status: 200, description: 'Support team availability retrieved', type: [SupportTeamAvailabilityResponseDto] })
  async getSupportTeamAvailability(
    @Query('userIds') userIds?: string,
  ): Promise<SupportTeamAvailabilityResponseDto[]> {
    const userIdArray = userIds ? userIds.split(',').filter(id => id.trim()) : undefined;
    return await this.supportAssignmentService.getSupportTeamAvailability(userIdArray);
  }

  @Get('stats')
  @Roles(UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get assignment statistics' })
  @ApiQuery({ name: 'supportUserId', description: 'Support user ID to filter by', required: false })
  @ApiQuery({ name: 'dateFrom', description: 'Start date (ISO string)', required: false })
  @ApiQuery({ name: 'dateTo', description: 'End date (ISO string)', required: false })
  @ApiResponse({ status: 200, description: 'Assignment statistics retrieved', type: AssignmentStatsResponseDto })
  async getAssignmentStats(
    @Query() query: SupportAssignmentQueryDto,
  ): Promise<AssignmentStatsResponseDto> {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

    return await this.supportAssignmentService.getAssignmentStats(
      query.supportUserId,
      dateFrom,
      dateTo,
    );
  }

  @Get()
  @Roles(UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get assignments with filters' })
  @ApiQuery({ name: 'supportUserId', description: 'Support user ID to filter by', required: false })
  @ApiQuery({ name: 'sessionId', description: 'Session ID to filter by', required: false })
  @ApiQuery({ name: 'status', description: 'Assignment status to filter by', required: false })
  @ApiQuery({ name: 'dateFrom', description: 'Start date (ISO string)', required: false })
  @ApiQuery({ name: 'dateTo', description: 'End date (ISO string)', required: false })
  @ApiResponse({ status: 200, description: 'Assignments retrieved', type: [ChatSupportAssignment] })
  async getAssignments(
    @Query() query: SupportAssignmentQueryDto,
  ): Promise<ChatSupportAssignment[]> {
    // This would need a more complex query implementation
    // For now, return empty array as placeholder
    return [];
  }
}