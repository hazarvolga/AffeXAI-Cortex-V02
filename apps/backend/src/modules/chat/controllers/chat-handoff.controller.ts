import {
  Controller,
  Post,
  Get,
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
import { ChatHandoffService } from '../services/chat-handoff.service';
import {
  ExecuteHandoffDto,
  ExecuteEscalationDto,
  AddHandoffNoteDto,
  HandoffContextResponseDto,
  HandoffNoteResponseDto,
  HandoffHistoryResponseDto,
} from '../dto/chat-handoff.dto';

@ApiTags('Chat Handoff')
@Controller('chat/handoff')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatHandoffController {
  constructor(
    private readonly chatHandoffService: ChatHandoffService,
  ) {}

  @Get('context/:sessionId')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get handoff context for a session' })
  @ApiParam({ name: 'sessionId', description: 'Chat session ID' })
  @ApiResponse({ status: 200, description: 'Handoff context retrieved', type: HandoffContextResponseDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getHandoffContext(
    @Param('sessionId') sessionId: string,
  ): Promise<HandoffContextResponseDto> {
    try {
      const context = await this.chatHandoffService.prepareHandoffContext(sessionId);
      return {
        ...context,
        urgencyLevel: context.urgencyLevel as any // Type assertion for enum compatibility
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get handoff context: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('execute')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Execute chat handoff between support agents' })
  @ApiResponse({ status: 200, description: 'Handoff executed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Session or user not found' })
  async executeHandoff(
    @Body() handoffDto: ExecuteHandoffDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Set transferredBy to current user if not provided
      if (!handoffDto.transferredBy) {
        handoffDto.transferredBy = req.user.userId;
      }

      await this.chatHandoffService.executeHandoff(
        handoffDto.sessionId,
        handoffDto.fromSupportUserId,
        handoffDto.toSupportUserId,
        handoffDto.handoffReason,
        handoffDto.privateNotes,
        handoffDto.transferredBy,
      );

      return {
        success: true,
        message: 'Handoff executed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to execute handoff: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('escalate')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Escalate chat to manager' })
  @ApiResponse({ status: 200, description: 'Escalation executed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - no available managers' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async executeEscalation(
    @Body() escalationDto: ExecuteEscalationDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Set escalatedBy to current user if not provided
      if (!escalationDto.escalatedBy) {
        escalationDto.escalatedBy = req.user.userId;
      }

      await this.chatHandoffService.executeEscalation(
        escalationDto.sessionId,
        escalationDto.escalatedBy,
        escalationDto.escalationReason,
        escalationDto.urgencyLevel as 'high' | 'critical',
        escalationDto.privateNotes,
      );

      return {
        success: true,
        message: 'Escalation executed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to execute escalation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('note')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add handoff note to session' })
  @ApiResponse({ status: 201, description: 'Handoff note added successfully', type: HandoffNoteResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async addHandoffNote(
    @Body() noteDto: AddHandoffNoteDto,
    @Request() req: any,
  ): Promise<HandoffNoteResponseDto> {
    try {
      return await this.chatHandoffService.addHandoffNote(
        noteDto.sessionId,
        req.user.userId,
        noteDto.content,
        noteDto.isPrivate || false,
        noteDto.tags,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to add handoff note: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('notes/:sessionId')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get handoff notes for a session' })
  @ApiParam({ name: 'sessionId', description: 'Chat session ID' })
  @ApiQuery({ name: 'includePrivate', description: 'Include private notes', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Handoff notes retrieved', type: [HandoffNoteResponseDto] })
  async getHandoffNotes(
    @Param('sessionId') sessionId: string,
    @Query('includePrivate') includePrivate?: boolean,
  ): Promise<HandoffNoteResponseDto[]> {
    try {
      return await this.chatHandoffService.getHandoffNotes(sessionId, includePrivate || false);
    } catch (error) {
      throw new HttpException(
        `Failed to get handoff notes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history/:sessionId')
  @Roles(UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get complete handoff history for a session' })
  @ApiParam({ name: 'sessionId', description: 'Chat session ID' })
  @ApiResponse({ status: 200, description: 'Handoff history retrieved', type: HandoffHistoryResponseDto })
  async getHandoffHistory(
    @Param('sessionId') sessionId: string,
  ): Promise<HandoffHistoryResponseDto> {
    try {
      return await this.chatHandoffService.getHandoffHistory(sessionId);
    } catch (error) {
      throw new HttpException(
        `Failed to get handoff history: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}