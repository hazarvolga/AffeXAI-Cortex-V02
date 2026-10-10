import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { LearnedFaqEntry, FaqEntryStatus } from '../entities/learned-faq-entry.entity';
import { LearningPattern } from '../entities/learning-pattern.entity';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { ChatSession } from '../../chat/entities/chat-session.entity';

export interface LearningEffectivenessMetrics {
  totalFaqsGenerated: number;
  publishedFaqs: number;
  pendingReview: number;
  rejectedFaqs: number;
  approvalRate: number;
  avgConfidenceScore: number;
  avgGenerationTime: number;
  faqsBySource: {
    chat: number;
    ticket: number;
  };
  faqsByCategory: Array<{
    category: string;
    count: number;
  }>;
}

export interface ProviderPerformanceMetrics {
  providerName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  avgTokensUsed: number;
  avgConfidence: number;
  successRate: number;
  costEstimate?: number;
}

export interface FaqUsageMetrics {
  totalViews: number;
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  satisfactionRate: number;
  topViewedFaqs: Array<{
    id: string;
    question: string;
    views: number;
    satisfaction: number;
  }>;
  topRatedFaqs: Array<{
    id: string;
    question: string;
    rating: number;
    feedbackCount: number;
  }>;
}

export interface ROIMetrics {
  ticketReductionRate: number;
  estimatedTicketsSaved: number;
  estimatedTimeSaved: number;
  estimatedCostSavings: number;
  chatResolutionRate: number;
  avgTicketResolutionTime: number;
  beforeAfterComparison: {
    before: {
      avgTicketsPerDay: number;
      avgResolutionTime: number;
    };
    after: {
      avgTicketsPerDay: number;
      avgResolutionTime: number;
    };
  };
}

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

@Injectable()
export class LearningAnalyticsService {
  private readonly logger = new Logger(LearningAnalyticsService.name);

  constructor(
    @InjectRepository(LearnedFaqEntry)
    private faqRepository: Repository<LearnedFaqEntry>,
    @InjectRepository(LearningPattern)
    private patternRepository: Repository<LearningPattern>,
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(ChatSession)
    private chatSessionRepository: Repository<ChatSession>,
  ) {}

  async getLearningEffectiveness(period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<LearningEffectivenessMetrics> {
    const dateRange = this.getDateRange(period);

    const [totalFaqs, publishedFaqs, pendingFaqs, rejectedFaqs] = await Promise.all([
      this.faqRepository.count({
        where: dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {},
      }),
      this.faqRepository.count({
        where: {
          status: FaqEntryStatus.PUBLISHED,
          ...(dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {}),
        },
      }),
      this.faqRepository.count({
        where: {
          status: FaqEntryStatus.PENDING_REVIEW,
          ...(dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {}),
        },
      }),
      this.faqRepository.count({
        where: {
          status: FaqEntryStatus.REJECTED,
          ...(dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {}),
        },
      }),
    ]);

    const approvalRate = totalFaqs > 0 ? (publishedFaqs / totalFaqs) * 100 : 0;

    const faqs = await this.faqRepository.find({
      where: dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {},
    });

    const avgConfidenceScore = faqs.length > 0
      ? faqs.reduce((sum, faq) => sum + faq.confidence, 0) / faqs.length
      : 0;

    const faqsBySource = {
      chat: faqs.filter(f => f.source === 'chat').length,
      ticket: faqs.filter(f => f.source === 'ticket').length,
    };

    const categoryMap = new Map<string, number>();
    faqs.forEach(faq => {
      if (faq.category) {
        categoryMap.set(faq.category, (categoryMap.get(faq.category) || 0) + 1);
      }
    });

    const faqsByCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalFaqsGenerated: totalFaqs,
      publishedFaqs,
      pendingReview: pendingFaqs,
      rejectedFaqs,
      approvalRate: Math.round(approvalRate * 10) / 10,
      avgConfidenceScore: Math.round(avgConfidenceScore * 10) / 10,
      avgGenerationTime: 0,
      faqsBySource,
      faqsByCategory,
    };
  }

  async getProviderPerformance(period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<ProviderPerformanceMetrics[]> {
    const dateRange = this.getDateRange(period);

    const faqs = await this.faqRepository.find({
      where: dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {},
    });

    const providerStats = new Map<string, {
      total: number;
      successful: number;
      failed: number;
      totalResponseTime: number;
      totalTokens: number;
      totalConfidence: number;
    }>();

    faqs.forEach(faq => {
      const provider = faq.metadata?.aiProvider || 'unknown';
      const stats = providerStats.get(provider) || {
        total: 0,
        successful: 0,
        failed: 0,
        totalResponseTime: 0,
        totalTokens: 0,
        totalConfidence: 0,
      };

      stats.total++;
      if (faq.status === FaqEntryStatus.PUBLISHED) {
        stats.successful++;
      } else if (faq.status === FaqEntryStatus.REJECTED) {
        stats.failed++;
      }

      stats.totalResponseTime += (faq.metadata as any)?.responseTime || 0;
      stats.totalTokens += (faq.metadata as any)?.tokensUsed || 0;
      stats.totalConfidence += faq.confidence;

      providerStats.set(provider, stats);
    });

    return Array.from(providerStats.entries()).map(([providerName, stats]) => ({
      providerName,
      totalRequests: stats.total,
      successfulRequests: stats.successful,
      failedRequests: stats.failed,
      avgResponseTime: stats.total > 0 ? Math.round(stats.totalResponseTime / stats.total) : 0,
      avgTokensUsed: stats.total > 0 ? Math.round(stats.totalTokens / stats.total) : 0,
      avgConfidence: stats.total > 0 ? Math.round((stats.totalConfidence / stats.total) * 10) / 10 : 0,
      successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100 * 10) / 10 : 0,
    }));
  }

  async getFaqUsageMetrics(period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<FaqUsageMetrics> {
    const dateRange = this.getDateRange(period);

    const faqs = await this.faqRepository.find({
      where: {
        status: FaqEntryStatus.PUBLISHED,
        ...(dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {}),
      },
    });

    let totalViews = 0;
    let totalFeedback = 0;
    let positiveFeedback = 0;
    let negativeFeedback = 0;

    faqs.forEach(faq => {
      totalViews += faq.viewCount || 0;
      totalFeedback += faq.feedbackCount || 0;
      positiveFeedback += faq.positiveFeedbackCount || 0;
      negativeFeedback += faq.notHelpfulCount || 0;
    });

    const satisfactionRate = totalFeedback > 0
      ? (positiveFeedback / totalFeedback) * 100
      : 0;

    const topViewedFaqs = faqs
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10)
      .map(faq => ({
        id: faq.id,
        question: faq.question,
        views: faq.viewCount || 0,
        satisfaction: faq.feedbackCount > 0
          ? ((faq.positiveFeedbackCount || 0) / faq.feedbackCount) * 100
          : 0,
      }));

    const topRatedFaqs = faqs
      .filter(faq => faq.feedbackCount > 0)
      .sort((a, b) => {
        const ratingA = (a.positiveFeedbackCount || 0) / a.feedbackCount;
        const ratingB = (b.positiveFeedbackCount || 0) / b.feedbackCount;
        return ratingB - ratingA;
      })
      .slice(0, 10)
      .map(faq => ({
        id: faq.id,
        question: faq.question,
        rating: faq.feedbackCount > 0
          ? ((faq.positiveFeedbackCount || 0) / faq.feedbackCount) * 100
          : 0,
        feedbackCount: faq.feedbackCount,
      }));

    return {
      totalViews,
      totalFeedback,
      positiveFeedback,
      negativeFeedback,
      satisfactionRate: Math.round(satisfactionRate * 10) / 10,
      topViewedFaqs,
      topRatedFaqs,
    };
  }

  async getROIMetrics(period: 'day' | 'week' | 'month' | 'all' = 'month'): Promise<ROIMetrics> {
    const dateRange = this.getDateRange(period);
    const comparisonDate = this.getComparisonDate(period);

    const [currentTickets, previousTickets, currentChats, previousChats] = await Promise.all([
      this.ticketRepository.count({
        where: dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {},
      }),
      this.ticketRepository.count({
        where: { createdAt: Between(comparisonDate.startDate, comparisonDate.endDate) },
      }),
      this.chatSessionRepository.count({
        where: dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {},
      }),
      this.chatSessionRepository.count({
        where: { createdAt: Between(comparisonDate.startDate, comparisonDate.endDate) },
      }),
    ]);

    const daysDiff = dateRange
      ? Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    const avgTicketsPerDayBefore = previousTickets / daysDiff;
    const avgTicketsPerDayAfter = currentTickets / daysDiff;

    const ticketReductionRate = avgTicketsPerDayBefore > 0
      ? ((avgTicketsPerDayBefore - avgTicketsPerDayAfter) / avgTicketsPerDayBefore) * 100
      : 0;

    const estimatedTicketsSaved = Math.max(0, Math.round((avgTicketsPerDayBefore - avgTicketsPerDayAfter) * daysDiff));

    const avgTicketHandlingTime = 30;
    const estimatedTimeSaved = estimatedTicketsSaved * avgTicketHandlingTime;

    const costPerTicket = 10;
    const estimatedCostSavings = estimatedTicketsSaved * costPerTicket;

    const chatResolutionRate = currentChats > 0
      ? ((currentChats - currentTickets) / currentChats) * 100
      : 0;

    const tickets = await this.ticketRepository.find({
      where: dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {},
    });

    const avgTicketResolutionTime = tickets.length > 0
      ? tickets.reduce((sum, t) => sum + (t.resolutionTimeHours || 0), 0) / tickets.length
      : 0;

    return {
      ticketReductionRate: Math.round(ticketReductionRate * 10) / 10,
      estimatedTicketsSaved,
      estimatedTimeSaved,
      estimatedCostSavings,
      chatResolutionRate: Math.round(chatResolutionRate * 10) / 10,
      avgTicketResolutionTime: Math.round(avgTicketResolutionTime * 10) / 10,
      beforeAfterComparison: {
        before: {
          avgTicketsPerDay: Math.round(avgTicketsPerDayBefore * 10) / 10,
          avgResolutionTime: 0,
        },
        after: {
          avgTicketsPerDay: Math.round(avgTicketsPerDayAfter * 10) / 10,
          avgResolutionTime: Math.round(avgTicketResolutionTime * 10) / 10,
        },
      },
    };
  }

  async getComprehensiveAnalytics(period: 'day' | 'week' | 'month' | 'all' = 'week') {
    const [effectiveness, providerPerformance, usage, roi] = await Promise.all([
      this.getLearningEffectiveness(period),
      this.getProviderPerformance(period),
      this.getFaqUsageMetrics(period),
      this.getROIMetrics(period),
    ]);

    return {
      period,
      generatedAt: new Date(),
      effectiveness,
      providerPerformance,
      usage,
      roi,
    };
  }

  async getPatternAnalytics(period: 'day' | 'week' | 'month' | 'all' = 'week') {
    const dateRange = this.getDateRange(period);

    const patterns = await this.patternRepository.find({
      where: dateRange ? { createdAt: Between(dateRange.startDate, dateRange.endDate) } : {},
      order: { frequency: 'DESC' },
      take: 20,
    });

    return {
      totalPatterns: patterns.length,
      topPatterns: patterns.map(p => ({
        id: p.id,
        pattern: p.patternText,
        frequency: p.frequency,
        category: p.category,
        confidence: p.confidence,
      })),
    };
  }

  private getDateRange(period: 'day' | 'week' | 'month' | 'all'): AnalyticsPeriod | null {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        return { startDate, endDate: now, label: 'Last 24 hours' };
      case 'week':
        startDate.setDate(now.getDate() - 7);
        return { startDate, endDate: now, label: 'Last 7 days' };
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        return { startDate, endDate: now, label: 'Last 30 days' };
      case 'all':
        return null;
      default:
        startDate.setDate(now.getDate() - 7);
        return { startDate, endDate: now, label: 'Last 7 days' };
    }
  }

  private getComparisonDate(period: 'day' | 'week' | 'month' | 'all'): AnalyticsPeriod {
    const now = new Date();
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        endDate.setDate(now.getDate() - 1);
        startDate.setDate(now.getDate() - 2);
        break;
      case 'week':
        endDate.setDate(now.getDate() - 7);
        startDate.setDate(now.getDate() - 14);
        break;
      case 'month':
        endDate.setMonth(now.getMonth() - 1);
        startDate.setMonth(now.getMonth() - 2);
        break;
      default:
        endDate.setDate(now.getDate() - 7);
        startDate.setDate(now.getDate() - 14);
    }

    return { startDate, endDate, label: 'Comparison period' };
  }
}
