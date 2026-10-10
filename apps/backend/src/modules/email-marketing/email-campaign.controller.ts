import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { EmailCampaignService } from './email-campaign.service';
import { CampaignSchedulerService } from './campaign-scheduler.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { EmailCampaign } from './entities/email-campaign.entity';

@Controller('email-campaigns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
export class EmailCampaignController {
  constructor(
    private readonly campaignService: EmailCampaignService,
    private readonly schedulerService: CampaignSchedulerService,
  ) { }

  @Post()
  async create(@Body() createCampaignDto: CreateCampaignDto): Promise<EmailCampaign> {
    return await this.campaignService.create(createCampaignDto);
  }

  @Get()
  async findAll(): Promise<EmailCampaign[]> {
    return await this.campaignService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EmailCampaign> {
    return await this.campaignService.findOne(id);
  }

  @Get('by-slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<EmailCampaign> {
    return await this.campaignService.findBySlug(slug);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ): Promise<EmailCampaign> {
    return await this.campaignService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return await this.campaignService.remove(id);
  }

  @Post(':id/send')
  async sendCampaign(@Param('id') id: string): Promise<{ message: string }> {
    await this.campaignService.sendCampaign(id);
    return { message: 'Campaign queued for sending' };
  }

  @Get(':id/stats')
  async getCampaignStats(@Param('id') id: string): Promise<any> {
    return await this.campaignService.getCampaignStats(id);
  }

  @Post(':id/schedule')
  async scheduleCampaign(
    @Param('id') id: string,
    @Body() body: { scheduledAt: string },
  ): Promise<EmailCampaign> {
    const scheduledAt = new Date(body.scheduledAt);
    return await this.schedulerService.scheduleCampaign(id, scheduledAt);
  }

  @Post(':id/cancel-schedule')
  async cancelSchedule(@Param('id') id: string): Promise<EmailCampaign> {
    return await this.schedulerService.cancelScheduledCampaign(id);
  }

  @Post(':id/reschedule')
  async rescheduleCampaign(
    @Param('id') id: string,
    @Body() body: { scheduledAt: string },
  ): Promise<EmailCampaign> {
    const newScheduledAt = new Date(body.scheduledAt);
    return await this.schedulerService.rescheduleCampaign(id, newScheduledAt);
  }

  @Get('scheduled/list')
  async getScheduledCampaigns(): Promise<EmailCampaign[]> {
    return await this.schedulerService.getScheduledCampaigns();
  }

  @Get('scheduled/stats')
  async getSchedulingStats(): Promise<{
    totalScheduled: number;
    readyToSend: number;
    upcomingToday: number;
    upcomingThisWeek: number;
  }> {
    return await this.schedulerService.getSchedulingStats();
  }
}