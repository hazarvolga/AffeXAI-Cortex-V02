import { Injectable, Logger } from '@nestjs/common';
import { AiService, AiGenerationOptions } from './ai.service';
import { SettingsService } from '../settings/settings.service';

export interface EmailGenerationContext {
  campaignName?: string;
  targetAudience?: string;
  productName?: string;
  productDescription?: string;
  callToAction?: string;
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'urgent' | 'friendly';
  keywords?: string[];
}

export interface EmailSubjectResult {
  subject: string;
  tokensUsed: number;
}

export interface EmailBodyResult {
  htmlBody: string;
  plainTextBody: string;
  tokensUsed: number;
}

@Injectable()
export class AiEmailService {
  private readonly logger = new Logger(AiEmailService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly settingsService: SettingsService,
  ) { }

  /**
   * Generate email subject line using AI
   * 
   * @param context - Campaign and product context
   * @param count - Number of subject variations to generate
   * @returns Array of subject line suggestions
   */
  async generateSubjectLines(
    context: EmailGenerationContext,
    tenantId: string,
    count: number = 5,
  ): Promise<string[]> {
    this.logger.log('Generating email subject lines with AI');

    // Get API key and model from settings
    const configuration = await this.settingsService.getAiModuleConfiguration('emailMarketing', tenantId);
    const apiKey = configuration.apiKey;
    if (!apiKey) {
      throw new Error('AI Email Marketing is not configured. Please add API key in Settings.');
    }

    const model = configuration.model;

    // Build context-aware prompt
    const prompt = this.buildSubjectPrompt(context, count);
    const systemPrompt = this.getSubjectSystemPrompt(context.tone);

    try {
      const result = await this.aiService.generateCompletion(apiKey, prompt, {
        model,
        provider: configuration.provider,
        credentialContext: {
          tenantId,
          module: 'emailMarketing',
          provider: configuration.provider,
          revision: configuration.revision,
        },
        temperature: 0.8, // Higher creativity for subjects
        maxTokens: 300,
        systemPrompt,
      });

      // Parse subject lines from response
      const subjects = this.parseSubjectLines(result.content);

      this.logger.log(
        `Generated ${subjects.length} subject lines using ${result.tokensUsed} tokens`,
      );

      return subjects;
    } catch (error) {
      this.logger.error('Failed to generate subject lines:', error);
      throw error;
    }
  }

  /**
   * Generate email body content using AI
   * 
   * @param subject - Email subject line
   * @param context - Campaign and product context
   * @returns HTML and plain text versions of email body
   */
  async generateEmailBody(
    subject: string,
    context: EmailGenerationContext,
    tenantId: string,
  ): Promise<EmailBodyResult> {
    this.logger.log('Generating email body with AI');

    const configuration = await this.settingsService.getAiModuleConfiguration('emailMarketing', tenantId);
    const apiKey = configuration.apiKey;
    if (!apiKey) {
      throw new Error('AI Email Marketing is not configured. Please add API key in Settings.');
    }

    const model = configuration.model;

    const prompt = this.buildBodyPrompt(subject, context);
    const systemPrompt = this.getBodySystemPrompt(context.tone);

    try {
      const result = await this.aiService.generateCompletion(apiKey, prompt, {
        model,
        provider: configuration.provider,
        credentialContext: {
          tenantId,
          module: 'emailMarketing',
          provider: configuration.provider,
          revision: configuration.revision,
        },
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt,
      });

      // Extract HTML and plain text from response
      const emailBody = this.parseEmailBody(result.content);

      this.logger.log(
        `Generated email body using ${result.tokensUsed} tokens`,
      );

      return {
        ...emailBody,
        tokensUsed: result.tokensUsed,
      };
    } catch (error) {
      this.logger.error('Failed to generate email body:', error);
      throw error;
    }
  }

  /**
   * Build subject line generation prompt
   */
  private buildSubjectPrompt(context: EmailGenerationContext, count: number): string {
    let prompt = `Generate ${count} compelling email subject lines for a marketing campaign.\n\n`;

    if (context.campaignName) {
      prompt += `Campaign: ${context.campaignName}\n`;
    }

    if (context.productName) {
      prompt += `Product: ${context.productName}\n`;
    }

    if (context.productDescription) {
      prompt += `About: ${context.productDescription}\n`;
    }

    if (context.targetAudience) {
      prompt += `Target Audience: ${context.targetAudience}\n`;
    }

    if (context.keywords && context.keywords.length > 0) {
      prompt += `Keywords to include: ${context.keywords.join(', ')}\n`;
    }

    if (context.callToAction) {
      prompt += `Goal: ${context.callToAction}\n`;
    }

    prompt += `\nRequirements:
- Keep subject lines between 30-60 characters
- Make them action-oriented and engaging
- Create urgency or curiosity
- Avoid spam trigger words
- Return only the subject lines, numbered 1-${count}
- No explanations or additional text`;

    return prompt;
  }

  /**
   * Build email body generation prompt
   */
  private buildBodyPrompt(subject: string, context: EmailGenerationContext): string {
    let prompt = `Write a professional email marketing message with the following subject line:\n"${subject}"\n\n`;

    if (context.productName) {
      prompt += `Product: ${context.productName}\n`;
    }

    if (context.productDescription) {
      prompt += `Product Details: ${context.productDescription}\n`;
    }

    if (context.targetAudience) {
      prompt += `Target Audience: ${context.targetAudience}\n`;
    }

    if (context.callToAction) {
      prompt += `Call to Action: ${context.callToAction}\n`;
    }

    prompt += `\nRequirements:
- Write in HTML format with proper structure
- Include a strong opening paragraph
- Highlight key benefits or features
- Add a clear call-to-action button/link
- Keep it concise (200-400 words)
- Use professional formatting
- Do NOT include <html>, <head>, or <body> tags (just the content)
- After the HTML, provide a plain text version separated by "---PLAIN TEXT---"`;

    return prompt;
  }

  /**
   * Get system prompt for subject line generation
   */
  private getSubjectSystemPrompt(tone?: string): string {
    const toneInstruction = tone
      ? `Use a ${tone} tone throughout.`
      : 'Use a professional and engaging tone.';

    return `You are an expert email marketing copywriter specializing in high-converting subject lines. 
${toneInstruction}
Focus on clarity, emotional appeal, and driving opens.
Avoid clickbait and spam trigger words.`;
  }

  /**
   * Get system prompt for email body generation
   */
  private getBodySystemPrompt(tone?: string): string {
    const toneInstruction = tone
      ? `Use a ${tone} tone throughout.`
      : 'Use a professional and persuasive tone.';

    return `You are an expert email marketing copywriter creating high-converting email campaigns.
${toneInstruction}
Write clear, benefit-focused copy that drives action.
Use proper HTML formatting with clean, modern design principles.`;
  }

  /**
   * Parse subject lines from AI response
   */
  private parseSubjectLines(response: string): string[] {
    // Extract numbered lines
    const lines = response.split('\n').filter((line) => line.trim());
    const subjects: string[] = [];

    for (const line of lines) {
      // Match patterns like "1. Subject" or "1) Subject" or just "Subject"
      const match = line.match(/^\d+[.)]\s*(.+)$/) || [null, line.trim()];
      if (match[1] && match[1].length > 0) {
        subjects.push(match[1].trim().replace(/^["']|["']$/g, '')); // Remove quotes
      }
    }

    return subjects.filter((s) => s.length > 0);
  }

  /**
   * Parse email body HTML and plain text from AI response
   */
  private parseEmailBody(response: string): {
    htmlBody: string;
    plainTextBody: string;
  } {
    const separator = '---PLAIN TEXT---';
    const parts = response.split(separator);

    let htmlBody = parts[0].trim();
    let plainTextBody = parts[1]?.trim() || this.stripHtml(htmlBody);

    // Clean up HTML (remove any accidental html/body tags)
    htmlBody = htmlBody
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<\/?head[^>]*>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '')
      .trim();

    return {
      htmlBody,
      plainTextBody,
    };
  }

  /**
   * Strip HTML tags for plain text fallback
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
