import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  Req,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { TrackingService, TrackingStats } from "./tracking.service";

/**
 * Email Tracking Controller
 * Handles pixel tracking for email opens and link click tracking
 */
@Controller("email-marketing/track")
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(private readonly trackingService: TrackingService) {}

  /**
   * Track email open via 1x1 pixel
   * GET /api/email-marketing/track/open/:trackingId
   */
  @Get("open/:trackingId")
  @HttpCode(HttpStatus.OK)
  async trackOpen(
    @Param("trackingId") trackingId: string,
    @Headers("user-agent") userAgent: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // req.ip honours the trusted proxy policy; raw forwarding headers can be forged.
      await this.trackingService.trackEmailOpen(trackingId, {
        userAgent,
        ipAddress: req.ip || "unknown",
        timestamp: new Date(),
      });
    } catch (error) {
      // Tracking must never break email display.
      this.logger.warn(
        `Open tracking failed for ${trackingId}: ${(error as Error).message}`,
      );
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    );

    res.set({
      "Content-Type": "image/png",
      "Content-Length": pixel.length.toString(),
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.send(pixel);
  }

  /**
   * Track link click and redirect
   * GET /api/email-marketing/track/click/:trackingId?url=...
   */
  @Get("click/:trackingId")
  async trackClick(
    @Param("trackingId") trackingId: string,
    @Query("url") originalUrl: string,
    @Query("sig") signature: string | undefined,
    @Headers("user-agent") userAgent: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Only targets this service wrapped are followed; anything else would be an open redirect.
    const target = await this.trackingService.resolveClickTarget(
      trackingId,
      originalUrl,
      signature,
    );
    if (!target) {
      res.status(404).send("Link not found");
      return;
    }

    try {
      await this.trackingService.trackEmailClick(trackingId, {
        userAgent,
        // req.ip honours the trusted proxy policy; raw forwarding headers can be forged.
        ipAddress: req.ip || "unknown",
        originalUrl: target,
        timestamp: new Date(),
      });
    } catch (error) {
      // Tracking must never block the reader; still redirect.
      this.logger.warn(
        `Click tracking failed for ${trackingId}: ${(error as Error).message}`,
      );
    }

    res.redirect(302, target);
  }

  /**
   * Generate tracking URLs for email content
   * POST /api/email-marketing/track/generate
   */
  @Post("generate")
  async generateTrackingUrls(
    @Query("campaignId") campaignId: string,
    @Query("recipientEmail") recipientEmail: string,
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
  @Get("stats/:campaignId")
  async getTrackingStats(
    @Param("campaignId") campaignId: string,
  ): Promise<TrackingStats> {
    return this.trackingService.getTrackingStats(campaignId);
  }
}
