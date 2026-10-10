import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqLearningConfig } from '../entities/faq-learning-config.entity';
import {
  FaqAiInterface,
  FaqGenerationRequest,
  FaqGenerationResponse,
  PatternAnalysisRequest,
  PatternAnalysisResponse,
  ProviderStatus
} from '../interfaces/faq-ai.interface';
import { AiService } from '../../ai/ai.service';
import { SettingsService } from '../../settings/settings.service';
import { AiModel } from '../../settings/dto/ai-settings.dto';

/**
 * FAQ AI Service
 * Integrates with global AI service for FAQ generation and analysis
 */
@Injectable()
export class FaqAiService implements FaqAiInterface {
  private readonly logger = new Logger(FaqAiService.name);

  constructor(
    @InjectRepository(FaqLearningConfig)
    private configRepository: Repository<FaqLearningConfig>,
    private aiService: AiService,
    private settingsService: SettingsService,
  ) { }

  /**
   * Generate FAQ answer using global AI service
   */
  async generateFaqAnswer(request: FaqGenerationRequest, tenantId: string): Promise<FaqGenerationResponse> {
    const startTime = Date.now();

    try {
      // Get AI configuration using centralized settings service methods
      const configuration = await this.settingsService.getAiModuleConfiguration('support', tenantId);
      const { apiKey, model, provider, revision } = configuration;

      if (!apiKey) {
        throw new Error('No AI API key configured for FAQ learning');
      }

      const prompt = this.buildFaqPrompt(request);

      const result = await this.aiService.generateCompletion(apiKey, prompt, {
        model,
        provider,
        credentialContext: { tenantId, module: 'support', provider, revision },
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are an expert FAQ generator. Create clear, helpful FAQ entries based on conversation patterns.'
      });

      const processingTime = Date.now() - startTime;

      // Parse AI response (expecting JSON format)
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(result.content);
      } catch {
        // Fallback if not JSON
        parsedResponse = {
          answer: result.content,
          confidence: 75,
          keywords: this.extractKeywords(result.content),
          category: 'General'
        };
      }

      return {
        answer: parsedResponse.answer || result.content,
        confidence: parsedResponse.confidence || 75,
        keywords: parsedResponse.keywords || this.extractKeywords(result.content),
        category: parsedResponse.category || 'General',
        processingTime,
        metadata: {
          aiProvider: provider,
          model: model,
          processingTime,
          tokensUsed: result.tokensUsed
        }
      };
    } catch (error) {
      this.logger.error('Failed to generate FAQ answer:', error);
      throw new Error(`FAQ generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze patterns in conversation data
   */
  async analyzePatterns(request: PatternAnalysisRequest, tenantId: string): Promise<PatternAnalysisResponse> {
    const startTime = Date.now();

    try {
      // Get AI configuration using centralized settings service methods
      const configuration = await this.settingsService.getAiModuleConfiguration('support', tenantId);
      const { apiKey, model, provider, revision } = configuration;

      if (!apiKey) {
        throw new Error('No AI API key configured for pattern analysis');
      }

      const prompt = this.buildPatternAnalysisPrompt(request);

      const result = await this.aiService.generateCompletion(apiKey, prompt, {
        model,
        provider,
        credentialContext: { tenantId, module: 'support', provider, revision },
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 800,
        systemPrompt: 'You are an expert at analyzing conversation patterns and identifying frequently asked questions.'
      });

      const processingTime = Date.now() - startTime;

      // Parse AI response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(result.content);
      } catch {
        parsedResponse = {
          patterns: [],
          confidence: 50,
          recommendations: ['Unable to parse AI response']
        };
      }

      return {
        patterns: parsedResponse.patterns || [],
        confidence: parsedResponse.confidence || 50,
        recommendations: parsedResponse.recommendations || [],
        processingTime,
        metadata: {
          aiProvider: provider,
          model: model,
          processingTime,
          tokensUsed: result.tokensUsed
        }
      };
    } catch (error) {
      this.logger.error('Failed to analyze patterns:', error);
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }

  /**
   * Get current AI provider status and statistics
   */
  async getProviderStatus(tenantId: string): Promise<ProviderStatus> {
    try {
      // Get AI configuration using centralized settings service methods
      const { apiKey, model, provider } = await this.settingsService.getAiModuleConfiguration('support', tenantId);

      if (!apiKey) {
        return {
          provider,
          model: model,
          available: false,configured:false,healthChecked:false
        };
      }

      return {
        provider,model,
        available:false,configured:true,healthChecked:false,
      };
    } catch (error) {
      this.logger.error('Failed to get provider status:', error);
      return {
        provider: 'unknown',
        model: 'unknown',
        available: false
      };
    }
  }

  /**
   * Build FAQ generation prompt
   */
  private buildFaqPrompt(request: FaqGenerationRequest): string {
    return `
Generate a comprehensive FAQ entry based on the following conversation data:

Context: ${request.context}
${request.questionPattern ? `Question Pattern: ${request.questionPattern}` : ''}
${request.answerPattern ? `Answer Pattern: ${request.answerPattern}` : ''}

Please provide a JSON response with the following structure:
{
  "question": "Clear, concise question that users would ask",
  "answer": "Comprehensive, helpful answer",
  "confidence": 85,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "category": "appropriate_category_name"
}

Make sure the FAQ entry is:
- Clear and easy to understand
- Comprehensive but concise
- Helpful for users with similar questions
- Properly categorized
    `.trim();
  }

  /**
   * Build pattern analysis prompt
   */
  private buildPatternAnalysisPrompt(request: PatternAnalysisRequest): string {
    return `
Analyze the following conversation data to identify patterns and potential FAQ entries:

Conversations: ${JSON.stringify(request.conversations)}
Time Range: ${request.timeRange.from} to ${request.timeRange.to}

Please provide a JSON response with:
{
  "patterns": [
    {
      "type": "question_pattern",
      "pattern": "description of the pattern",
      "frequency": 5,
      "confidence": 85,
      "examples": ["example1", "example2"]
    }
  ],
  "confidence": 80,
  "recommendations": [
    "Create FAQ for pattern X",
    "Consider improving documentation for topic Y"
  ]
}

Focus on:
- Frequently asked questions
- Common problem patterns
- Recurring themes
- User pain points
    `.trim();
  }

  /**
   * Extract keywords from text (fallback method)
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Simple frequency-based keyword extraction
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Improve existing FAQ answer (compatibility method)
   */
  async improveAnswer(question: string, answer: string, tenantId: string, feedback?: string[]): Promise<FaqGenerationResponse> {
    const request: FaqGenerationRequest = {
      context: `Question: ${question}\nCurrent Answer: ${answer}\nFeedback: ${feedback?.join(', ') || 'None'}`,
      questionPattern: question,
      answerPattern: answer
    };

    return this.generateFaqAnswer(request, tenantId);
  }

  /**
   * Categorize question (compatibility method)
   */
  async categorizeQuestion(question: string, availableCategories: string[], tenantId: string): Promise<string> {
    const request: FaqGenerationRequest = {
      context: `Question: ${question}\nAvailable Categories: ${availableCategories.join(', ')}`
    };

    const response = await this.generateFaqAnswer(request, tenantId);
    return response.category;
  }

  /**
   * Get provider name from AI model
   */
  private getProviderFromModel(model: AiModel): string {
    if (model.startsWith('gpt-')) return 'openai';
    if (model.startsWith('claude-')) return 'anthropic';
    if (model.startsWith('gemini-')) return 'google';
    return 'unknown';
  }
}
