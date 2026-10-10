import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsUUID, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiModel, AiProvider } from '../../settings/dto/ai-settings.dto';

export class ChatContextOptionsDto {
  @ApiPropertyOptional({ description: 'Maximum number of context sources to include', minimum: 1, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxSources?: number;

  @ApiPropertyOptional({ description: 'Minimum relevance score for context sources', minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minRelevanceScore?: number;

  @ApiPropertyOptional({ description: 'Include Knowledge Base articles in context' })
  @IsOptional()
  @IsBoolean()
  includeKnowledgeBase?: boolean;

  @ApiPropertyOptional({ description: 'Include FAQ Learning entries in context' })
  @IsOptional()
  @IsBoolean()
  includeFaqLearning?: boolean;

  @ApiPropertyOptional({ description: 'Include uploaded documents in context' })
  @IsOptional()
  @IsBoolean()
  includeDocuments?: boolean;
}

export class ChatAiRequestDto {
  @ApiProperty({ description: 'User prompt/message' })
  @IsString()
  prompt: string;

  @ApiProperty({ description: 'Chat session ID' })
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Message ID for context tracking' })
  @IsOptional()
  @IsUUID()
  messageId?: string;

  @ApiPropertyOptional({ description: 'Include context from various sources', default: true })
  @IsOptional()
  @IsBoolean()
  includeContext?: boolean = true;

  @ApiPropertyOptional({ description: 'Context options' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChatContextOptionsDto)
  contextOptions?: ChatContextOptionsDto;

  @ApiPropertyOptional({ description: 'Enable streaming response', default: false })
  @IsOptional()
  @IsBoolean()
  streamResponse?: boolean = false;

  @ApiPropertyOptional({ description: 'AI model to use (overrides global settings)' })
  @IsOptional()
  @IsEnum(AiModel)
  model?: AiModel;

  @ApiPropertyOptional({ description: 'AI provider to use (overrides global settings)' })
  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider;

  @ApiPropertyOptional({ description: 'Temperature for AI generation', minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Maximum tokens for AI response', minimum: 50, maximum: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(4000)
  maxTokens?: number;
}

export class ChatAiTestRequestDto {
  @ApiPropertyOptional({ description: 'Test message to send to AI' })
  @IsOptional()
  @IsString()
  testMessage?: string = 'Hello, this is a test message. Please respond with "Test successful".';

  @ApiPropertyOptional({ description: 'AI model to test (overrides global settings)' })
  @IsOptional()
  @IsEnum(AiModel)
  model?: AiModel;

  @ApiPropertyOptional({ description: 'AI provider to test (overrides global settings)' })
  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider;
}