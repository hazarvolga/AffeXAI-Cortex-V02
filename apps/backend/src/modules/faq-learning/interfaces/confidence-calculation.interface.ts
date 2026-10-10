import { LearnedFaqEntry } from '../entities/learned-faq-entry.entity';
import { LearningPattern } from '../entities/learning-pattern.entity';
import { ExtractedData } from './data-extraction.interface';

export interface ConfidenceFactors {
  // Source quality factors
  sourceReliability: number; // 0-1
  userSatisfaction?: number; // 1-5 scale
  resolutionSuccess: boolean;
  responseTime?: number; // in seconds
  
  // Content quality factors
  questionClarity: number; // 0-1
  answerCompleteness: number; // 0-1
  languageQuality: number; // 0-1
  
  // Pattern factors
  frequency: number; // How often this pattern appears
  consistency: number; // How consistent the answers are
  sourceVariety: number; // Number of different sources
  
  // Feedback factors
  positiveVotes: number;
  negativeVotes: number;
  usageCount: number;
  
  // AI factors
  aiConfidence?: number; // 0-100 from AI processing
  processingSuccess: boolean;
  
  // Context factors
  categoryMatch: boolean;
  keywordRelevance: number; // 0-1
  contextRichness: number; // 0-1
}

export interface ConfidenceCalculationResult {
  finalConfidence: number; // 1-100
  factorBreakdown: {
    sourceQuality: number;
    contentQuality: number;
    patternStrength: number;
    userFeedback: number;
    aiProcessing: number;
    contextualRelevance: number;
  };
  confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
  recommendations: string[];
  adjustmentHistory?: Array<{
    timestamp: Date;
    previousConfidence: number;
    newConfidence: number;
    reason: string;
    factors: Partial<ConfidenceFactors>;
  }>;
}

export interface FeedbackImpact {
  confidenceChange: number; // -100 to +100
  newConfidence: number; // 1-100
  feedbackWeight: number; // How much this feedback should count
  reasoning: string;
}

export interface IConfidenceCalculatorService {
  /**
   * Calculate initial confidence for new FAQ entry
   */
  calculateInitialConfidence(
    extractedData: ExtractedData,
    pattern?: LearningPattern
  ): Promise<ConfidenceCalculationResult>;

  /**
   * Recalculate confidence based on new factors
   */
  recalculateConfidence(
    faqEntry: LearnedFaqEntry,
    newFactors: Partial<ConfidenceFactors>
  ): Promise<ConfidenceCalculationResult>;

  /**
   * Adjust confidence based on user feedback
   */
  adjustConfidenceFromFeedback(
    faqEntry: LearnedFaqEntry,
    feedbackType: 'helpful' | 'not_helpful',
    feedbackComment?: string
  ): Promise<FeedbackImpact>;

  /**
   * Calculate pattern confidence
   */
  calculatePatternConfidence(pattern: LearningPattern): Promise<number>;

  /**
   * Bulk recalculate confidence for multiple entries
   */
  bulkRecalculateConfidence(
    faqEntries: LearnedFaqEntry[]
  ): Promise<Map<string, ConfidenceCalculationResult>>;

  /**
   * Get confidence statistics for analysis
   */
  getConfidenceStatistics(): Promise<{
    averageConfidence: number;
    confidenceDistribution: { [key: string]: number };
    topFactors: Array<{ factor: string; impact: number }>;
    improvementSuggestions: string[];
  }>;

  /**
   * Predict confidence for hypothetical FAQ
   */
  predictConfidence(factors: ConfidenceFactors): Promise<number>;

  /**
   * Get confidence threshold recommendations
   */
  getThresholdRecommendations(): Promise<{
    autoPublish: number;
    requireReview: number;
    reject: number;
    reasoning: string;
  }>;
}