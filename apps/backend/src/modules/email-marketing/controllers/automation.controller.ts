import { PlatformAdminGuard } from '../../../core/auth/guards/platform-admin.guard';
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
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { AutomationService } from '../services/automation.service';
import { AutomationQueueService } from '../services/automation-queue.service';
import {
  CreateAutomationDto,
  UpdateAutomationDto,
  ActivateAutomationDto,
  PauseAutomationDto,
  TestAutomationDto,
  GetExecutionsQueryDto,
  AutomationAnalyticsDto,
  AutomationResponseDto,
  ExecutionResponseDto,
  AnalyticsResponseDto,
} from '../dto/automation.dto';

/**
 * Automation Controller
 * REST API for email marketing automation
 */
@ApiTags('Marketing Automation')
@Controller('email-marketing/automations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@ApiBearerAuth()
export class AutomationController {
  constructor(
    private readonly automationService: AutomationService,
    private readonly queueService: AutomationQueueService,
  ) { }

  /**
   * Create automation
   */
  @Post()
  @ApiOperation({ summary: 'Create new automation workflow' })
  @ApiResponse({
    status: 201,
    description: 'Automation created successfully',
    type: AutomationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid workflow configuration' })
  async create(@Body() dto: CreateAutomationDto, @CurrentUser() user: any): Promise<AutomationResponseDto> {
    return this.automationService.create(dto, user.tenantId);
  }

  /**
   * Get all automations
   */
  @Get()
  @ApiOperation({ summary: 'Get all automations' })
  @ApiResponse({
    status: 200,
    description: 'Automations retrieved successfully',
    type: [AutomationResponseDto],
  })
  async findAll(@CurrentUser() user: any): Promise<AutomationResponseDto[]> {
    return this.automationService.findAll(user.tenantId);
  }

  /**
   * Get automation by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get automation by ID' })
  @ApiParam({ name: 'id', description: 'Automation ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Automation retrieved successfully',
    type: AutomationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any): Promise<AutomationResponseDto> {
    return this.automationService.findOne(id, user.tenantId);
  }

  /**
   * Update automation
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update automation' })
  @ApiParam({ name: 'id', description: 'Automation ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Automation updated successfully',
    type: AutomationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot modify active automation' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAutomationDto,
    @CurrentUser() user: any,
  ): Promise<AutomationResponseDto> {
    return this.automationService.update(id, dto, user.tenantId);
  }

  /**
   * Delete automation
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete automation' })
  @ApiParam({ name: 'id', description: 'Automation ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Automation deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete active automation' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    return this.automationService.remove(id, user.tenantId);
  }

  /**
   * Activate automation
   */
  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate automation' })
  @ApiParam({ name: 'id', description: 'Automation ID (UUID)' })
  @ApiQuery({
    name: 'registerExisting',
    required: false,
    description: 'Register existing subscribers',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Automation activated successfully',
    type: AutomationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Automation cannot be activated' })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  async activate(
    @Param('id') id: string,
    @Query('registerExisting') registerExisting: boolean = false,
    @CurrentUser() user: any,
  ): Promise<AutomationResponseDto> {
    return this.automationService.activate(id, user.tenantId, registerExisting);
  }

  /**
   * Pause automation
   */
  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause automation' })
  @ApiParam({ name: 'id', description: 'Automation ID (UUID)' })
  @ApiQuery({
    name: 'cancelPending',
    required: false,
    description: 'Cancel pending executions',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Automation paused successfully',
    type: AutomationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  async pause(
    @Param('id') id: string,
    @Query('cancelPending') cancelPending: boolean = false,
    @CurrentUser() user: any,
  ): Promise<AutomationResponseDto> {
    return this.automationService.pause(id, user.tenantId, cancelPending);
  }

  /**
   * Get executions
   */
  @Get('executions/list')
  @ApiOperation({ summary: 'Get automation executions with pagination' })
  @ApiQuery({ name: 'automationId', required: false, description: 'Filter by automation ID' })
  @ApiQuery({ name: 'subscriberId', required: false, description: 'Filter by subscriber ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Executions retrieved successfully',
    schema: {
      properties: {
        executions: { type: 'array', items: { $ref: '#/components/schemas/ExecutionResponseDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async getExecutions(@Query() query: GetExecutionsQueryDto, @CurrentUser() user: any) {
    return this.automationService.getExecutions(query, user.tenantId);
  }

  /**
   * Get automation analytics
   */
  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get automation analytics and performance metrics' })
  @ApiParam({ name: 'id', description: 'Automation ID (UUID)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
    type: AnalyticsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Automation not found' })
  async getAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AnalyticsResponseDto> {
    return this.automationService.getAnalytics(
      id,
      user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Test automation
   */
  @Post(':id/test')
  @ApiOperation({ summary: 'Test automation with a subscriber' })
  @ApiParam({ name: 'id', description: 'Automation ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Test completed successfully',
    schema: {
      properties: {
        automation: { type: 'object' },
        subscriber: { type: 'object' },
        steps: { type: 'array' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Automation or subscriber not found' })
  async test(@Param('id') id: string, @Body() dto: TestAutomationDto, @CurrentUser() user: any) {
    return this.automationService.test(id, dto.subscriberId, user.tenantId, dto.dryRun);
  }

  /**
   * Get queue metrics
   */
  @Get('queue/metrics')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: 'Get automation queue metrics' })
  @ApiResponse({
    status: 200,
    description: 'Queue metrics retrieved successfully',
    schema: {
      properties: {
        waiting: { type: 'number' },
        active: { type: 'number' },
        completed: { type: 'number' },
        failed: { type: 'number' },
        delayed: { type: 'number' },
        paused: { type: 'number' },
      },
    },
  })
  async getQueueMetrics() {
    return this.queueService.getQueueMetrics();
  }

  /**
   * Get queue jobs
   */
  @Get('queue/jobs/:status')
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: 'Get automation queue jobs by status' })
  @ApiParam({
    name: 'status',
    enum: ['waiting', 'active', 'completed', 'failed', 'delayed'],
  })
  @ApiQuery({ name: 'start', required: false, type: Number })
  @ApiQuery({ name: 'end', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Queue jobs retrieved successfully' })
  async getQueueJobs(
    @Param('status') status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    @Query('start') start?: number,
    @Query('end') end?: number,
  ) {
    return this.queueService.getQueueJobs(status, start || 0, end || 10);
  }
}
