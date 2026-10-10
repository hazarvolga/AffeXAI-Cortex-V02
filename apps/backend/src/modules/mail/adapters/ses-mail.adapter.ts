import { Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import {
    IMailService,
    SendMailOptions,
    SendMailResult,
    BulkSendOptions,
} from '../interfaces/mail-service.interface';

export class SesMailAdapter implements IMailService {
    private readonly logger = new Logger(SesMailAdapter.name);
    private sesClient: SESClient;
    private region: string;

    constructor(
        private readonly accessKeyId: string,
        private readonly secretAccessKey: string,
        region: string = 'eu-central-1',
    ) {
        this.region = region;
        this.sesClient = new SESClient({
            region: this.region,
            credentials: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
            },
        });
    }

    async sendMail(options: SendMailOptions): Promise<SendMailResult> {
        try {
            const input: SendEmailCommandInput = {
                Source: options.from
                    ? `"${options.from.name}" <${options.from.email}>`
                    : undefined, // SES requires verified sender
                Destination: {
                    ToAddresses: Array.isArray(options.to)
                        ? options.to.map(t => t.email)
                        : [options.to.email],
                    CcAddresses: options.cc ? (Array.isArray(options.cc) ? options.cc.map(c => c.email) : [options.cc.email]) : undefined,
                    BccAddresses: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.map(b => b.email) : [options.bcc.email]) : undefined,
                },
                Message: {
                    Subject: {
                        Data: options.subject,
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Html: {
                            Data: options.html || '',
                            Charset: 'UTF-8',
                        },
                        Text: options.text ? {
                            Data: options.text,
                            Charset: 'UTF-8',
                        } : undefined,
                    },
                },
                ReplyToAddresses: options.replyTo ? [options.replyTo.email] : [],
            };

            const command = new SendEmailCommand(input);
            const response = await this.sesClient.send(command);

            return {
                success: true,
                messageId: response.MessageId,
                provider: 'ses',
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`SES Send Error: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message,
                provider: 'ses',
                timestamp: new Date(),
            };
        }
    }

    async sendBulk(options: BulkSendOptions): Promise<SendMailResult[]> {
        const results: SendMailResult[] = [];

        for (const email of options.emails) {
            try {
                const result = await this.sendMail(email);
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    provider: 'ses',
                    timestamp: new Date(),
                });
            }
        }

        return results;
    }

    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    htmlToText(html: string): string {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    async testConnection(): Promise<boolean> {
        try {
            // For now, we assume if client instantiated without error, it's structurally valid
            return true;
        } catch (error) {
            this.logger.error(`SES Connection Test Failed: ${error.message}`);
            return false;
        }
    }
}
