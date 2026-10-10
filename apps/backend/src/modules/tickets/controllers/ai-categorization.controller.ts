import { IsUUID } from 'class-validator';
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AICategorizationService } from '../services/ai-categorization.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

class PredictionComparisonDto {
  @IsUUID() predictedCategoryId: string;
  @IsUUID() actualCategoryId: string;
}

/**
 * AI Categorization Controller
 * Keyword heuristic ticket categorization
 */
@ApiTags('AI Categorization')
@ApiBearerAuth()
@Controller('tickets/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AICategorizationController {
  constructor(
    private readonly aiCategorizationService: AICategorizationService,
  ) {}

  /**
   * Get category suggestions for a ticket
   */
  @Get(':ticketId/suggestions')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get AI category suggestions for ticket' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved' })
  async getSuggestions(@Param('ticketId',new ParseUUIDPipe()) ticketId: string) {
    return await this.aiCategorizationService.getSuggestions(ticketId);
  }

  /**
   * Auto-categorize a ticket
   */
  @Post(':ticketId/categorize')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Auto-categorize ticket using AI' })
  @ApiResponse({ status: 200, description: 'Ticket categorized' })
  async autoCategorizе(@Param('ticketId',new ParseUUIDPipe()) ticketId: string) {
    const result = await this.aiCategorizationService.autoCategorizе(ticketId);

    if (!result) {
      return {
        success: false,
        message: 'Could not categorize with sufficient confidence',
      };
    }

    return {
      success: true,
      category: result,
    };
  }

  /**
   * Train AI model with historical data
   */
  @Post('train')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Train AI categorization model' })
  @ApiResponse({ status: 503, description: 'Model training is not implemented' })
  async trainModel() {
    return await this.aiCategorizationService.trainModel();
  }

  /**
   * Get AI categorization statistics
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get AI categorization statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics() {
    return await this.aiCategorizationService.getStatistics();
  }

  /**
   * Validate prediction accuracy
   */
  @Post(':ticketId/validate')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Validate AI prediction accuracy' })
  @ApiResponse({ status: 200, description: 'Category comparison returned; not persisted' })
  async validatePrediction(
    @Param('ticketId',new ParseUUIDPipe()) ticketId: string,
    @Body() body: PredictionComparisonDto,
  ) {
    const isCorrect = await this.aiCategorizationService.validatePrediction(
      ticketId,
      body.predictedCategoryId,
      body.actualCategoryId,
    );

    return {
      ticketId,
      isCorrect,
      recorded: false,
      source: 'keyword_heuristic',
      message: isCorrect
        ? 'Prediction was correct'
        : 'Prediction was incorrect',
    };
  }
}
