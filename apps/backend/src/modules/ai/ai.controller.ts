import { Controller, Post, Body, HttpException, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { IsString, IsOptional, IsEnum, IsArray, IsInt, Min, Max } from 'class-validator';
import { AiEmailService, EmailGenerationContext } from './ai-email.service';

export class GenerateSubjectDto {
  @IsOptional()
  @IsString()
  campaignName?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsOptional()
  @IsString()
  callToAction?: string;

  @IsOptional()
  @IsEnum(['professional', 'casual', 'enthusiastic', 'urgent', 'friendly'])
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'urgent' | 'friendly';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  count?: number;
}

export class GenerateBodyDto {
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  campaignName?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsOptional()
  @IsString()
  callToAction?: string;

  @IsOptional()
  @IsEnum(['professional', 'casual', 'enthusiastic', 'urgent', 'friendly'])
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'urgent' | 'friendly';
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiEmailService: AiEmailService) { }

  /**
   * Generate email subject lines using AI
   * POST /api/ai/email/generate-subject
   */
  @Post('email/generate-subject')
  async generateSubject(@Body() dto: GenerateSubjectDto, @Req() req: any) {
    try {
      const context: EmailGenerationContext = {
        campaignName: dto.campaignName,
        targetAudience: dto.targetAudience,
        productName: dto.productName,
        productDescription: dto.productDescription,
        callToAction: dto.callToAction,
        tone: dto.tone,
        keywords: dto.keywords,
      };

      const subjects = await this.aiEmailService.generateSubjectLines(
        context,
        req.user.tenantId,
        dto.count || 5,
      );

      return {
        success: true,
        data: {
          subjects,
          count: subjects.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: {
            message: error.message,
            code: 'AI_GENERATION_FAILED',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate email body content using AI
   * POST /api/ai/email/generate-body
   */
  @Post('email/generate-body')
  async generateBody(@Body() dto: GenerateBodyDto, @Req() req: any) {
    try {
      const context: EmailGenerationContext = {
        campaignName: dto.campaignName,
        targetAudience: dto.targetAudience,
        productName: dto.productName,
        productDescription: dto.productDescription,
        callToAction: dto.callToAction,
        tone: dto.tone,
      };

      const result = await this.aiEmailService.generateEmailBody(
        dto.subject,
        context,
        req.user.tenantId,
      );

      return {
        success: true,
        data: {
          htmlBody: result.htmlBody,
          plainTextBody: result.plainTextBody,
          tokensUsed: result.tokensUsed,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: {
            message: error.message,
            code: 'AI_GENERATION_FAILED',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate both subject and body in one request
   * POST /api/ai/email/generate-complete
   */
  @Post('email/generate-complete')
  async generateComplete(@Body() dto: GenerateSubjectDto, @Req() req: any) {
    try {
      const context: EmailGenerationContext = {
        campaignName: dto.campaignName,
        targetAudience: dto.targetAudience,
        productName: dto.productName,
        productDescription: dto.productDescription,
        callToAction: dto.callToAction,
        tone: dto.tone,
        keywords: dto.keywords,
      };

      // Generate subjects first
      const subjects = await this.aiEmailService.generateSubjectLines(context, req.user.tenantId, dto.count || 5);

      // Use first subject to generate body
      const bodyResult = await this.aiEmailService.generateEmailBody(
        subjects[0],
        context,
        req.user.tenantId,
      );

      return {
        success: true,
        data: {
          subjects,
          selectedSubject: subjects[0],
          htmlBody: bodyResult.htmlBody,
          plainTextBody: bodyResult.plainTextBody,
          tokensUsed: bodyResult.tokensUsed,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: {
            message: error.message,
            code: 'AI_GENERATION_FAILED',
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
