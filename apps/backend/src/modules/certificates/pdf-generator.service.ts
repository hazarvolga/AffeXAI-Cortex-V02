import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CertificateTemplate } from './entities/certificate-template.entity';
import { S3Service } from '../media/s3.service';

interface CertificateData {
  recipientName: string | null;
  recipientEmail: string | null;
  trainingTitle: string | null;
  description?: string | null;
  issuedAt: string;
  validUntil?: string | null;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  certificateNumber?: string | null;
  eventId?: string | null;
  [key: string]: any; // Allow custom variables
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  constructor(
    private readonly s3Service: S3Service,
  ) { }

  /**
   * Generate PDF from HTML template and certificate data
   */
  async generateCertificatePdf(
    template: CertificateTemplate,
    data: CertificateData,
    certificateId: string,
    tenantId: string,
  ): Promise<string> {
    try {
      this.logger.log(`Generating PDF for certificate ${certificateId}`);

      // 1. Compile Handlebars template
      const compiledTemplate = Handlebars.compile(template.htmlContent);

      // 2. Prepare data with formatted dates
      const formattedIssuedAt = this.formatDate(data.issuedAt);

      // Fetch company information from site settings
      let companyName = 'AFFEX Technology Solutions';
      let companyAddress = 'Example Street 123\n34000 Istanbul\nTurkey';

      try {
        const settingsResponse = await fetch('http://localhost:9005/api/settings/site');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          companyName = settings.companyName || companyName;
          companyAddress = settings.contact?.address || companyAddress;
        }
      } catch (error) {
        this.logger.warn('Failed to fetch site settings, using defaults', error);
      }

      const templateData = {
        ...data,
        issuedAt: formattedIssuedAt,
        issueDate: formattedIssuedAt, // Backward compatibility for templates
        validUntil: data.validUntil ? this.formatDate(data.validUntil) : undefined,
        companyName,
        companyAddress,
        customLogoUrl: data.customLogoUrl,
        companyLogoUrl: data.companyLogoUrl,
        logoUrl: data.customLogoUrl || data.companyLogoUrl,
      };

      // Debug: Log template data to verify logo URLs
      this.logger.log('Template data:', JSON.stringify({
        customLogoUrl: templateData.customLogoUrl,
        companyLogoUrl: templateData.companyLogoUrl,
        logoUrl: (templateData as any).logoUrl,
      }, null, 2));

      const html = compiledTemplate(templateData);

      // 3. Generate PDF with Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      let pdfBuffer: Uint8Array;
      let generationFailed = false;
      try {
        const page = await browser.newPage();

        // Set content and wait for resources
        await page.setContent(html, {
          waitUntil: 'load',
          timeout: 30000,
        });
        await page.waitForNetworkIdle({ timeout: 30000 });

        pdfBuffer = await page.pdf({
          format: template.pageFormat as any || 'A4',
          landscape: template.orientation === 'landscape',
          printBackground: true,
          margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0'
          },
        });
      } catch (error) {
        generationFailed = true;
        throw error;
      } finally {
        try {
          await browser.close();
        } catch (closeError) {
          if (!generationFailed) throw closeError;
          this.logger.warn('Browser cleanup failed after PDF generation error', closeError);
        }
      }

      // 4. Upload to S3
      const filename = `certificate-${certificateId}-${Date.now()}.pdf`;
      const s3FileName = `certificates/${filename}`;

      this.logger.log(`Uploading certificate to S3: ${s3FileName}`);

      // Use mimeType 'application/pdf'
      const pdfUrl = await this.s3Service.uploadFile(s3FileName, Buffer.from(pdfBuffer), 'application/pdf', tenantId);

      this.logger.log(`PDF generated and uploaded successfully: ${pdfUrl}`);
      return pdfUrl;

    } catch (error) {
      this.logger.error('PDF generation failed', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Format date for template
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('tr-TR', options);
  }

  /**
   * Delete PDF file
   */
  async deletePdf(pdfUrl: string, tenantId: string): Promise<void> {
    try {
      // Extract key from URL
      if (pdfUrl.startsWith('http')) {
        const url = new URL(pdfUrl);
        const pathParts = url.pathname.split('/');
        // Assuming path style: /bucket/key
        if (pathParts.length >= 3) {
          const key = pathParts.slice(2).join('/');
          await this.s3Service.deleteFile(key, tenantId);
          this.logger.log(`PDF deleted from S3: ${key}`);
          return;
        }
      }
      this.logger.warn(`Could not determine S3 key for deletion: ${pdfUrl}`);
    } catch (error) {
      this.logger.error('Failed to delete PDF', error);
    }
  }

  /**
   * Check if PDF exists
   */
  async pdfExists(pdfUrl: string): Promise<boolean> {
    // S3 check not implemented in S3Service yet, but if URL exists it's likely there.
    // For now returning true if valid URL.
    return !!pdfUrl;
  }
}
