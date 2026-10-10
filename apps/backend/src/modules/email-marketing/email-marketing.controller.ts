import { SendMarketingEmailDto, SendCampaignEmailDto } from './dto/send-marketing-email.dto';
import { PlatformAdminGuard } from '../../core/auth/guards/platform-admin.guard';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { Controller, Post, Body, Get } from '@nestjs/common';
import { EmailMarketingService } from './email-marketing.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@Controller('email-marketing')
export class EmailMarketingController {
  constructor(private readonly emailService: EmailMarketingService) {}

  @Post('send')
  async sendEmail(@Body() emailData: SendMarketingEmailDto) {
    await this.emailService.sendEmail(emailData.to, emailData.subject, emailData.body);
    return { message: 'Email queued successfully' };
  }

  @Post('campaign/send')
  async sendCampaignEmail(@Body() campaignData: SendCampaignEmailDto) {
    await this.emailService.sendCampaignEmail(
      campaignData.to, 
      campaignData.subject, 
      campaignData.body, 
      campaignData.campaignId, 
      campaignData.recipientId
    );
    return { message: 'Campaign email queued successfully' };
  }

  @Get('queue/status')
  @UseGuards(PlatformAdminGuard)
  async getQueueStatus() {
    return await this.emailService.getQueueStatus();
  }
}
