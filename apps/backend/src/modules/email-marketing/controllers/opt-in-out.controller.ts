import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { OptInOutService } from '../services/opt-in-out.service';
import type { Request } from 'express';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('email-marketing/subscription')
export class OptInOutController {
  constructor(private readonly optInOutService: OptInOutService) {}

  private assertOwner(email: string, authenticatedEmail: string) {
    if (typeof email !== 'string' || typeof authenticatedEmail !== 'string' || email.trim().toLowerCase() !== authenticatedEmail.trim().toLowerCase()) throw new ForbiddenException('Own subscription only');
  }

  /**
   * Subscribe with double opt-in
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @Body() body: {
      email: string;
      firstName?: string;
      lastName?: string;
      company?: string;
      marketingEmails?: boolean;
    },
    @Req() req?: Request,
  ) {
    const ipAddress = req?.ip || 'unknown';

    return this.optInOutService.subscribeWithDoubleOptIn(
      body.email,
      {
        firstName: body.firstName,
        lastName: body.lastName,
        company: body.company,
        marketingEmails: body.marketingEmails,
      },
      ipAddress,
    );
  }

  /**
   * Confirm opt-in via email token
   */
  @Post('confirm/:token')
  async confirmOptIn(
    @Param('token') token: string,
    @Req() req?: Request,
  ) {
    const ipAddress = req?.ip || 'unknown';
    return this.optInOutService.confirmOptIn(token, ipAddress);
  }

  /**
   * Unsubscribe via token (one-click)
   */
  @Post('unsubscribe/:token')
  async unsubscribeWithToken(
    @Param('token') token: string,
    @Query('reason') reason?: string,
    @Req() req?: Request,
  ) {
    const ipAddress = req?.ip || 'unknown';
    return this.optInOutService.unsubscribeWithToken(token, reason, ipAddress);
  }

  /**
   * Re-subscribe
   */
  @Post('resubscribe')
  @HttpCode(HttpStatus.OK)
  async resubscribe(
    @Body('email') email: string,
    @Req() req?: Request,
  ) {
    const ipAddress = req?.ip || 'unknown';
    return this.optInOutService.resubscribe(email, ipAddress);
  }

  /**
   * Update preferences
   */
  @UseGuards(JwtAuthGuard)
  @Put('preferences')
  async updatePreferences(
    @CurrentUser('email') authenticatedEmail: string,
    @Body() body: {
      email: string;
      marketingEmails?: boolean;
      emailNotifications?: boolean;
    },
  ) {
    this.assertOwner(body.email, authenticatedEmail);
    return this.optInOutService.updatePreferences(authenticatedEmail, {
      marketingEmails: body.marketingEmails,
      emailNotifications: body.emailNotifications,
    });
  }

  /**
   * Get preferences
   */
  @UseGuards(JwtAuthGuard)
  @Get('preferences/:email')
  async getPreferences(@Param('email') email: string, @CurrentUser('email') authenticatedEmail: string) {
    this.assertOwner(email, authenticatedEmail);
    return this.optInOutService.getPreferences(email);
  }

  /**
   * Check if can receive marketing emails
   */
  @UseGuards(JwtAuthGuard)
  @Get('can-receive-marketing/:email')
  async canReceiveMarketingEmails(@Param('email') email: string, @CurrentUser('email') authenticatedEmail: string) {
    this.assertOwner(email, authenticatedEmail);
    const canReceive = await this.optInOutService.canReceiveMarketingEmails(email);
    return { email, canReceive };
  }

  /**
   * Check if can receive transactional emails
   */
  @UseGuards(JwtAuthGuard)
  @Get('can-receive-transactional/:email')
  async canReceiveTransactionalEmails(@Param('email') email: string, @CurrentUser('email') authenticatedEmail: string) {
    this.assertOwner(email, authenticatedEmail);
    const canReceive = await this.optInOutService.canReceiveTransactionalEmails(email);
    return { email, canReceive };
  }
}