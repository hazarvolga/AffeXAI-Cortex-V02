import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { ExtractedData } from '../interfaces/data-extraction.interface';

export interface ConfidenceFactors {
  sourceQuality: number;        // 0-100: Chat vs Ticket quality
  patternFrequency: number;     // 0-100: How often this pattern appears
  resolutionSuccess: number;    // 0-100: Was the issue resolved successfully
  userSatisfaction: number;     // 0-100: User satisfaction score
  contextClarity: number;       // 0-100: How clear is the context
  answerCompleteness: number;   // 0-100: How complete is the answer
  similarityToExisting: number; // 0-100: Similarity to existing FAQs
  aiConfidence: number;         // 0-100: AI provider's confidence
}

export interface ConfidenceResult {
  overallConfidence: number;
  factors: ConfidenceFactors;
  reasoning: string[];
  recommendation: 'auto_publish' | 'needs_review' | 'reject';
}

@Injectable()
export class ConfidenceCalculatorService {
  private readonly logger = new Logger(ConfidenceCalculatorService.name);

  constructor(
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
  ) {}

  async calculateConfidence(
    data: ExtractedData,
    patternFrequency?: number,
    aiConfidence?: number,
    existingFaqSimilarity?: number
  ): Promise<ConfidenceResult> {
    
    const factors: ConfidenceFactors = {
      sourceQuality: this.calculateSourceQuality(data),
      patternFrequency: this.calculatePatternFrequencyScore(patternFrequency || 1),
      resolutionSuccess: this.calculateResolutionSuccess(data),
      userSatisfaction: this.calculateUserSatisfactionScore(data),
      contextClarity: this.calculateContextClarity(data),
      answerCompleteness: this.calculateAnswerCompleteness(data),
      similarityToExisting: this.calculateSimilarityScore(existingFaqSimilarity || 0),
      aiConfidence: aiConfidence || 70
    };

    const overallConfidence = await this.calculateOverallConfidence(factors);
    const reasoning = this.generateReasoning(factors);
    const recommendation = await this.getRecommendation(overallConfidence);

    return {
      overallConfidence,
      factors,
      reasoning,
      recommendation
    };
  }

  async adjustConfidenceBasedOnFeedback(
    currentConfidence: number,
    feedbackType: 'helpful' | 'not_helpful' | 'improved',
    feedbackCount: number
  ): Promise<number> {
    
    const config = await this.getConfidenceConfig();
    const adjustmentFactor = config.feedbackAdjustmentFactor || 0.1;
    
    let adjustment = 0;
    
    switch (feedbackType) {
      case 'helpful':
        // Positive feedback increases confidence
        adjustment = Math.min(5, feedbackCount * adjustmentFactor);
        break;
      case 'not_helpful':
        // Negative feedback decreases confidence
        adjustment = -Math.min(10, feedbackCount * adjustmentFactor * 2);
        break;
      case 'improved':
        // FAQ was improved, moderate increase
        adjustment = Math.min(3, feedbackCount * adjustmentFactor * 0.5);
        break;
    }

    const newConfidence = Math.max(0, Math.min(100, currentConfidence + adjustment));
    
    this.logger.log(`Confidence adjusted from ${currentConfidence} to ${newConfidence} based on ${feedbackType} feedback`);
    
    return newConfidence;
  }

  private calculateSourceQuality(data: ExtractedData): number {
    let score = 50; // Base score
    
    if (data.source === 'ticket') {
      score += 20; // Tickets generally have higher quality
      
      // Check resolution time - longer resolution might indicate complexity/quality
      if (data.metadata.resolutionTime) {
        if (data.metadata.resolutionTime > 1800) { // > 30 minutes
          score += 10;
        }
      }
    } else if (data.source === 'chat') {
      score += 10; // Chat is good but less structured
      
      // Check session duration
      if (data.metadata.sessionDuration) {
        if (data.metadata.sessionDuration > 300) { // > 5 minutes
          score += 10;
        }
      }
    }

    // Check if there are tags/categories (indicates better organization)
    if (data.metadata.category || (data.metadata.tags && data.metadata.tags.length > 0)) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private calculatePatternFrequencyScore(frequency: number): number {
    // Higher frequency = higher confidence
    if (frequency >= 10) return 95;
    if (frequency >= 5) return 85;
    if (frequency >= 3) return 70;
    if (frequency >= 2) return 55;
    return 40; // Single occurrence
  }

  private calculateResolutionSuccess(data: ExtractedData): number {
    let score = 60; // Default assumption
    
    // For tickets, check if it was resolved
    if (data.source === 'ticket' && data.metadata.isResolved) {
      score = 85;
    }
    
    // For chat, check satisfaction or session completion
    if (data.source === 'chat') {
      if (data.metadata.satisfactionScore && data.metadata.satisfactionScore >= 4) {
        score = 80;
      } else if (data.metadata.sessionDuration && data.metadata.sessionDuration > 180) {
        score = 70; // Longer sessions might indicate resolution
      }
    }

    return score;
  }

  private calculateUserSatisfactionScore(data: ExtractedData): number {
    if (data.metadata.satisfactionScore) {
      // Convert 1-5 scale to 0-100
      return (data.metadata.satisfactionScore - 1) * 25;
    }
    
    // Default score if no satisfaction data
    return 60;
  }

  private calculateContextClarity(data: ExtractedData): number {
    let score = 50;
    
    // Check if context is provided
    if (data.context && data.context.length > 50) {
      score += 20;
    }
    
    // Check question clarity (length, structure)
    if (data.question.length >= 20 && data.question.length <= 200) {
      score += 15;
    }
    
    // Check for question marks (indicates proper questions)
    if (data.question.includes('?')) {
      score += 10;
    }
    
    // Check for common question words
    const questionWords = ['how', 'what', 'why', 'when', 'where', 'can', 'could', 'should', 'would'];
    const hasQuestionWords = questionWords.some(word => 
      data.question.toLowerCase().includes(word)
    );
    
    if (hasQuestionWords) {
      score += 15;
    }

    return Math.min(100, score);
  }

  private calculateAnswerCompleteness(data: ExtractedData): number {
    let score = 50;
    
    // Check answer length
    if (data.answer.length >= 50 && data.answer.length <= 1000) {
      score += 20;
    } else if (data.answer.length < 20) {
      score -= 20; // Too short
    } else if (data.answer.length > 2000) {
      score -= 10; // Too long
    }
    
    // Check for actionable content
    const actionWords = ['click', 'go to', 'navigate', 'select', 'choose', 'enter', 'type'];
    const hasActionWords = actionWords.some(word => 
      data.answer.toLowerCase().includes(word)
    );
    
    if (hasActionWords) {
      score += 15;
    }
    
    // Check for structured content (lists, steps)
    if (data.answer.includes('\n') || data.answer.includes('1.') || data.answer.includes('-')) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private calculateSimilarityScore(similarity: number): number {
    // Convert similarity (0-1) to confidence impact
    // High similarity might indicate duplicate (bad) or validation (good)
    // We'll treat moderate similarity as good validation
    
    if (similarity > 0.9) {
      return 30; // Too similar, might be duplicate
    } else if (similarity > 0.7) {
      return 80; // Good validation from existing content
    } else if (similarity > 0.5) {
      return 70; // Some validation
    } else {
      return 60; // Unique content
    }
  }

  private async calculateOverallConfidence(factors: ConfidenceFactors): Promise<number> {
    const config = await this.getConfidenceConfig();
    
    // Weighted average of all factors
    const weights = {
      sourceQuality: config.sourceQualityWeight || 0.15,
      patternFrequency: config.patternFrequencyWeight || 0.20,
      resolutionSuccess: config.resolutionSuccessWeight || 0.15,
      userSatisfaction: config.userSatisfactionWeight || 0.15,
      contextClarity: config.contextClarityWeight || 0.10,
      answerCompleteness: config.answerCompletenessWeight || 0.15,
      similarityToExisting: config.similarityWeight || 0.05,
      aiConfidence: config.aiConfidenceWeight || 0.05
    };

    const weightedSum = 
      factors.sourceQuality * weights.sourceQuality +
      factors.patternFrequency * weights.patternFrequency +
      factors.resolutionSuccess * weights.resolutionSuccess +
      factors.userSatisfaction * weights.userSatisfaction +
      factors.contextClarity * weights.contextClarity +
      factors.answerCompleteness * weights.answerCompleteness +
      factors.similarityToExisting * weights.similarityToExisting +
      factors.aiConfidence * weights.aiConfidence;

    return Math.round(weightedSum);
  }

  private generateReasoning(factors: ConfidenceFactors): string[] {
    const reasoning: string[] = [];
    
    if (factors.sourceQuality >= 80) {
      reasoning.push('High source quality from structured data');
    } else if (factors.sourceQuality < 50) {
      reasoning.push('Low source quality, needs verification');
    }
    
    if (factors.patternFrequency >= 80) {
      reasoning.push('Frequently occurring pattern indicates reliability');
    } else if (factors.patternFrequency < 50) {
      reasoning.push('Rare pattern, limited validation data');
    }
    
    if (factors.userSatisfaction >= 80) {
      reasoning.push('High user satisfaction indicates quality');
    } else if (factors.userSatisfaction < 40) {
      reasoning.push('Low user satisfaction raises concerns');
    }
    
    if (factors.contextClarity >= 80) {
      reasoning.push('Clear context and well-formed question');
    } else if (factors.contextClarity < 50) {
      reasoning.push('Unclear context or poorly formed question');
    }
    
    if (factors.answerCompleteness >= 80) {
      reasoning.push('Complete and actionable answer');
    } else if (factors.answerCompleteness < 50) {
      reasoning.push('Incomplete or unclear answer');
    }

    return reasoning;
  }

  private async getRecommendation(confidence: number): Promise<'auto_publish' | 'needs_review' | 'reject'> {
    const config = await this.getConfidenceThresholds();
    
    if (confidence >= config.autoPublishThreshold) {
      return 'auto_publish';
    } else if (confidence >= config.reviewThreshold) {
      return 'needs_review';
    } else {
      return 'reject';
    }
  }

  private async getConfidenceThresholds(): Promise<any> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'confidence_thresholds' }
      });
      
      return config?.configValue || {
        autoPublishThreshold: 85,
        reviewThreshold: 60
      };
    } catch (error) {
      this.logger.error('Failed to load confidence thresholds:', error);
      return {
        autoPublishThreshold: 85,
        reviewThreshold: 60
      };
    }
  }

  private async getConfidenceConfig(): Promise<any> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'confidence_calculation' }
      });
      
      return config?.configValue || {
        sourceQualityWeight: 0.15,
        patternFrequencyWeight: 0.20,
        resolutionSuccessWeight: 0.15,
        userSatisfactionWeight: 0.15,
        contextClarityWeight: 0.10,
        answerCompletenessWeight: 0.15,
        similarityWeight: 0.05,
        aiConfidenceWeight: 0.05,
        feedbackAdjustmentFactor: 0.1
      };
    } catch (error) {
      this.logger.error('Failed to load confidence config:', error);
      return {};
    }
  }
}