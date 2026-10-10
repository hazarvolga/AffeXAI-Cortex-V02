import { ExtractedData } from './data-extraction.interface';
import { LearningPattern } from '../entities/learning-pattern.entity';

/**
 * FAQ Generation Request Interface
 * Used for generating FAQ entries from conversation data
 */
export interface FaqGenerationRequest {
  context: string;
  questionPattern?: string;
  answerPattern?: string;
  category?: string;
  keywords?: string[];
  sourceType?: 'chat' | 'ticket';
  metadata?: any;
}

/**
 * FAQ Generation Response Interface
 * Returned after AI generates FAQ content
 */
export interface FaqGenerationResponse {
  answer: string;
  confidence: number;
  keywords: string[];
  category: string;
  processingTime: number;
  metadata: {
    aiProvider: string;
    model: string;
    processingTime: number;
    tokensUsed?: number;
  };
}

/**
 * Pattern Analysis Request Interface
 * Used for analyzing conversation patterns
 */
export interface PatternAnalysisRequest {
  conversations: any[];
  timeRange: {
    from: string;
    to: string;
  };
  analysisType?: 'similarity' | 'categorization' | 'quality' | 'deduplication';
}

/**
 * Pattern Analysis Response Interface
 * Returned after AI analyzes patterns
 */
export interface PatternAnalysisResponse {
  patterns: any[];
  confidence: number;
  recommendations: string[];
  processingTime: number;
  metadata: {
    aiProvider: string;
    model: string;
    processingTime: number;
    tokensUsed?: number;
  };
}

/**
 * FAQ Improvement Suggestion Interface
 */
export interface FaqImprovementSuggestion {
  type: 'clarity' | 'completeness' | 'accuracy' | 'formatting';
  description: string;
  suggestedChange: string;
  confidence: number;
}

/**
 * Provider Status Interface
 */
export interface ProviderStatus {
  configured?: boolean;
  healthChecked?: boolean;
  provider: string;
  model: string;
  available: boolean;
  responseTime?: number;
}

/**
 * FAQ AI Service Interface
 * Defines the contract for FAQ AI operations using global AI service
 */
export interface FaqAiInterface {
  /**
   * Generate FAQ answer using global AI service
   */
  generateFaqAnswer(request: FaqGenerationRequest, tenantId: string): Promise<FaqGenerationResponse>;

  /**
   * Analyze patterns in conversation data
   */
  analyzePatterns(request: PatternAnalysisRequest, tenantId: string): Promise<PatternAnalysisResponse>;

  /**
   * Get current AI provider status
   */
  getProviderStatus(tenantId?: string): Promise<ProviderStatus>;
}