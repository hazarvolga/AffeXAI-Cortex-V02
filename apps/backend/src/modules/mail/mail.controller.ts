import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { IsEmail, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { MailService } from './mail.service';
import { MailChannel, MailPriority } from './interfaces/mail-service.interface';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

/**
 * Test Email DTO
 */
class SendTestEmailDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  to: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(998)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;
}

/**
 * Mail Controller
 * For testing and debugging email functionality
 */
@Controller('mail')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('settings.manage')
export class MailController {
  constructor(private readonly mailService: MailService) { }

  /**
   * Test connection to email provider
   */
  @Get('test-connection')
  async testConnection(@Request() req) {
    const tenantId = req.user.tenantId;
    const isConnected = await this.mailService.testConnection(tenantId);
    return {
      success: isConnected,
      message: isConnected
        ? 'Connection to email provider successful'
        : 'Failed to connect to email provider',
      tenantId,
    };
  }

  /**
   * Send a test email
   */
  @Post('send-test')
  async sendTestEmail(@Request() req, @Body() dto: SendTestEmailDto) {
    const tenantId = req.user.tenantId;

    if (dto.to.trim().toLowerCase() !== req.user.email?.trim().toLowerCase()) {
      throw new ForbiddenException('Test messages can only be sent to your own account');
    }
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
    const result = await this.mailService.sendMail({
      to: { email: dto.to },
      subject: dto.subject,
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Test Email from AffeXAI Cortex</h1>
              </div>
              <div class="content">
                <p>Hello!</p>
                <p>${escapeHtml(dto.message)}</p>
                <p>This is a test email sent from the AffeXAI Cortex email infrastructure.</p>
                <p><strong>Tenant ID:</strong> ${escapeHtml(tenantId)}</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              </div>
              <div class="footer">
                <p>This is a test email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} AffeXAI Cortex. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      channel: MailChannel.SYSTEM,
      priority: MailPriority.NORMAL,
      tags: ['test', 'system', `tenant:${tenantId}`],
    }, tenantId);

    if (result?.success !== true) throw new ServiceUnavailableException('Test email delivery failed');
    return {
      success: true,
      messageId: result.messageId,
      timestamp: result.timestamp,
      tenantId,
    };
  }
}
