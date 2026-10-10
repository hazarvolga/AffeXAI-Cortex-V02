import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LearnedFaqEntry, FaqEntryStatus } from '../entities/learned-faq-entry.entity';
import { LearningPattern } from '../entities/learning-pattern.entity';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import { FaqAiService } from './faq-ai.service';
import { ConfidenceCalculatorService } from './confidence-calculator.service';
import { NormalizedData } from '../interfaces/data-extraction.interface';

export interface FaqTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  tone: 'professional' | 'friendly' | 'technical';
  language: string;
}

export interface FaqGenerationOptions {
  useTemplates: boolean;
  enableCategoryAutoAssignment: boolean;
  enableDuplicateDetection: boolean;
  enableQualityValidation: boolean;
  mergeSimilarFaqs: boolean;
  similarityThreshold: number;
  minConfidenceThreshold: number;
}

export interface GeneratedFaq {
  question: string;
  answer: string;
  category?: string;
  keywords: string[];
  confidence: number;
  template?: string;
  relatedQuestions?: string[];
  metadata: {
    generationMethod: 'ai' | 'template' | 'merged';
    sourcePatterns: string[];
    qualityScore: number;
    duplicateOf?: string;
    mergedFrom?: string[];
  };
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  similarFaqs: Array<{
    id: string;
    question: string;
    similarity: number;
  }>;
  recommendation: 'merge' | 'keep_separate' | 'discard';
}

@Injectable()
export class FaqGeneratorService {
  private readonly logger = new Logger(FaqGeneratorService.name);
  private templates: Map<string, FaqTemplate> = new Map();

  constructor(
    @InjectRepository(LearnedFaqEntry)
    private faqRepository: Repository<LearnedFaqEntry>,
    @InjectRepository(LearningPattern)
    private patternRepository: Repository<LearningPattern>,
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
    private faqAiService: FaqAiService,
    private confidenceCalculator: ConfidenceCalculatorService,
  ) {
    this.initializeTemplates();
  }

  async generateFaq(
    data: NormalizedData,
    patterns: LearningPattern[],
    tenantId: string,
    options?: Partial<FaqGenerationOptions>
  ): Promise<GeneratedFaq> {

    const config = await this.getGenerationConfig(tenantId);
    const finalOptions: FaqGenerationOptions = {
      ...config,
      ...options
    };

    try {
      this.logger.log(`Generating FAQ for question: ${data.question.substring(0, 50)}...`);

      // Step 1: Check for duplicates if enabled
      let duplicateResult: DuplicateDetectionResult | null = null;
      if (finalOptions.enableDuplicateDetection) {
        duplicateResult = await this.detectDuplicates(data.question, tenantId, finalOptions.similarityThreshold);

        if (duplicateResult.isDuplicate && duplicateResult.recommendation === 'discard') {
          throw new Error('FAQ is duplicate and should be discarded');
        }
      }

      // Step 2: Determine generation method
      let generatedFaq: GeneratedFaq;

      if (finalOptions.useTemplates) {
        const template = await this.findBestTemplate(data, patterns);
        if (template) {
          generatedFaq = await this.generateFromTemplate(data, template, patterns, tenantId);
        } else {
          generatedFaq = await this.generateWithAi(data, patterns, tenantId);
        }
      } else {
        generatedFaq = await this.generateWithAi(data, patterns, tenantId);
      }

      // Step 3: Auto-assign category if enabled
      if (finalOptions.enableCategoryAutoAssignment && !generatedFaq.category) {
        generatedFaq.category = await this.autoAssignCategory(generatedFaq.question, generatedFaq.answer, tenantId);
      }

      // Step 4: Quality validation
      if (finalOptions.enableQualityValidation) {
        const qualityScore = await this.validateQuality(generatedFaq);
        generatedFaq.metadata.qualityScore = qualityScore;

        if (qualityScore < finalOptions.minConfidenceThreshold) {
          throw new Error(`FAQ quality score ${qualityScore} below threshold ${finalOptions.minConfidenceThreshold}`);
        }
      }

      // Step 5: Handle merging if duplicate detected
      if (duplicateResult?.isDuplicate && duplicateResult.recommendation === 'merge' && finalOptions.mergeSimilarFaqs) {
        generatedFaq = await this.mergeFaqs(generatedFaq, duplicateResult.similarFaqs, tenantId);
      }

      this.logger.log(`FAQ generated successfully with confidence ${generatedFaq.confidence}`);
      return generatedFaq;

    } catch (error) {
      this.logger.error('FAQ generation failed:', error);
      throw new Error(`FAQ generation failed: ${error.message}`);
    }
  }

  async generateBatch(
    dataList: NormalizedData[],
    tenantId: string,
    options?: Partial<FaqGenerationOptions>
  ): Promise<{
    successful: GeneratedFaq[];
    failed: Array<{ data: NormalizedData; error: string }>;
  }> {

    const successful: GeneratedFaq[] = [];
    const failed: Array<{ data: NormalizedData; error: string }> = [];

    this.logger.log(`Starting batch FAQ generation for ${dataList.length} items`);

    for (const data of dataList) {
      try {
        // Find relevant patterns for this data
        const patterns = await this.findRelevantPatterns(data, tenantId);
        const faq = await this.generateFaq(data, patterns, tenantId, options);
        successful.push(faq);
      } catch (error) {
        failed.push({
          data,
          error: error.message
        });
        this.logger.warn(`Failed to generate FAQ for ${data.sourceId}:`, error);
      }
    }

    this.logger.log(`Batch generation completed: ${successful.length} successful, ${failed.length} failed`);
    return { successful, failed };
  }

  async detectDuplicates(question: string, tenantId: string, threshold: number = 0.8): Promise<DuplicateDetectionResult> {
    try {
      // Get existing FAQs for comparison
      const existingFaqs = await this.faqRepository.find({
        where: {
          status: In([FaqEntryStatus.APPROVED, FaqEntryStatus.PUBLISHED]),
          tenantId
        },
        select: ['id', 'question']
      });

      const similarFaqs = [];

      for (const existingFaq of existingFaqs) {
        const similarity = await this.calculateSimilarity(question, existingFaq.question);

        if (similarity >= threshold) {
          similarFaqs.push({
            id: existingFaq.id,
            question: existingFaq.question,
            similarity
          });
        }
      }

      // Sort by similarity
      similarFaqs.sort((a, b) => b.similarity - a.similarity);

      const isDuplicate = similarFaqs.length > 0;
      let recommendation: 'merge' | 'keep_separate' | 'discard' = 'keep_separate';

      if (isDuplicate) {
        const highestSimilarity = similarFaqs[0].similarity;

        if (highestSimilarity >= 0.95) {
          recommendation = 'discard'; // Too similar, likely exact duplicate
        } else if (highestSimilarity >= 0.85) {
          recommendation = 'merge'; // Similar enough to merge
        } else {
          recommendation = 'keep_separate'; // Similar but different enough
        }
      }

      return {
        isDuplicate,
        similarFaqs: similarFaqs.slice(0, 5), // Return top 5 similar FAQs
        recommendation
      };

    } catch (error) {
      this.logger.error('Duplicate detection failed:', error);
      return {
        isDuplicate: false,
        similarFaqs: [],
        recommendation: 'keep_separate'
      };
    }
  }

  async mergeFaqs(newFaq: GeneratedFaq, similarFaqs: Array<{ id: string; question: string; similarity: number }>, tenantId: string): Promise<GeneratedFaq> {
    try {
      // Get the most similar existing FAQ
      const mostSimilarId = similarFaqs[0].id;
      const existingFaq = await this.faqRepository.findOne({
        where: { id: mostSimilarId, tenantId }
      });

      if (!existingFaq) {
        return newFaq; // Can't merge, return original
      }

      // Simple merge without AI improvement for now
      const mergedResponse = {
        answer: `${existingFaq.answer}\n\nAdditional information: ${newFaq.answer}`,
        confidence: Math.max(existingFaq.confidence, newFaq.confidence)
      };

      // Combine keywords
      const combinedKeywords = Array.from(new Set([
        ...existingFaq.keywords,
        ...newFaq.keywords
      ]));

      // Update the existing FAQ
      existingFaq.answer = mergedResponse.answer;
      existingFaq.keywords = combinedKeywords;
      existingFaq.usageCount += 1; // Increment usage as it's being reinforced

      // Update metadata
      existingFaq.metadata = {
        ...existingFaq.metadata,
        mergedAt: new Date(),
        mergedFrom: [newFaq.metadata.sourcePatterns[0] || 'unknown'],
        mergedCount: ((existingFaq.metadata as any)?.mergedCount || 0) + 1
      } as any;

      await this.faqRepository.save(existingFaq);

      // Return the merged FAQ data
      return {
        question: existingFaq.question,
        answer: mergedResponse.answer,
        category: existingFaq.category,
        keywords: combinedKeywords,
        confidence: Math.max(newFaq.confidence, existingFaq.confidence),
        metadata: {
          ...newFaq.metadata,
          generationMethod: 'merged',
          mergedFrom: [mostSimilarId]
        }
      };

    } catch (error) {
      this.logger.error('FAQ merging failed:', error);
      return newFaq; // Return original if merge fails
    }
  }

  private async generateWithAi(data: NormalizedData, patterns: LearningPattern[], tenantId: string): Promise<GeneratedFaq> {
    // Get existing FAQs for context
    const existingFaqs = await this.getRelatedFaqs(tenantId, data.category, data.keywords);

    const aiResponse = await this.faqAiService.generateFaqAnswer({
      context: `Question: ${data.question}\nConversation: ${data.metadata?.originalConversation || 'N/A'}\nExisting FAQs: ${existingFaqs.map(faq => `Q: ${faq.question} A: ${faq.answer}`).join('\n')}`,
      questionPattern: data.question,
      category: data.category
    }, tenantId);

    return {
      question: data.question,
      answer: aiResponse.answer,
      category: aiResponse.category || data.category,
      keywords: aiResponse.keywords,
      confidence: data.confidence,
      relatedQuestions: [], // Will be populated later
      metadata: {
        generationMethod: 'ai',
        sourcePatterns: patterns.map(p => p.id),
        qualityScore: aiResponse.confidence || 75
      }
    };
  }

  private async generateFromTemplate(
    data: NormalizedData,
    template: FaqTemplate,
    patterns: LearningPattern[],
    tenantId: string
  ): Promise<GeneratedFaq> {

    // Extract variables from the data
    const variables = this.extractTemplateVariables(data, template);

    // Fill template
    let answer = template.template;
    for (const [key, value] of Object.entries(variables)) {
      answer = answer.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Use template-based answer as is for now
    const improvedResponse = {
      answer: answer,
      confidence: 75
    };

    return {
      question: data.question,
      answer: improvedResponse.answer,
      category: template.category || data.category,
      keywords: data.keywords,
      confidence: data.confidence * 0.9, // Slightly lower confidence for template-based
      template: template.id,
      metadata: {
        generationMethod: 'template',
        sourcePatterns: patterns.map(p => p.id),
        qualityScore: 80
      }
    };
  }

  private async findBestTemplate(data: NormalizedData, patterns: LearningPattern[]): Promise<FaqTemplate | null> {
    // Simple template matching based on keywords and category
    for (const template of this.templates.values()) {
      if (template.category === data.category) {
        // Check if question contains template keywords
        const templateKeywords = template.variables;
        const matchingKeywords = data.keywords.filter(k =>
          templateKeywords.some(tk => k.includes(tk) || tk.includes(k))
        );

        if (matchingKeywords.length >= 2) {
          return template;
        }
      }
    }

    return null;
  }

  private extractTemplateVariables(data: NormalizedData, template: FaqTemplate): Record<string, string> {
    const variables: Record<string, string> = {};

    // Extract common variables
    variables.category = data.category || 'general';
    variables.question = data.question;

    // Extract specific variables based on template
    for (const variable of template.variables) {
      switch (variable) {
        case 'product':
          variables.product = this.extractProduct(data.question) || 'our product';
          break;
        case 'action':
          variables.action = this.extractAction(data.question) || 'perform this action';
          break;
        case 'issue':
          variables.issue = this.extractIssue(data.question) || 'this issue';
          break;
        default:
          variables[variable] = `[${variable}]`;
      }
    }

    return variables;
  }

  private extractProduct(question: string): string | null {
    // Simple product extraction logic
    const products = ['password', 'account', 'email', 'profile', 'settings'];
    for (const product of products) {
      if (question.toLowerCase().includes(product)) {
        return product;
      }
    }
    return null;
  }

  private extractAction(question: string): string | null {
    // Simple action extraction logic
    const actions = ['reset', 'change', 'update', 'delete', 'create', 'login', 'logout'];
    for (const action of actions) {
      if (question.toLowerCase().includes(action)) {
        return action;
      }
    }
    return null;
  }

  private extractIssue(question: string): string | null {
    // Simple issue extraction logic
    const issues = ['not working', 'error', 'problem', 'issue', 'broken', 'failed'];
    for (const issue of issues) {
      if (question.toLowerCase().includes(issue)) {
        return issue;
      }
    }
    return null;
  }

  private async autoAssignCategory(question: string, answer: string, tenantId: string): Promise<string> {
    try {
      // Get available categories from existing FAQs
      const categories = await this.faqRepository
        .createQueryBuilder('faq')
        .select('DISTINCT faq.category', 'category')
        .where('faq.category IS NOT NULL')
        .andWhere('faq.tenantId = :tenantId', { tenantId })
        .getRawMany();

      const availableCategories = categories.map(c => c.category);

      if (availableCategories.length === 0) {
        return 'General';
      }

      return await this.faqAiService.categorizeQuestion(question, availableCategories, tenantId);
    } catch (error) {
      this.logger.warn('Auto-category assignment failed:', error);
      return 'General';
    }
  }

  private async validateQuality(faq: GeneratedFaq): Promise<number> {
    let score = 70; // Base score

    // Check answer length
    if (faq.answer.length >= 50 && faq.answer.length <= 1000) {
      score += 10;
    }

    // Check for actionable content
    if (faq.answer.includes('click') || faq.answer.includes('go to') || faq.answer.includes('select')) {
      score += 10;
    }

    // Check for structured content
    if (faq.answer.includes('\n') || faq.answer.includes('1.') || faq.answer.includes('-')) {
      score += 10;
    }

    // Check keywords relevance
    if (faq.keywords.length >= 3) {
      score += 5;
    }

    return Math.min(100, score);
  }

  private async calculateSimilarity(text1: string, text2: string): Promise<number> {
    // Simple similarity calculation using Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private async findRelevantPatterns(data: NormalizedData, tenantId: string): Promise<LearningPattern[]> {
    try {
      return await this.patternRepository.find({
        where: {
          category: data.category,
          tenantId
        },
        order: {
          frequency: 'DESC',
          confidence: 'DESC'
        },
        take: 10
      });
    } catch (error) {
      this.logger.warn('Failed to find relevant patterns:', error);
      return [];
    }
  }

  private async getRelatedFaqs(tenantId: string, category?: string, keywords: string[] = []): Promise<LearnedFaqEntry[]> {
    try {
      const queryBuilder = this.faqRepository.createQueryBuilder('faq')
        .where('faq.status IN (:...statuses)', {
          statuses: [FaqEntryStatus.APPROVED, FaqEntryStatus.PUBLISHED]
        })
        .andWhere('faq.tenantId = :tenantId', { tenantId });

      if (category) {
        queryBuilder.andWhere('faq.category = :category', { category });
      }

      return await queryBuilder
        .orderBy('faq.usageCount', 'DESC')
        .take(5)
        .getMany();
    } catch (error) {
      this.logger.warn('Failed to get related FAQs:', error);
      return [];
    }
  }

  private async getGenerationConfig(tenantId: string): Promise<FaqGenerationOptions> {
    try {
      const config = await this.configRepository.findOne({
        where: { configKey: 'faq_generation', tenantId }
      });

      const defaultOptions: FaqGenerationOptions = {
        useTemplates: true,
        enableCategoryAutoAssignment: true,
        enableDuplicateDetection: true,
        enableQualityValidation: true,
        mergeSimilarFaqs: true,
        similarityThreshold: 0.8,
        minConfidenceThreshold: 60
      };

      return (config?.configValue as FaqGenerationOptions) || defaultOptions;
    } catch (error) {
      this.logger.error('Failed to load generation config:', error);
      return {
        useTemplates: true,
        enableCategoryAutoAssignment: true,
        enableDuplicateDetection: true,
        enableQualityValidation: true,
        mergeSimilarFaqs: true,
        similarityThreshold: 0.8,
        minConfidenceThreshold: 60
      };
    }
  }

  private initializeTemplates(): void {
    // Initialize common FAQ templates
    const templates: FaqTemplate[] = [
      {
        id: 'password-reset',
        name: 'Password Reset',
        category: 'Authentication',
        template: 'To reset your {{product}}, please follow these steps:\n1. Go to the login page\n2. Click "Forgot Password"\n3. Enter your email address\n4. Check your email for reset instructions\n5. Follow the link in the email to create a new password',
        variables: ['product'],
        tone: 'professional',
        language: 'en'
      },
      {
        id: 'account-issue',
        name: 'Account Issue',
        category: 'Account',
        template: 'If you\'re experiencing {{issue}} with your {{product}}, try these solutions:\n1. Clear your browser cache\n2. Try logging out and back in\n3. Check if your account is active\n4. Contact support if the problem persists',
        variables: ['issue', 'product'],
        tone: 'friendly',
        language: 'en'
      }
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }

    this.logger.log(`Initialized ${templates.length} FAQ templates`);
  }
}