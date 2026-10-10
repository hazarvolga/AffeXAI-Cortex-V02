import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { TrackingService, TrackingStats } from './tracking.service';

/**
 * Email Tracking Controller
 * Handles pixel tracking for email opens and link click tracking
 */
@Controller('email-marketing/track')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * Track email open via 1x1 pixel
   * GET /api/email-marketing/track/open/:trackingId
   */
  @Get('open/:trackingId')
  @HttpCode(HttpStatus.OK)
  async trackOpen(
    @Param('trackingId') trackingId: string,
    @Headers('user-agent') userAgent: string,
    @Headers('x-forwarded-for') forwardedFor: string,
    @Headers('x-real-ip') realIp: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Extract IP address
      const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
      
      // Track the open event
      await this.trackingService.trackEmailOpen(trackingId, {
        userAgent,
        ipAddress,
        timestamp: new Date(),
      });
    } catch (error) {
      // Silently fail - don't break email display
      console.error('Error tracking email open:', error);
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    res.send(pixel);
  }

  /**
   * Track link click and redirect
   * GET /api/email-marketing/track/click/:trackingId?url=...
   */
  @Get('click/:trackingId')
  async trackClick(
    @Param('trackingId') trackingId: string,
    @Query('url') originalUrl: string,
    @Headers('user-agent') userAgent: string,
    @Headers('x-forwarded-for') forwardedFor: string,
    @Headers('x-real-ip') realIp: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Extract IP address
      const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
      
      // Track the click event
      await this.trackingService.trackEmailClick(trackingId, {
        userAgent,
        ipAddress,
        originalUrl,
        timestamp: new Date(),
      });
    } catch (error) {
      // Silently fail - still redirect user
      console.error('Error tracking email click:', error);
    }

    // Redirect to original URL
    if (originalUrl) {
      res.redirect(302, decodeURIComponent(originalUrl));
    } else {
      res.status(404).send('URL not found');
    }
  }

  /**
   * Generate tracking URLs for email content
   * POST /api/email-marketing/track/generate
   */
  @Post('generate')
  async generateTrackingUrls(
    @Query('campaignId') campaignId: string,
    @Query('recipientEmail') recipientEmail: string,
  ): Promise<{
    trackingId: string;
    pixelUrl: string;
    linkWrapper: (url: string) => string;
  }> {
    const trackingData = await this.trackingService.generateTrackingData(
      campaignId,
      recipientEmail,
    );

    return {
      trackingId: trackingData.trackingId,
      pixelUrl: trackingData.pixelUrl,
      linkWrapper: trackingData.linkWrapper,
    };
  }

  /**
   * Get tracking statistics for a campaign
   * GET /api/email-marketing/track/stats/:campaignId
   */
  @Get('stats/:campaignId')
  async getTrackingStats(@Param('campaignId') campaignId: string): Promise<TrackingStats> {
    return this.trackingService.getTrackingStats(campaignId);
  }
}