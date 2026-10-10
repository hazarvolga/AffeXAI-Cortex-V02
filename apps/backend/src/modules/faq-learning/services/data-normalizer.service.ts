import { Injectable } from '@nestjs/common';
import { ExtractedData } from '../interfaces/data-extraction.interface';

@Injectable()
export class DataNormalizerService {
  
  /**
   * Normalize extracted data to standard format
   */
  async normalize(data: ExtractedData[]): Promise<ExtractedData[]> {
    return data.map(item => ({
      ...item,
      question: this.cleanText(item.question),
      answer: this.cleanText(item.answer),
      context: this.cleanText(item.context),
      confidence: this.calculateConfidence(item),
      metadata: {
        ...item.metadata,
        keywords: this.extractKeywords(`${item.question} ${item.answer}`)
      }
    }));
  }

  /**
   * Clean and preprocess text content
   */
  cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove special characters but keep punctuation
      .replace(/[^\w\s.,!?;:()\-'"]/g, '')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      // Remove email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      // Remove phone numbers
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      // Trim and normalize
      .trim();
  }

  /**
   * Extract keywords from text using simple NLP techniques
   */
  extractKeywords(text: string): string[] {
    if (!text) return [];

    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'when', 'where',
      'why', 'how', 'which', 'who', 'whom'
    ]);

    // Extract words and filter
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !stopWords.has(word) &&
        !/^\d+$/.test(word) // Remove pure numbers
      );

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Return top keywords sorted by frequency
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10 keywords
      .map(([word]) => word);
  }

  /**
   * Calculate confidence score based on various factors
   */
  calculateConfidence(data: ExtractedData): number {
    let confidence = 50; // Base confidence

    // Factor 1: User satisfaction (if available)
    if (data.metadata.userSatisfaction) {
      const satisfactionBonus = (data.metadata.userSatisfaction - 3) * 10; // Scale 1-5 to -20 to +20
      confidence += satisfactionBonus;
    }

    // Factor 2: Positive feedback
    if (data.metadata.hasPositiveFeedback) {
      confidence += 15;
    }

    // Factor 3: Resolution status
    if (data.metadata.isResolved) {
      confidence += 10;
    }

    // Factor 4: Response quality (length and structure)
    const answerLength = data.answer.length;
    if (answerLength > 50 && answerLength < 1000) {
      confidence += 10;
    } else if (answerLength < 20) {
      confidence -= 15;
    }

    // Factor 5: Question clarity
    const questionLength = data.question.length;
    if (questionLength > 10 && questionLength < 200) {
      confidence += 5;
    }

    // Factor 6: Context richness
    if (data.context && data.context.length > 100) {
      confidence += 5;
    }

    // Factor 7: Resolution time (faster resolution might indicate clearer issues)
    if (data.metadata.resolutionTime) {
      const resolutionHours = data.metadata.resolutionTime / 3600;
      if (resolutionHours < 1) {
        confidence += 10; // Quick resolution
      } else if (resolutionHours > 24) {
        confidence -= 5; // Slow resolution
      }
    }

    // Factor 8: Session engagement (for chat data)
    if (data.source === 'chat' && data.metadata.messageCount) {
      if (data.metadata.messageCount >= 3 && data.metadata.messageCount <= 10) {
        confidence += 5; // Good engagement
      } else if (data.metadata.messageCount > 20) {
        confidence -= 10; // Too much back and forth
      }
    }

    // Ensure confidence is within bounds
    return Math.max(1, Math.min(100, Math.round(confidence)));
  }

  /**
   * Detect and filter out sensitive information
   */
  private filterSensitiveInfo(text: string): string {
    return text
      // Remove potential passwords or tokens
      .replace(/\b[A-Za-z0-9]{20,}\b/g, '[TOKEN]')
      // Remove credit card numbers
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
      // Remove SSN patterns
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      // Remove API keys patterns
      .replace(/\b[A-Za-z0-9]{32,}\b/g, '[KEY]');
  }

  /**
   * Validate data quality
   */
  validateDataQuality(data: ExtractedData): boolean {
    // Check minimum requirements
    if (!data.question || data.question.length < 5) return false;
    if (!data.answer || data.answer.length < 10) return false;
    
    // Check for spam patterns
    const spamPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /^[A-Z\s!]{20,}$/, // All caps
      /\b(spam|test|lorem ipsum)\b/i
    ];
    
    const combinedText = `${data.question} ${data.answer}`;
    return !spamPatterns.some(pattern => pattern.test(combinedText));
  }
}