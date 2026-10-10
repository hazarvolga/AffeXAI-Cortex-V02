import { Injectable, Logger, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketCategory } from '../entities/ticket-category.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * AI Categorization Service
 * Deterministic keyword-based ticket suggestions; no trained model.
 */

export interface CategoryPrediction {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasons: string[];
  source: 'keyword_heuristic';
  scoreMeaning: 'relative_keyword_match';
}

export interface CategoryTrainingData {
  ticketCount: number;
  accuracy: number;
  lastTrainedAt: Date;
  categories: Array<{
    id: string;
    name: string;
    sampleCount: number;
  }>;
}

@Injectable()
export class AICategorizationService {
  private readonly logger = new Logger(AICategorizationService.name);

  // Fixed keyword weights; these are not calibrated model probabilities.
  private categoryPatterns: Map<string, {
    keywords: string[];
    weight: number;
  }[]> = new Map();

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketCategory)
    private readonly categoryRepository: Repository<TicketCategory>,
    private readonly tenantService: TenantService,
  ) {
    this.initializePatterns();
  }

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    const tenantId=this.tenantService.getTenantId();
    if(!tenantId)throw new ForbiddenException('Tenant context required');
    return tenantId;
  }

  /**
   * Initialize ML patterns (in production, this would load trained models)
   */
  private initializePatterns(): void {
    // Technical Issues
    this.categoryPatterns.set('technical', [
      { keywords: ['bug', 'error', 'crash', 'not working', 'broken', 'hata', 'çalışmıyor'], weight: 10 },
      { keywords: ['500', '404', 'exception', 'timeout', 'connection'], weight: 8 },
      { keywords: ['install', 'setup', 'configure', 'kurulum', 'ayar'], weight: 6 },
    ]);

    // Billing & Payment
    this.categoryPatterns.set('billing', [
      { keywords: ['invoice', 'payment', 'billing', 'charge', 'fatura', 'ödeme', 'ücret'], weight: 10 },
      { keywords: ['refund', 'subscription', 'plan', 'iade', 'abonelik'], weight: 9 },
      { keywords: ['credit card', 'bank', 'paypal', 'kredi kartı'], weight: 8 },
    ]);

    // Account & Access
    this.categoryPatterns.set('account', [
      { keywords: ['login', 'password', 'account', 'access', 'giriş', 'şifre', 'hesap'], weight: 10 },
      { keywords: ['forgot', 'reset', 'locked', 'unuttum', 'kilitli'], weight: 9 },
      { keywords: ['2fa', 'two-factor', 'security', 'güvenlik'], weight: 7 },
    ]);

    // Feature Request
    this.categoryPatterns.set('feature', [
      { keywords: ['feature', 'request', 'add', 'would like', 'özellik', 'istek', 'ekle'], weight: 10 },
      { keywords: ['suggestion', 'improve', 'enhancement', 'öneri', 'geliştir'], weight: 8 },
      { keywords: ['new', 'support', 'yeni', 'destek'], weight: 6 },
    ]);

    // General Question
    this.categoryPatterns.set('question', [
      { keywords: ['how', 'what', 'where', 'why', 'nasıl', 'nedir', 'nerede'], weight: 10 },
      { keywords: ['help', 'guide', 'tutorial', 'yardım', 'kılavuz'], weight: 8 },
      { keywords: ['question', 'soru', 'information', 'bilgi'], weight: 7 },
    ]);

    this.logger.log('AI categorization patterns initialized');
  }

  /**
   * Score category keywords for a ticket
   */
  async predictCategory(ticket: Ticket): Promise<CategoryPrediction[]> {
    const tenantId=this.getActiveTenantId();
    if(ticket.tenantId!==tenantId)throw new ForbiddenException('Ticket tenant mismatch');
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    const predictions: Array<{
      categoryKey: string;
      score: number;
      matchedKeywords: string[];
    }> = [];

    // Calculate scores for each category
    for (const [categoryKey, patterns] of this.categoryPatterns.entries()) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const pattern of patterns) {
        for (const keyword of pattern.keywords) {
          if (content.includes(keyword.toLowerCase())) {
            score += pattern.weight;
            matchedKeywords.push(keyword);
          }
        }
      }

      if (score > 0) {
        predictions.push({
          categoryKey,
          score,
          matchedKeywords,
        });
      }
    }

    // Sort by score
    predictions.sort((a, b) => b.score - a.score);

    // Get categories from database for this tenant
    const categories = await this.categoryRepository.find({
      where: { isActive: true, tenantId },
    });

    // Map predictions to actual categories
    const results: CategoryPrediction[] = [];
    const totalScore = predictions.reduce((sum, p) => sum + p.score, 0);

    for (const pred of predictions.slice(0, 3)) { // Top 3
      // Find matching category by name pattern
      const category = categories.find(c =>
        c.name.toLowerCase().includes(pred.categoryKey) ||
        pred.categoryKey.includes(c.name.toLowerCase())
      );

      if (category) {
        const confidence = totalScore > 0 ? (pred.score / totalScore) * 100 : 0;

        results.push({
          categoryId: category.id,
          categoryName: category.name,
          confidence: Math.round(confidence),
          reasons: pred.matchedKeywords,
          source:'keyword_heuristic',
          scoreMeaning:'relative_keyword_match',
        });
      }
    }

    this.logger.log(
      `Predicted ${results.length} categories for ticket ${ticket.id}`,
    );

    return results;
  }

  /**
   * Auto-assign category to ticket
   */
  async autoCategorizе(ticketId: string): Promise<CategoryPrediction | null> {
    const tenantId = this.getActiveTenantId();
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, tenantId },
    });

    if (!ticket) {
      return null;
    }

    const predictions = await this.predictCategory(ticket);

    if (predictions.length > 0 && predictions[0].confidence >= 60) {
      // Auto-assign if confidence >= 60%
      const result=await this.ticketRepository.update({id:ticketId,tenantId},{categoryId:predictions[0].categoryId});
      if(!result.affected)throw new NotFoundException('Ticket not found');

      this.logger.log(
        `Auto-categorized ticket ${ticketId} to ${predictions[0].categoryName} (${predictions[0].confidence}%)`,
      );

      return predictions[0];
    }

    return null;
  }

  /**
   * Get categorization suggestions (don't auto-assign)
   */
  async getSuggestions(ticketId: string): Promise<CategoryPrediction[]> {
    const tenantId = this.getActiveTenantId();
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, tenantId },
    });

    if (!ticket) {
      return [];
    }

    return await this.predictCategory(ticket);
  }

  /**
   * Report model training as unsupported
   */
  async trainModel(): Promise<CategoryTrainingData> {
    this.getActiveTenantId();
    throw new ServiceUnavailableException('Model training is not implemented; category suggestions use fixed keyword rules');
  }

  /**
   * Get AI categorization statistics
   */
  async getStatistics(): Promise<{
    source:'keyword_heuristic'; trainingAvailable:false; totalTickets:number; categorizedTickets:number;
    totalPredictions:null; autoAssigned:null; averageConfidence:null; accuracyRate:null;
  }> {
    const tenantId=this.getActiveTenantId();
    const [totalTickets,categorizedTickets]=await Promise.all([
      this.ticketRepository.count({where:{tenantId}}),
      this.ticketRepository.count({where:{tenantId,categoryId:Not(IsNull())}}),
    ]);
    return {source:'keyword_heuristic',trainingAvailable:false,totalTickets,categorizedTickets,totalPredictions:null,autoAssigned:null,averageConfidence:null,accuracyRate:null};
  }

  /**
   * Validate prediction accuracy
   */
  async validatePrediction(
    ticketId: string,
    predictedCategoryId: string,
    actualCategoryId: string,
  ): Promise<boolean> {
    const tenantId=this.getActiveTenantId();
    if(!await this.ticketRepository.findOne({where:{id:ticketId,tenantId}}))throw new NotFoundException('Ticket not found');
    for(const categoryId of new Set([predictedCategoryId,actualCategoryId])){
      if(!await this.categoryRepository.findOne({where:{id:categoryId,tenantId,isActive:true}}))throw new NotFoundException('Category not found');
    }
    // Comparison only: no training/evaluation ledger is persisted by this method.
    const isCorrect=predictedCategoryId===actualCategoryId;
    return isCorrect;
  }
}
