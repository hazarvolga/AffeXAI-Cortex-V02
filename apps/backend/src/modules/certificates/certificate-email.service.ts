import { Injectable, Logger } from "@nestjs/common";
import { Certificate } from "./entities/certificate.entity";
import { join } from "path";
import { readFileSync } from "fs";
import { MailService } from "../mail/mail.service";
import {
  MailChannel,
  MailPriority,
} from "../mail/interfaces/mail-service.interface";

@Injectable()
export class CertificateEmailService {
  private readonly logger = new Logger(CertificateEmailService.name);

  constructor(private readonly mailService: MailService) {
    this.logger.log("Certificate email service initialized with MailService");
  }

  /**
   * Send certificate email with PDF attachment
   */
  async sendCertificateEmail(certificate: Certificate): Promise<void> {
    try {
      if (!certificate.pdfUrl) {
        throw new Error("Certificate PDF not generated yet");
      }

      if (!certificate.recipientEmail) {
        throw new Error("Recipient email is required");
      }

      // Read PDF file as buffer
      const pdfPath = this.getPdfFilePath(certificate.pdfUrl);
      const pdfBuffer = readFileSync(pdfPath);

      // Send via MailService
      const result = await this.mailService.sendMail({
        to: {
          email: certificate.recipientEmail,
          name: certificate.recipientName || undefined,
        },
        subject: `Sertifikanız: ${certificate.trainingTitle || "Sertifika"}`,
        html: this.generateEmailHtml(certificate),
        channel: MailChannel.CERTIFICATE,
        priority: MailPriority.HIGH,
        attachments: [
          {
            filename: `sertifika-${certificate.certificateNumber}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
        tags: ["certificate", certificate.certificateNumber],
      });

      if (!result.success) {
        throw new Error(result.error || "Email sending failed");
      }

      this.logger.log(
        `Certificate email sent to ${certificate.recipientEmail}, messageId: ${result.messageId}`,
      );
    } catch (error: unknown) {
      this.logger.error("Failed to send certificate email", error);
      const reason = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Email sending failed: ${reason}`);
    }
  }

  /**
   * Generate email HTML content
   */
  private generateEmailHtml(certificate: Certificate): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .certificate-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎓 Tebrikler ${certificate.recipientName}!</h1>
        </div>
        <div class="content">
          <p>Merhaba ${certificate.recipientName},</p>
          
          <p><strong>${certificate.trainingTitle}</strong> eğitimini başarıyla tamamladığınız için sizi kutlarız!</p>
          
          <div class="certificate-info">
            <h3>Sertifika Bilgileri</h3>
            <ul>
              <li><strong>Sertifika No:</strong> ${certificate.certificateNumber}</li>
              <li><strong>Eğitim:</strong> ${certificate.trainingTitle}</li>
              <li><strong>Veriliş Tarihi:</strong> ${new Date(certificate.issuedAt).toLocaleDateString("tr-TR")}</li>
              ${certificate.validUntil ? `<li><strong>Geçerlilik:</strong> ${new Date(certificate.validUntil).toLocaleDateString("tr-TR")} tarihine kadar</li>` : ""}
            </ul>
          </div>

          ${certificate.description ? `<p><em>${certificate.description}</em></p>` : ""}
          
          <p>Sertifikanız bu e-postaya eklenmiştir. Ayrıca hesap panelinizden her zaman erişebilirsiniz.</p>
          
          <center>
            <a href="${process.env.FRONTEND_URL || "http://localhost:9002"}${certificate.verificationUrl}" class="button">
              Sertifikayı Doğrula
            </a>
          </center>

          <p>Bu sertifika, kariyerinizde ve profesyonel gelişiminizde önemli bir adım olacaktır.</p>
          
          <p>Başarılarınızın devamını dileriz!</p>

          <div class="footer">
            <p><strong>XYZ Company Eğitim Platformu</strong></p>
            <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
            <p>© ${new Date().getFullYear()} XYZ Company. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get PDF file path from URL
   */
  private getPdfFilePath(pdfUrl: string): string {
    // If URL is relative, convert to absolute file path
    if (pdfUrl.startsWith("/uploads/")) {
      return join(process.cwd(), pdfUrl.substring(1));
    }

    // If it's already an absolute path or external URL, return as is
    return pdfUrl;
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      const isConnected = await this.mailService.testConnection();
      if (isConnected) {
        this.logger.log("Mail service connection verified");
      } else {
        this.logger.error("Mail service connection failed");
      }
      return isConnected;
    } catch (error) {
      this.logger.error("Mail service connection test failed", error);
      return false;
    }
  }
}
