import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TenantService } from '../../../core/tenant/tenant.service';
import { requireFaqTenant } from './faq-review-policy';
import { LearnedFaqEntry, FaqEntryStatus } from '../entities/learned-faq-entry.entity';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { ConfidenceCalculatorService } from './confidence-calculator.service';
import { FaqAiService } from './faq-ai.service';

export interface FeedbackData {
  faqId: string;
  userId?: string;
  feedbackType: 'helpful' | 'not_helpful' | 'suggestion' | 'correction';
  rating?: number; // 1-5 scale
  comment?: string;
  suggestedAnswer?: string;
  suggestedCategory?: string;
  suggestedKeywords?: string[];
  context?: {
    userAgent?: string;
    referrer?: string;
    sessionId?: string;
    searchQuery?: string;
  };
}

export interface FeedbackAnalysis {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  confidenceAdjustment: number;
  suggestedImprovements: string[];
  actionRequired: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface FeedbackStats {
  totalFeedback: number;
  helpfulCount: number;
  notHelpfulCount: number;
  suggestionCount: number;
  correctionCount: number;
  averageRating: number;
  helpfulnessRatio: number;
  topIssues: Array<{
    issue: string;
    count: number;
    percentage: number;
  }>;
  improvementSuggestions: Array<{
    suggestion: string;
    frequency: number;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export interface PerformanceMetrics {
  faqId: string;
  question: string;
  totalViews: number;
  totalFeedback: number;
  helpfulnessRatio: number;
  averageRating: number;
  confidenceScore: number;
  lastUpdated: Date;
  performanceScore: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

@Injectable()
export class FeedbackProcessorService {
  private readonly logger = new Logger(FeedbackProcessorService.name);

  constructor(
    @InjectRepository(LearnedFaqEntry)
    private faqRepository: Repository<LearnedFaqEntry>,
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
    private confidenceCalculator: ConfidenceCalculatorService,
    private faqAiService: FaqAiService,
    private readonly tenantService:TenantService,
  ) { }

  async processFeedback(feedback: FeedbackData, tenantId: string): Promise<{
    processed: boolean;
    analysis: FeedbackAnalysis;
    updatedFaq?: LearnedFaqEntry;
  }> {

    try {
      if(requireFaqTenant(this.tenantService)!==tenantId)throw new Error('Tenant mismatch');
      this.logger.log(`Processing feedback for FAQ ${feedback.faqId}: ${feedback.feedbackType}`);

      const faq = await this.faqRepository.findOne({
        where: { id: feedback.faqId, tenantId, status:FaqEntryStatus.PUBLISHED, deletedAt:IsNull() }
      });

      if (!faq) {
        throw new Error(`FAQ with ID ${feedback.faqId} not found`);
      }

      // Analyze the feedback
      const analysis = await this.analyzeFeedback(feedback, faq);

      // Provider evaluation happens before the row lock. Its metadata cannot replace
      // a concurrent review, publication decision, or article mapping.
      const suggested=Object.assign(new LearnedFaqEntry(),faq,{metadata:{}});
      if(feedback.feedbackType==='suggestion'||feedback.feedbackType==='correction')await this.processSuggestion(suggested,feedback);
      const confidenceDelta=analysis.confidenceAdjustment===0?0:(await this.confidenceCalculator.adjustConfidenceBasedOnFeedback(faq.confidence,feedback.feedbackType as 'helpful'|'not_helpful'|'improved',this.getTotalFeedbackCount(faq)+1))-faq.confidence;
      const savedFaq=await this.faqRepository.manager.transaction(async manager=>{
        const repo=manager.getRepository(LearnedFaqEntry);
        const current=await repo.findOne({where:{id:feedback.faqId,tenantId,status:FaqEntryStatus.PUBLISHED,deletedAt:IsNull()},lock:{mode:'pessimistic_write'}});
        if(!current || current.answer!==faq.answer)throw new Error('FAQ changed during feedback; retry');
        const updated=Object.assign(new LearnedFaqEntry(),current,{metadata:structuredClone(current.metadata || {})});
        await this.updateFaqMetrics(updated,feedback);
        updated.confidence=Math.max(1,Math.min(100,current.confidence+confidenceDelta));
        for(const key of ['suggestions','categorySuggestions','keywordSuggestions']){
          const incoming=suggested.metadata?.[key];
          if(Array.isArray(incoming))updated.metadata={...updated.metadata,[key]:[...(Array.isArray(updated.metadata?.[key])?updated.metadata[key]:[]),...incoming].slice(-100)};
        }
        if(analysis.actionRequired)await this.triggerImprovementAction(updated,analysis);
        return repo.save(updated);
      });

      this.logger.log(`Feedback processed successfully for FAQ ${feedback.faqId}`);

      return {
        processed: true,
        analysis,
        updatedFaq: savedFaq
      };

    } catch (error) {
      this.logger.error(`Failed to process feedback for FAQ ${feedback.faqId}:`, error);
      return {
        processed: false,
        analysis: {
          overallSentiment: 'neutral',
          confidenceAdjustment: 0,
          suggestedImprovements: [],
          actionRequired: false,
          priority: 'low'
        }
      };
    }
  }

  async getFeedbackStats(faqId: string, tenantId: string): Promise<FeedbackStats> {
    try {
      const faq = await this.faqRepository.findOne({
        where: { id: faqId, tenantId }
      });

      if (!faq) {
        throw new Error(`FAQ with ID ${faqId} not found`);
      }

      const totalFeedback = faq.helpfulCount + faq.notHelpfulCount;
      const helpfulnessRatio = totalFeedback > 0 ? faq.helpfulCount / totalFeedback : 0;

      // Extract feedback data from metadata
      const feedbackHistory = (faq.metadata as any)?.feedbackHistory || [];

      const suggestionCount = feedbackHistory.filter((f: any) => f.type === 'suggestion').length;
      const correctionCount = feedbackHistory.filter((f: any) => f.type === 'correction').length;

      const ratings = feedbackHistory
        .filter((f: any) => f.rating)
        .map((f: any) => f.rating);

      const averageRating = ratings.length > 0 ?
        ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length : 0;

      // Analyze common issues
      const issues = feedbackHistory
        .filter((f: any) => f.comment)
        .map((f: any) => this.extractIssues(f.comment))
        .flat();

      const issueCount = this.countOccurrences(issues);
      const topIssues = Object.entries(issueCount)
        .map(([issue, count]) => ({
          issue,
          count: count as number,
          percentage: ((count as number) / totalFeedback) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Generate improvement suggestions
      const improvementSuggestions = await this.generateDetailedImprovementSuggestions(faq, feedbackHistory);

      return {
        totalFeedback,
        helpfulCount: faq.helpfulCount,
        notHelpfulCount: faq.notHelpfulCount,
        suggestionCount,
        correctionCount,
        averageRating,
        helpfulnessRatio,
        topIssues,
        improvementSuggestions
      };

    } catch (error) {
      this.logger.error(`Failed to get feedback stats for FAQ ${faqId}:`, error);
      throw error;
    }
  }

  async getPerformanceMetrics(tenantId: string, faqId?: string): Promise<PerformanceMetrics[]> {
    try {
      const queryBuilder = this.faqRepository.createQueryBuilder('faq')
        .where('faq.tenantId = :tenantId', { tenantId });

      if (faqId) {
        queryBuilder.andWhere('faq.id = :faqId', { faqId });
      }

      const faqs = await queryBuilder.getMany();
      const metrics: PerformanceMetrics[] = [];

      for (const faq of faqs) {
        const totalFeedback = faq.helpfulCount + faq.notHelpfulCount;
        const helpfulnessRatio = totalFeedback > 0 ? faq.helpfulCount / totalFeedback : 0;

        const feedbackHistory = (faq.metadata as any)?.feedbackHistory || [];
        const ratings = feedbackHistory
          .filter((f: any) => f.rating)
          .map((f: any) => f.rating);

        const averageRating = ratings.length > 0 ?
          ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length : 0;

        // Calculate performance score (weighted combination of metrics)
        const performanceScore = this.calculatePerformanceScore({
          helpfulnessRatio,
          averageRating,
          confidence: faq.confidence,
          usageCount: faq.usageCount,
          totalFeedback
        });

        // Determine trend
        const trend = this.calculateTrend(faq);

        // Generate recommendations
        const recommendations = this.generateRecommendations(faq, {
          helpfulnessRatio,
          averageRating,
          performanceScore,
          totalFeedback
        });

        metrics.push({
          faqId: faq.id,
          question: faq.question,
          totalViews: faq.usageCount,
          totalFeedback,
          helpfulnessRatio,
          averageRating,
          confidenceScore: faq.confidence,
          lastUpdated: faq.updatedAt,
          performanceScore,
          trend,
          recommendations
        });
      }

      return metrics.sort((a, b) => b.performanceScore - a.performanceScore);

    } catch (error) {
      this.logger.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  async generateImprovementSuggestions(faqId: string, tenantId: string): Promise<string[]> {
    try {
      const faq = await this.faqRepository.findOne({
        where: { id: faqId, tenantId }
      });

      if (!faq) {
        throw new Error(`FAQ with ID ${faqId} not found`);
      }

      const suggestions: string[] = [];
      const feedbackHistory = (faq.metadata as any)?.feedbackHistory || [];
      const totalFeedback = faq.helpfulCount + faq.notHelpfulCount;
      const helpfulnessRatio = totalFeedback > 0 ? faq.helpfulCount / totalFeedback : 0;

      // Analyze performance and generate suggestions
      if (helpfulnessRatio < 0.6 && totalFeedback >= 5) {
        suggestions.push('Consider rewriting the answer to be clearer and more actionable');
      }

      if (faq.confidence < 70) {
        suggestions.push('Review and validate the answer accuracy');
      }

      if (faq.usageCount > 50 && helpfulnessRatio < 0.7) {
        suggestions.push('This is a popular FAQ with low satisfaction - prioritize improvement');
      }

      // Analyze feedback comments for specific issues
      const comments = feedbackHistory
        .filter((f: any) => f.comment)
        .map((f: any) => f.comment);

      if (comments.length > 0) {
        const commonIssues = this.analyzeCommonIssues(comments);
        suggestions.push(...commonIssues);
      }

      // Check for outdated content
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(faq.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate > 90 && faq.usageCount > 20) {
        suggestions.push('Content may be outdated - consider reviewing for accuracy');
      }

      return suggestions;

    } catch (error) {
      this.logger.error(`Failed to generate improvement suggestions for FAQ ${faqId}:`, error);
      return [];
    }
  }

  private async analyzeFeedback(feedback: FeedbackData, faq: LearnedFaqEntry): Promise<FeedbackAnalysis> {
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidenceAdjustment = 0;
    const suggestedImprovements: string[] = [];
    let actionRequired = false;
    let priority: 'low' | 'medium' | 'high' = 'low';

    // Determine sentiment and confidence adjustment
    switch (feedback.feedbackType) {
      case 'helpful':
        sentiment = 'positive';
        confidenceAdjustment = 2;
        break;
      case 'not_helpful':
        sentiment = 'negative';
        confidenceAdjustment = -3;
        actionRequired = true;
        priority = 'medium';
        break;
      case 'suggestion':
        sentiment = 'neutral';
        if (feedback.suggestedAnswer) {
          suggestedImprovements.push('User provided alternative answer');
          actionRequired = true;
          priority = 'medium';
        }
        break;
      case 'correction':
        sentiment = 'negative';
        confidenceAdjustment = -5;
        actionRequired = true;
        priority = 'high';
        suggestedImprovements.push('User reported incorrect information');
        break;
    }

    // Analyze rating if provided
    if (feedback.rating) {
      if (feedback.rating <= 2) {
        sentiment = 'negative';
        confidenceAdjustment -= 2;
        actionRequired = true;
        priority = 'high';
      } else if (feedback.rating >= 4) {
        sentiment = 'positive';
        confidenceAdjustment += 1;
      }
    }

    // Analyze comment for additional insights
    if (feedback.comment) {
      const commentAnalysis = this.analyzeComment(feedback.comment);
      suggestedImprovements.push(...commentAnalysis.improvements);

      if (commentAnalysis.severity === 'high') {
        priority = 'high';
        actionRequired = true;
      }
    }

    return {
      overallSentiment: sentiment,
      confidenceAdjustment,
      suggestedImprovements,
      actionRequired,
      priority
    };
  }

  private async updateFaqMetrics(faq: LearnedFaqEntry, feedback: FeedbackData): Promise<LearnedFaqEntry> {
    // Update counters
    switch (feedback.feedbackType) {
      case 'helpful':
        faq.helpfulCount += 1;
        break;
      case 'not_helpful':
        faq.notHelpfulCount += 1;
        break;
    }

    // Update usage count
    faq.usageCount += 1;

    // Update metadata with feedback history
    if (!faq.metadata) {
      faq.metadata = {};
    }

    if (!(faq.metadata as any).feedbackHistory) {
      (faq.metadata as any).feedbackHistory = [];
    }

    (faq.metadata as any).feedbackHistory.push({
      type: feedback.feedbackType,
      rating: feedback.rating,
      comment: feedback.comment,
      userId: feedback.userId,
      timestamp: new Date(),
      context: feedback.context
    });

    // Keep only last 100 feedback entries to prevent metadata bloat
    if ((faq.metadata as any).feedbackHistory.length > 100) {
      (faq.metadata as any).feedbackHistory = (faq.metadata as any).feedbackHistory.slice(-100);
    }

    return faq;
  }

  private async processSuggestion(faq: LearnedFaqEntry, feedback: FeedbackData): Promise<void> {
    try {
      // If user provided a suggested answer, analyze it
      if (feedback.suggestedAnswer) {
        // Use AI to evaluate the suggestion
        const evaluation = await this.faqAiService.improveAnswer(
          faq.question,
          faq.answer,
          faq.tenantId,
          [`User suggested this alternative: ${feedback.suggestedAnswer}`]
        );

        // Store the suggestion for review
        if (!(faq.metadata as any).suggestions) {
          (faq.metadata as any).suggestions = [];
        }

        (faq.metadata as any).suggestions.push({
          originalAnswer: faq.answer,
          suggestedAnswer: feedback.suggestedAnswer,
          aiEvaluation: evaluation,
          userId: feedback.userId,
          timestamp: new Date()
        });
      }

      // Process category suggestions
      if (feedback.suggestedCategory && feedback.suggestedCategory !== faq.category) {
        if (!(faq.metadata as any).categorySuggestions) {
          (faq.metadata as any).categorySuggestions = [];
        }

        (faq.metadata as any).categorySuggestions.push({
          currentCategory: faq.category,
          suggestedCategory: feedback.suggestedCategory,
          userId: feedback.userId,
          timestamp: new Date()
        });
      }

      // Process keyword suggestions
      if (feedback.suggestedKeywords && feedback.suggestedKeywords.length > 0) {
        if (!(faq.metadata as any).keywordSuggestions) {
          (faq.metadata as any).keywordSuggestions = [];
        }

        (faq.metadata as any).keywordSuggestions.push({
          currentKeywords: faq.keywords,
          suggestedKeywords: feedback.suggestedKeywords,
          userId: feedback.userId,
          timestamp: new Date()
        });
      }

    } catch (error) {
      this.logger.warn('Failed to process suggestion:', error);
    }
  }

  private async triggerImprovementAction(faq: LearnedFaqEntry, analysis: FeedbackAnalysis): Promise<void> {
    try {
      // Log the action requirement
      this.logger.log(`Action required for FAQ ${faq.id}: ${analysis.priority} priority`);

      // Update FAQ status if needed
      if (analysis.priority === 'high') {
        // Mark for urgent review
        faq.metadata = {
          ...faq.metadata,
          needsUrgentReview: true,
          urgentReviewReason: analysis.suggestedImprovements.join('; '),
          flaggedAt: new Date()
        } as any;
      }

      // In a real implementation, you might:
      // - Send notifications to admins
      // - Create review tasks
      // - Update dashboard alerts
      // - Trigger automated improvements

    } catch (error) {
      this.logger.error('Failed to trigger improvement action:', error);
    }
  }

  private analyzeComment(comment: string): { improvements: string[]; severity: 'low' | 'medium' | 'high' } {
    const improvements: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    const lowerComment = comment.toLowerCase();

    // Check for specific issues
    if (lowerComment.includes('wrong') || lowerComment.includes('incorrect') || lowerComment.includes('error')) {
      improvements.push('User reported incorrect information');
      severity = 'high';
    }

    if (lowerComment.includes('outdated') || lowerComment.includes('old')) {
      improvements.push('Content may be outdated');
      severity = 'medium';
    }

    if (lowerComment.includes('unclear') || lowerComment.includes('confusing')) {
      improvements.push('Answer needs clarification');
      severity = 'medium';
    }

    if (lowerComment.includes('missing') || lowerComment.includes('incomplete')) {
      improvements.push('Answer is incomplete');
      severity = 'medium';
    }

    return { improvements, severity };
  }

  private extractIssues(comment: string): string[] {
    const issues: string[] = [];
    const lowerComment = comment.toLowerCase();

    const issuePatterns = [
      { pattern: /wrong|incorrect|error/i, issue: 'Incorrect information' },
      { pattern: /outdated|old/i, issue: 'Outdated content' },
      { pattern: /unclear|confusing/i, issue: 'Unclear explanation' },
      { pattern: /missing|incomplete/i, issue: 'Incomplete information' },
      { pattern: /too long|verbose/i, issue: 'Too lengthy' },
      { pattern: /too short|brief/i, issue: 'Too brief' }
    ];

    for (const { pattern, issue } of issuePatterns) {
      if (pattern.test(comment)) {
        issues.push(issue);
      }
    }

    return issues;
  }

  private countOccurrences(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculatePerformanceScore(metrics: {
    helpfulnessRatio: number;
    averageRating: number;
    confidence: number;
    usageCount: number;
    totalFeedback: number;
  }): number {
    const {
      helpfulnessRatio,
      averageRating,
      confidence,
      usageCount,
      totalFeedback
    } = metrics;

    // Weighted score calculation
    let score = 0;

    // Helpfulness ratio (40% weight)
    score += helpfulnessRatio * 40;

    // Average rating (25% weight) - convert 1-5 scale to 0-100
    score += (averageRating / 5) * 25;

    // Confidence (20% weight)
    score += (confidence / 100) * 20;

    // Usage popularity (10% weight) - logarithmic scale
    const popularityScore = Math.min(100, Math.log10(usageCount + 1) * 20);
    score += (popularityScore / 100) * 10;

    // Feedback engagement (5% weight)
    const engagementScore = Math.min(100, totalFeedback * 2);
    score += (engagementScore / 100) * 5;

    return Math.round(score);
  }

  private calculateTrend(faq: LearnedFaqEntry): 'improving' | 'declining' | 'stable' {
    const feedbackHistory = (faq.metadata as any)?.feedbackHistory || [];

    if (feedbackHistory.length < 10) {
      return 'stable';
    }

    // Analyze recent vs older feedback
    const recentFeedback = feedbackHistory.slice(-5);
    const olderFeedback = feedbackHistory.slice(-10, -5);

    const recentHelpfulRatio = this.calculateHelpfulRatio(recentFeedback);
    const olderHelpfulRatio = this.calculateHelpfulRatio(olderFeedback);

    const difference = recentHelpfulRatio - olderHelpfulRatio;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private calculateHelpfulRatio(feedback: any[]): number {
    const helpful = feedback.filter(f => f.type === 'helpful').length;
    const notHelpful = feedback.filter(f => f.type === 'not_helpful').length;
    const total = helpful + notHelpful;

    return total > 0 ? helpful / total : 0;
  }

  private generateRecommendations(faq: LearnedFaqEntry, metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.helpfulnessRatio < 0.6 && metrics.totalFeedback >= 5) {
      recommendations.push('Low helpfulness ratio - consider rewriting the answer');
    }

    if (metrics.averageRating < 3 && metrics.totalFeedback >= 3) {
      recommendations.push('Low average rating - review content quality');
    }

    if (metrics.performanceScore < 50) {
      recommendations.push('Overall poor performance - needs immediate attention');
    }

    if (faq.usageCount > 100 && metrics.helpfulnessRatio < 0.8) {
      recommendations.push('High-traffic FAQ with room for improvement');
    }

    return recommendations;
  }

  private async generateDetailedImprovementSuggestions(faq: LearnedFaqEntry, feedbackHistory: any[]): Promise<Array<{
    suggestion: string;
    frequency: number;
    impact: 'high' | 'medium' | 'low';
  }>> {

    const suggestions: Array<{
      suggestion: string;
      frequency: number;
      impact: 'high' | 'medium' | 'low';
    }> = [];

    // Analyze feedback patterns
    const issues = feedbackHistory
      .filter(f => f.comment)
      .map(f => this.extractIssues(f.comment))
      .flat();

    const issueCount = this.countOccurrences(issues);

    for (const [issue, count] of Object.entries(issueCount)) {
      let impact: 'high' | 'medium' | 'low' = 'low';

      if (count >= 5) impact = 'high';
      else if (count >= 3) impact = 'medium';

      suggestions.push({
        suggestion: `Address: ${issue}`,
        frequency: count as number,
        impact
      });
    }

    return suggestions.sort((a, b) => b.frequency - a.frequency);
  }

  private getTotalFeedbackCount(faq: LearnedFaqEntry): number {
    return faq.helpfulCount + faq.notHelpfulCount;
  }

  private analyzeCommonIssues(comments: string[]): string[] {
    const issues: string[] = [];
    const allIssues = comments.map(comment => this.extractIssues(comment)).flat();
    const issueCount = this.countOccurrences(allIssues);

    // Return issues that appear in multiple comments
    for (const [issue, count] of Object.entries(issueCount)) {
      if (count >= 2) {
        issues.push(`Multiple users reported: ${issue}`);
      }
    }

    return issues;
  }
}