import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import { GeneralCommunicationContextService, PlatformInfoSource } from './general-communication-context.service';
import { ContextResult } from './chat-context-engine.service';
import { ChatAiSettingsService } from './chat-ai-settings.service';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface GeneralAiResponse {
  content: string;
  confidence: number;
  responseType: 'informational' | 'guidance' | 'escalation-suggested' | 'clarification-needed';
  suggestedActions?: string[];
  contextSources?: PlatformInfoSource[];
  escalationReason?: string;
}

export interface GeneralCommunicationOptions {
  includeContextSources?: boolean;
  maxResponseLength?: number;
  tone?: 'friendly' | 'professional' | 'helpful';
  language?: 'tr' | 'en';
}

@Injectable()
export class GeneralCommunicationAiService {
  private readonly logger = new Logger(GeneralCommunicationAiService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly generalContextService: GeneralCommunicationContextService,
    private readonly chatAiSettings: ChatAiSettingsService,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Generate AI response for general communication queries
   */
  async generateGeneralResponse(
    query: string,
    sessionId: string,
    options: GeneralCommunicationOptions = {}
  ): Promise<GeneralAiResponse> {
    const tenantId = this.tenantService.getTenantId();
    const startTime = Date.now();

    this.logger.log(`Generating general communication response for query: "${query}"`);

    const {
      includeContextSources = true,
      maxResponseLength = 800,
      tone = 'friendly',
      language = 'tr'
    } = options;

    try {
      // Build context for the query
      let contextResult: ContextResult | null = null;
      if (includeContextSources) {
        contextResult = await this.generalContextService.buildGeneralContext(query, sessionId, {
          maxSources: 6,
          minRelevanceScore: 0.2,
          focusOnPlatformInfo: true
        });
      }

      // Determine response type based on query analysis
      const responseType = this.analyzeQueryType(query);

      // Check if escalation to support is needed
      const needsEscalation = this.shouldEscalateToSupport(query, contextResult);

      if (needsEscalation.shouldEscalate) {
        return {
          content: this.generateEscalationResponse(query, needsEscalation.reason, language),
          confidence: 0.9,
          responseType: 'escalation-suggested',
          escalationReason: needsEscalation.reason,
          contextSources: contextResult?.sources as PlatformInfoSource[] || []
        };
      }

      // Generate AI prompt based on context and query type
      const prompt = this.buildGeneralCommunicationPrompt(
        query,
        contextResult,
        responseType,
        { tone, language, maxResponseLength }
      );

      // Get AI configuration
      const aiConfig = await this.chatAiSettings.getChatAiConfiguration();

      // Get AI response
      const aiResponseResult = await this.aiService.generateCompletion(
        aiConfig.apiKey,
        prompt,
        {
          model: aiConfig.model,
          maxTokens: Math.ceil(maxResponseLength * 1.5), // Account for token vs character difference
          temperature: 0.7,
          systemPrompt: this.getSystemMessage(language, tone)
        }
      );

      // Calculate confidence based on context quality and response type
      const confidence = this.calculateResponseConfidence(contextResult, responseType, aiResponseResult.content);

      // Extract suggested actions if any
      const suggestedActions = this.extractSuggestedActions(aiResponseResult.content, language);

      const processingTime = Date.now() - startTime;
      this.logger.log(`General response generated in ${processingTime}ms with confidence: ${confidence}`);

      return {
        content: aiResponseResult.content,
        confidence,
        responseType,
        suggestedActions,
        contextSources: contextResult?.sources as PlatformInfoSource[] || []
      };

    } catch (error) {
      this.logger.error(`Error generating general response: ${error.message}`, error.stack);

      // Return fallback response
      return {
        content: this.getFallbackResponse(language),
        confidence: 0.3,
        responseType: 'clarification-needed',
        suggestedActions: [
          language === 'tr'
            ? 'Sorunuzu daha detaylı açıklayabilir misiniz?'
            : 'Could you please provide more details about your question?'
        ]
      };
    }
  }

  /**
   * Analyze query type to determine appropriate response strategy
   */
  private analyzeQueryType(query: string): GeneralAiResponse['responseType'] {
    const queryLower = query.toLowerCase();

    // Check for informational queries
    const informationalPatterns = [
      /nedir|ne demek|what is|what does/i,
      /nasıl çalışır|how does.*work/i,
      /platform.*nedir|what.*platform/i,
      /özellik.*nedir|what.*feature/i
    ];

    if (informationalPatterns.some(pattern => pattern.test(query))) {
      return 'informational';
    }

    // Check for guidance-seeking queries
    const guidancePatterns = [
      /nasıl|how to|how do/i,
      /adım|step|rehber|guide/i,
      /kullanım|usage|use/i,
      /başlangıç|getting started/i
    ];

    if (guidancePatterns.some(pattern => pattern.test(query))) {
      return 'guidance';
    }

    // Check for unclear or complex queries
    if (query.length < 10 || query.split(' ').length < 3) {
      return 'clarification-needed';
    }

    // Default to informational
    return 'informational';
  }

  /**
   * Determine if query should be escalated to support
   */
  private shouldEscalateToSupport(
    query: string,
    contextResult: ContextResult | null
  ): { shouldEscalate: boolean; reason?: string } {
    const queryLower = query.toLowerCase();

    // Technical problem indicators
    const technicalProblemPatterns = [
      /çalışmıyor|not working|broken/i,
      /hata|error|bug/i,
      /sorun|problem|issue/i,
      /yavaş|slow|performance/i,
      /erişemiyorum|can't access|cannot access/i,
      /giriş yapamıyorum|can't login|cannot login/i
    ];

    if (technicalProblemPatterns.some(pattern => pattern.test(query))) {
      return {
        shouldEscalate: true,
        reason: 'technical-problem'
      };
    }

    // Account/billing related queries
    const accountPatterns = [
      /hesap|account/i,
      /fatura|billing|payment/i,
      /ödeme|subscription/i,
      /iptal|cancel/i,
      /upgrade|downgrade/i
    ];

    if (accountPatterns.some(pattern => pattern.test(query))) {
      return {
        shouldEscalate: true,
        reason: 'account-billing'
      };
    }

    // Low context relevance might indicate complex issue
    if (contextResult && contextResult.totalRelevanceScore < 1.0 && contextResult.sources.length < 2) {
      return {
        shouldEscalate: true,
        reason: 'insufficient-context'
      };
    }

    // Urgent language indicators
    const urgentPatterns = [
      /acil|urgent|emergency/i,
      /hemen|immediately|asap/i,
      /kritik|critical/i
    ];

    if (urgentPatterns.some(pattern => pattern.test(query))) {
      return {
        shouldEscalate: true,
        reason: 'urgent-request'
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Build AI prompt for general communication
   */
  private buildGeneralCommunicationPrompt(
    query: string,
    contextResult: ContextResult | null,
    responseType: GeneralAiResponse['responseType'],
    options: { tone: string; language: string; maxResponseLength: number }
  ): string {
    const { tone, language, maxResponseLength } = options;

    let prompt = '';

    // Add context information if available
    if (contextResult && contextResult.sources.length > 0) {
      prompt += language === 'tr'
        ? 'Aşağıdaki bilgi kaynaklarını kullanarak kullanıcının sorusunu yanıtla:\n\n'
        : 'Use the following information sources to answer the user\'s question:\n\n';

      contextResult.sources.forEach((source, index) => {
        prompt += `${index + 1}. **${source.title}**\n`;
        prompt += `   Kategori: ${(source as PlatformInfoSource).category}\n`;
        prompt += `   İçerik: ${source.content}\n`;
        if (source.url) {
          prompt += `   Link: ${source.url}\n`;
        }
        prompt += '\n';
      });

      prompt += '---\n\n';
    }

    // Add response type specific instructions
    switch (responseType) {
      case 'informational':
        prompt += language === 'tr'
          ? 'Kullanıcı bilgi arıyor. Açık, anlaşılır ve kapsamlı bir açıklama yap.\n'
          : 'The user is seeking information. Provide a clear, understandable, and comprehensive explanation.\n';
        break;

      case 'guidance':
        prompt += language === 'tr'
          ? 'Kullanıcı rehberlik arıyor. Adım adım talimatlar ve pratik öneriler ver.\n'
          : 'The user is seeking guidance. Provide step-by-step instructions and practical suggestions.\n';
        break;

      case 'clarification-needed':
        prompt += language === 'tr'
          ? 'Soru belirsiz. Açıklama iste ve genel yardım önerileri sun.\n'
          : 'The question is unclear. Ask for clarification and provide general help suggestions.\n';
        break;
    }

    // Add tone and style instructions
    const toneInstructions = {
      friendly: language === 'tr'
        ? 'Samimi ve dostane bir ton kullan. Kullanıcıyı destekleyici bir şekilde karşıla.'
        : 'Use a warm and friendly tone. Be supportive and welcoming to the user.',
      professional: language === 'tr'
        ? 'Profesyonel ama erişilebilir bir ton kullan. Resmi olmaktan kaçın.'
        : 'Use a professional but accessible tone. Avoid being overly formal.',
      helpful: language === 'tr'
        ? 'Yardımsever ve çözüm odaklı bir yaklaşım benimse.'
        : 'Adopt a helpful and solution-focused approach.'
    };

    prompt += `\n${toneInstructions[tone as keyof typeof toneInstructions]}\n\n`;

    // Add length constraint
    prompt += language === 'tr'
      ? `Yanıtını ${maxResponseLength} karakter ile sınırla.\n\n`
      : `Limit your response to ${maxResponseLength} characters.\n\n`;

    // Add the user's question
    prompt += language === 'tr'
      ? `Kullanıcı Sorusu: "${query}"\n\nYanıt:`
      : `User Question: "${query}"\n\nResponse:`;

    return prompt;
  }

  /**
   * Get system message for AI
   */
  private getSystemMessage(language: string, tone: string): string {
    if (language === 'tr') {
      return `Sen Affex AI platformunun genel iletişim asistanısın. Kullanıcılara platform hakkında bilgi verme, rehberlik etme ve genel sorularını yanıtlama konusunda uzmanısın. 

Görevlerin:
- Platform özelliklerini açıklamak
- Kullanım rehberleri sunmak  
- Genel sorulara yanıt vermek
- Gerektiğinde destek ekibine yönlendirmek

${tone === 'friendly' ? 'Samimi ve dostane ol.' : tone === 'professional' ? 'Profesyonel ama erişilebilir ol.' : 'Yardımsever ve çözüm odaklı ol.'}

Teknik sorunlar, hesap/fatura konuları veya acil durumlar için kullanıcıyı destek ekibine yönlendir.`;
    } else {
      return `You are the general communication assistant for the Affex AI platform. You specialize in providing information about the platform, offering guidance, and answering general questions.

Your responsibilities:
- Explain platform features
- Provide usage guides
- Answer general questions
- Escalate to support team when necessary

${tone === 'friendly' ? 'Be warm and friendly.' : tone === 'professional' ? 'Be professional but accessible.' : 'Be helpful and solution-focused.'}

For technical problems, account/billing issues, or urgent matters, direct users to the support team.`;
    }
  }

  /**
   * Calculate response confidence based on context quality
   */
  private calculateResponseConfidence(
    contextResult: ContextResult | null,
    responseType: GeneralAiResponse['responseType'],
    aiResponse: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Context quality factor
    if (contextResult) {
      const avgRelevance = contextResult.sources.length > 0
        ? contextResult.totalRelevanceScore / contextResult.sources.length
        : 0;
      confidence += avgRelevance * 0.3;
    }

    // Response type factor
    const typeConfidence = {
      'informational': 0.8,
      'guidance': 0.7,
      'escalation-suggested': 0.9,
      'clarification-needed': 0.4
    };
    confidence = Math.max(confidence, typeConfidence[responseType]);

    // Response quality indicators
    if (aiResponse.length > 100 && aiResponse.length < 1000) {
      confidence += 0.1; // Good length
    }

    if (aiResponse.includes('adım') || aiResponse.includes('step')) {
      confidence += 0.05; // Contains actionable steps
    }

    // Normalize to 0-1 range
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Extract suggested actions from AI response
   */
  private extractSuggestedActions(aiResponse: string, language: string): string[] {
    const actions: string[] = [];

    // Look for numbered lists or bullet points
    const listPatterns = [
      /\d+\.\s*([^\n]+)/g,
      /[-•]\s*([^\n]+)/g
    ];

    for (const pattern of listPatterns) {
      const matches = aiResponse.match(pattern);
      if (matches) {
        actions.push(...matches.slice(0, 3)); // Limit to 3 actions
        break;
      }
    }

    // If no structured actions found, look for imperative sentences
    if (actions.length === 0) {
      const imperativePatterns = language === 'tr'
        ? [/([A-ZÇĞIÖŞÜ][^.!?]*(?:yapın|edin|alın|gidin|tıklayın|seçin)[^.!?]*[.!?])/g]
        : [/([A-Z][^.!?]*(?:click|go|select|choose|try|check)[^.!?]*[.!?])/g];

      for (const pattern of imperativePatterns) {
        const matches = aiResponse.match(pattern);
        if (matches) {
          actions.push(...matches.slice(0, 2));
          break;
        }
      }
    }

    return actions;
  }

  /**
   * Generate escalation response
   */
  private generateEscalationResponse(query: string, reason: string, language: string): string {
    const templates = {
      tr: {
        'technical-problem': 'Teknik bir sorun yaşıyor gibi görünüyorsunuz. Bu konuda size daha iyi yardımcı olabilmek için destek ekibimizle iletişime geçmenizi öneririm. Destek ekibimiz teknik sorunları çözmede uzmanlaşmıştır ve size hızlı bir çözüm sunabilir.',
        'account-billing': 'Hesap veya fatura ile ilgili sorularınız için destek ekibimizle iletişime geçmeniz gerekiyor. Bu tür konular kişisel bilgiler içerdiği için güvenlik nedeniyle destek ekibimiz tarafından ele alınmaktadır.',
        'insufficient-context': 'Sorununuz hakkında yeterli bilgiye sahip değilim. Size daha iyi yardımcı olabilmek için destek ekibimizle iletişime geçmenizi öneririm. Onlar sorununuzu daha detaylı inceleyebilir.',
        'urgent-request': 'Acil bir durumla karşılaştığınızı anlıyorum. Bu tür durumlar için destek ekibimizle hemen iletişime geçmenizi şiddetle öneririm. Onlar size öncelikli olarak yardımcı olacaklardır.'
      },
      en: {
        'technical-problem': 'It seems you\'re experiencing a technical issue. I recommend contacting our support team for better assistance with this matter. Our support team specializes in resolving technical problems and can provide you with a quick solution.',
        'account-billing': 'For account or billing related questions, you need to contact our support team. These types of issues involve personal information and are handled by our support team for security reasons.',
        'insufficient-context': 'I don\'t have enough information about your issue. I recommend contacting our support team for better assistance. They can examine your problem in more detail.',
        'urgent-request': 'I understand you\'re facing an urgent situation. For such cases, I strongly recommend contacting our support team immediately. They will assist you with priority.'
      }
    };

    const template = templates[language as keyof typeof templates]?.[reason as keyof typeof templates['tr']]
      || templates[language as keyof typeof templates]['insufficient-context'];

    const escalationSuffix = language === 'tr'
      ? '\n\nDestek ekibimizle iletişime geçmek için "Destek Ekibiyle İletişim" butonuna tıklayabilirsiniz.'
      : '\n\nYou can click the "Contact Support Team" button to get in touch with our support team.';

    return template + escalationSuffix;
  }

  /**
   * Get fallback response when AI generation fails
   */
  private getFallbackResponse(language: string): string {
    return language === 'tr'
      ? 'Üzgünüm, şu anda sorununuza uygun bir yanıt oluşturamıyorum. Lütfen sorunuzu daha detaylı açıklayın veya destek ekibimizle iletişime geçin.'
      : 'I\'m sorry, I cannot generate an appropriate response to your question right now. Please provide more details about your question or contact our support team.';
  }

  /**
   * Get conversation starters for general communication
   */
  async getConversationStarters(language: string = 'tr'): Promise<string[]> {
    const starters = {
      tr: [
        'Platform nasıl çalışır?',
        'Hangi özellikler mevcut?',
        'Nasıl başlayabilirim?',
        'Hesabımı nasıl yönetebilirim?',
        'Fiyatlandırma nasıl?',
        'Mobil uygulama var mı?'
      ],
      en: [
        'How does the platform work?',
        'What features are available?',
        'How can I get started?',
        'How can I manage my account?',
        'How does pricing work?',
        'Is there a mobile app?'
      ]
    };

    return starters[language as keyof typeof starters] || starters.tr;
  }
}