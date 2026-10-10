import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
  IsObject,
  IsISO8601,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import { JwtAuthGuard } from "../../../core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../core/auth/guards/roles.guard";
import { Roles } from "../../../core/auth/decorators/roles.decorator";
import { UserRole } from "../../users/enums/user-role.enum";

export class SubmitCSATDto {
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() @MaxLength(4000) feedback?: string;
  @IsOptional() @IsObject() responses?: Record<
    string,
    string | number | boolean | null
  >;
}
export class CSATStatisticsQuery {
  @IsOptional() @IsISO8601() startDate?: string;
  @IsOptional() @IsISO8601() endDate?: string;
  @IsOptional() @IsUUID() agentId?: string;
}
export class CSATFeedbackQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  Ip,
  Headers,
  Header,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  TicketCSATService,
  CSATSurveyData,
} from "../services/ticket-csat.service";
import { Public } from "../../../core/auth/decorators/public.decorator";

/**
 * CSAT Controller
 * Manages customer satisfaction surveys
 */

@ApiTags("Ticket CSAT")
@Controller("tickets/csat")
export class TicketCSATController {
  constructor(private readonly csatService: TicketCSATService) {}

  /**
   * Get survey by token (public endpoint)
   */
  @Header("Cache-Control", "private, no-store")
  @Public()
  @Get("survey/:token")
  @ApiOperation({ summary: "Get CSAT survey by token" })
  @ApiResponse({ status: 200, description: "Survey found" })
  @ApiResponse({ status: 404, description: "Survey not found" })
  async getSurvey(@Param("token") token: string) {
    return await this.csatService.getSurveyByToken(token);
  }

  /**
   * Submit CSAT survey (public endpoint)
   */
  @Header("Cache-Control", "private, no-store")
  @Public()
  @Post("survey/:token/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit CSAT survey response" })
  @ApiResponse({ status: 200, description: "Survey submitted successfully" })
  @ApiResponse({ status: 400, description: "Invalid survey data" })
  @ApiResponse({ status: 404, description: "Survey not found" })
  async submitSurvey(
    @Param("token") token: string,
    @Body() surveyData: SubmitCSATDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return await this.csatService.submitSurvey(token, {
      ...surveyData,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Request survey for a ticket (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPPORT,
    UserRole.SUPPORT_MANAGER,
    UserRole.SUPPORT_AGENT,
  )
  @Post(":ticketId/request")
  @ApiOperation({ summary: "Request CSAT survey for ticket" })
  @ApiResponse({ status: 200, description: "Survey requested successfully" })
  async requestSurvey(
    @Param("ticketId", new ParseUUIDPipe()) ticketId: string,
  ) {
    return await this.csatService.requestSurvey(ticketId);
  }

  /**
   * Get CSAT statistics
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPPORT,
    UserRole.SUPPORT_MANAGER,
    UserRole.SUPPORT_AGENT,
  )
  @Get("statistics")
  @ApiOperation({ summary: "Get CSAT statistics" })
  @ApiResponse({ status: 200, description: "Statistics retrieved" })
  async getStatistics(@Query() query: CSATStatisticsQuery) {
    return await this.csatService.getStatistics(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
      query.agentId,
    );
  }

  /**
   * Get recent feedback
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPPORT,
    UserRole.SUPPORT_MANAGER,
    UserRole.SUPPORT_AGENT,
  )
  @Get("feedback/recent")
  @ApiOperation({ summary: "Get recent CSAT feedback" })
  @ApiResponse({ status: 200, description: "Feedback retrieved" })
  async getRecentFeedback(@Query() query: CSATFeedbackQuery) {
    return await this.csatService.getRecentFeedback(query.limit ?? 10);
  }
}
