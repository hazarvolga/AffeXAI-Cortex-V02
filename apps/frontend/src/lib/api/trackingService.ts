import { httpClient } from './http-client';

// Tracking Types
export interface TrackingStats {
  campaignId: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  uniqueOpens: number;
  uniqueClicks: number;
  recentOpens: Array<{
    recipientEmail: string;
    openedAt: string;
    userAgent?: string;
    ipAddress?: string;
  }>;
  recentClicks: Array<{
    recipientEmail: string;
    clickedAt: string;
    originalUrl?: string;
    userAgent?: string;
    ipAddress?: string;
  }>;
}

export interface TrackingData {
  trackingId: string;
  pixelUrl: string;
  linkWrapper: (url: string) => string;
}

/**
 * Email Tracking Service
 * Handles email tracking operations
 */
class TrackingService {
  private readonly endpoint = '/email-marketing/track';

  /**
   * Generate tracking URLs for email content
   */
  async generateTrackingUrls(
    campaignId: string,
    recipientEmail: string,
  ): Promise<TrackingData> {
    return httpClient.postWrapped<TrackingData>(
      `${this.endpoint}/generate?campaignId=${campaignId}&recipientEmail=${encodeURIComponent(recipientEmail)}`
    );
  }

  /**
   * Get tracking statistics for a campaign
   */
  async getTrackingStats(campaignId: string): Promise<TrackingStats> {
    return httpClient.getWrapped<TrackingStats>(`${this.endpoint}/stats/${campaignId}`);
  }

  /**
   * Process email content to add tracking
   */
  processEmailContent(
    htmlContent: string,
    trackingData: TrackingData,
  ): string {
    let processedContent = htmlContent;

    // Add tracking pixel before closing body tag
    const trackingPixel = `<img src="${trackingData.pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
    
    if (processedContent.includes('</body>')) {
      processedContent = processedContent.replace('</body>', `${trackingPixel}</body>`);
    } else {
      processedContent += trackingPixel;
    }

    // Wrap all links with tracking
    processedContent = processedContent.replace(
      /href="([^"]+)"/g,
      (match, url) => {
        // Skip tracking URLs and mailto links
        if (url.includes('/track/') || url.startsWith('mailto:') || url.startsWith('#')) {
          return match;
        }
        return `href="${trackingData.linkWrapper(url)}"`;
      }
    );

    return processedContent;
  }

  /**
   * Generate tracking pixel URL
   */
  generatePixelUrl(trackingId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006';
    return `${baseUrl}/api/email-marketing/track/open/${trackingId}`;
  }

  /**
   * Generate click tracking URL
   */
  generateClickUrl(trackingId: string, originalUrl: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006';
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${baseUrl}/api/email-marketing/track/click/${trackingId}?url=${encodedUrl}`;
  }

  /**
   * Extract tracking metrics from stats
   */
  getTrackingMetrics(stats: TrackingStats) {
    return {
      deliveryRate: stats.totalSent > 0 ? 100 : 0, // Assuming all sent emails are delivered
      openRate: stats.openRate,
      clickRate: stats.clickRate,
      clickThroughRate: stats.totalOpened > 0 ? (stats.totalClicked / stats.totalOpened) * 100 : 0,
      engagement: {
        totalSent: stats.totalSent,
        totalOpened: stats.totalOpened,
        totalClicked: stats.totalClicked,
        uniqueOpens: stats.uniqueOpens,
        uniqueClicks: stats.uniqueClicks,
      },
    };
  }

  /**
   * Format tracking data for display
   */
  formatTrackingData(stats: TrackingStats) {
    return {
      overview: {
        sent: stats.totalSent.toLocaleString(),
        opened: stats.totalOpened.toLocaleString(),
        clicked: stats.totalClicked.toLocaleString(),
        openRate: `${stats.openRate.toFixed(2)}%`,
        clickRate: `${stats.clickRate.toFixed(2)}%`,
      },
      recentActivity: {
        opens: stats.recentOpens.map(open => ({
          email: this.maskEmail(open.recipientEmail),
          timestamp: new Date(open.openedAt).toLocaleString(),
          device: this.extractDevice(open.userAgent),
        })),
        clicks: stats.recentClicks.map(click => ({
          email: this.maskEmail(click.recipientEmail),
          timestamp: new Date(click.clickedAt).toLocaleString(),
          url: click.originalUrl,
          device: this.extractDevice(click.userAgent),
        })),
      },
    };
  }

  /**
   * Mask email for privacy
   */
  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    
    const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Extract device info from user agent
   */
  private extractDevice(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    
    return 'Desktop';
  }
}

export const trackingService = new TrackingService();
export default trackingService;