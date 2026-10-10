import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiModel, AiProvider } from '../../settings/dto/ai-settings.dto';
import { ContextSourceType } from '../enums/context-source-type.enum';

export class ContextSourceResponseDto {
  @ApiProperty({ description: 'Source ID' })
  id: string;

  @ApiProperty({ description: 'Source type', enum: ContextSourceType })
  type: ContextSourceType;

  @ApiProperty({ description: 'Source title' })
  title: string;

  @ApiProperty({ description: 'Source content excerpt' })
  content: string;

  @ApiProperty({ description: 'Relevance score (0-1)' })
  relevanceScore: number;

  @ApiPropertyOptional({ description: 'Source URL if available' })
  url?: string;

  @ApiPropertyOptional({ description: 'Original source ID' })
  sourceId?: string;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;
}

export class ContextResultResponseDto {
  @ApiProperty({ description: 'Context sources found', type: [ContextSourceResponseDto] })
  sources: ContextSourceResponseDto[];

  @ApiProperty({ description: 'Total relevance score of all sources' })
  totalRelevanceScore: number;

  @ApiProperty({ description: 'Original search query' })
  searchQuery: string;

  @ApiProperty({ description: 'Context processing time in milliseconds' })
  processingTime: number;
}

export class ChatAiResponseDto {
  @ApiProperty({ description: 'Generated AI response content' })
  content: string;

  @ApiProperty({ description: 'AI model used' })
  model: string;

  @ApiProperty({ description: 'AI provider used', enum: AiProvider })
  provider: AiProvider;

  @ApiProperty({ description: 'Number of tokens used' })
  tokensUsed: number;

  @ApiProperty({ description: 'Finish reason from AI provider' })
  finishReason: string;

  @ApiPropertyOptional({ description: 'Context information used', type: ContextResultResponseDto })
  contextUsed?: ContextResultResponseDto;

  @ApiPropertyOptional({ description: 'Context sources used', type: [ContextSourceResponseDto] })
  contextSources?: ContextSourceResponseDto[];

  @ApiPropertyOptional({ description: 'Confidence score (0-1)' })
  confidenceScore?: number;

  @ApiPropertyOptional({ description: 'Citations extracted from response', type: [String] })
  citations?: string[];

  @ApiPropertyOptional({ description: 'Whether streaming is supported for this configuration' })
  streamingSupported?: boolean;
}

export class StreamingChunkResponseDto {
  @ApiProperty({ description: 'Content chunk' })
  content: string;

  @ApiProperty({ description: 'Whether this is the final chunk' })
  isComplete: boolean;

  @ApiPropertyOptional({ description: 'Chunk metadata' })
  metadata?: {
    tokensGenerated?: number;
    processingTime?: number;
  };
}

export class ChatAiTestResponseDto {
  @ApiProperty({ description: 'Whether the test was successful' })
  success: boolean;

  @ApiProperty({ description: 'AI provider tested', enum: AiProvider })
  provider: AiProvider;

  @ApiProperty({ description: 'AI model tested' })
  model: AiModel;

  @ApiProperty({ description: 'Whether streaming is supported' })
  streamingSupported: boolean;

  @ApiProperty({ description: 'Response time in milliseconds' })
  responseTime: number;

  @ApiPropertyOptional({ description: 'Error message if test failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Test response content if successful' })
  testResponse?: string;
}

export class ChatAiUsageStatsDto {
  @ApiProperty({ description: 'Total number of AI requests' })
  totalRequests: number;

  @ApiProperty({ description: 'Total tokens consumed' })
  totalTokens: number;

  @ApiProperty({ description: 'Average response time in milliseconds' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Average confidence score' })
  averageConfidence: number;

  @ApiProperty({ description: 'Usage by provider' })
  providerUsage: Record<AiProvider, number>;

  @ApiProperty({ description: 'Usage by model' })
  modelUsage: Record<AiModel, number>;

  @ApiPropertyOptional({ description: 'Session-specific stats if sessionId provided' })
  sessionStats?: {
    sessionId: string;
    requestCount: number;
    totalTokens: number;
    averageConfidence: number;
  };
}