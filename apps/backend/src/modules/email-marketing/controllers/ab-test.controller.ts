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
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { AbTestService } from '../services/ab-test.service';
import {
  CreateAbTestDto,
  UpdateVariantDto,
  SendAbTestDto,
  SelectWinnerDto,
  AbTestResultDto,
} from '../dto/ab-test.dto';

/**
 * A/B Test Controller
 * Handles all A/B testing operations for email campaigns
 */
@ApiTags('A/B Testing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@Controller('email-marketing/ab-test')
export class AbTestController {
  constructor(private readonly abTestService: AbTestService) { }

  /**
   * Create a new A/B test for a campaign
   */
  @Post()
  @ApiOperation({
    summary: 'Create A/B test',
    description: 'Create a new A/B test with 2-5 variants for an email campaign',
  })
  @ApiResponse({
    status: 201,
    description: 'A/B test created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid split percentages or variant configuration',
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found',
  })
  async createAbTest(@Body() dto: CreateAbTestDto) {
    return this.abTestService.createAbTest(dto);
  }

  /**
   * Get A/B test results with statistical analysis
   */
  @Get(':campaignId/results')
  @ApiOperation({
    summary: 'Get A/B test results',
    description:
      'Get detailed results including variant metrics, statistical significance, and winner determination',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'A/B test results retrieved successfully',
    type: AbTestResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'A/B test not found',
  })
  async getResults(@Param('campaignId') campaignId: string) {
    return this.abTestService.getAbTestResults(campaignId);
  }

  /**
   * Get A/B test summary
   */
  @Get(':campaignId/summary')
  @ApiOperation({
    summary: 'Get A/B test summary',
    description: 'Get basic information about an A/B test',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
  })
  @ApiResponse({
    status: 200,
    description: 'A/B test summary retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'A/B test not found',
  })
  async getSummary(@Param('campaignId') campaignId: string) {
    return this.abTestService.getAbTestSummary(campaignId);
  }

  /**
   * Update a variant's content
   */
  @Put(':campaignId/variants/:variantId')
  @ApiOperation({
    summary: 'Update variant',
    description: 'Update a variant\'s subject, content, or split percentage',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
  })
  @ApiParam({
    name: 'variantId',
    description: 'Variant ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Variant updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update variant after test is completed',
  })
  @ApiResponse({
    status: 404,
    description: 'Variant not found',
  })
  async updateVariant(
    @Param('campaignId') campaignId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.abTestService.updateVariant(campaignId, variantId, dto);
  }

  /**
   * Send A/B test (start the test)
   */
  @Post(':campaignId/send')
  @ApiOperation({
    summary: 'Send A/B test',
    description: 'Start the A/B test by sending variants to subscribers',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
  })
  @ApiResponse({
    status: 200,
    description: 'A/B test sending initiated',
  })
  @ApiResponse({
    status: 400,
    description: 'No variants configured or no active subscribers',
  })
  @ApiResponse({
    status: 404,
    description: 'A/B test not found',
  })
  async sendAbTest(@Param('campaignId') campaignId: string, @Body() dto: SendAbTestDto) {
    // Ensure campaignId is set in DTO
    dto.campaignId = campaignId;
    return this.abTestService.sendAbTest(dto);
  }

  /**
   * Manually select winner
   */
  @Post(':campaignId/select-winner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Select winner',
    description: 'Manually select the winning variant for the A/B test',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Winner selected successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'A/B test or variant not found',
  })
  async selectWinner(@Param('campaignId') campaignId: string, @Body() dto: SelectWinnerDto) {
    return this.abTestService.selectWinner(campaignId, dto.variantId);
  }

  /**
   * Delete A/B test
   */
  @Delete(':campaignId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete A/B test',
    description: 'Delete an A/B test and all its variants (only if not yet sent)',
  })
  @ApiParam({
    name: 'campaignId',
    description: 'Campaign ID',
  })
  @ApiResponse({
    status: 204,
    description: 'A/B test deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete A/B test that has been sent',
  })
  @ApiResponse({
    status: 404,
    description: 'A/B test not found',
  })
  async deleteAbTest(@Param('campaignId') campaignId: string) {
    await this.abTestService.deleteAbTest(campaignId);
  }
}
