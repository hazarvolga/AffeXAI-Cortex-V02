import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningPattern, PatternType } from '../entities/learning-pattern.entity';
import {
  IPatternRecognitionService,
  PatternMatch,
  QuestionGroup,
  SimilarityResult,
  PatternAnalysisResult
} from '../interfaces/pattern-recognition.interface';
import { ExtractedData } from '../interfaces/data-extraction.interface';
import * as crypto from 'crypto';

@Injectable()
export class PatternRecognitionService implements IPatternRecognitionService {
  private readonly logger = new Logger(PatternRecognitionService.name);

  constructor(
    @InjectRepository(LearningPattern)
    private patternRepository: Repository<LearningPattern>,
  ) { }

  /**
   * Identify patterns from extracted data
   */
  async identifyPatterns(data: ExtractedData[], tenantId: string): Promise<PatternMatch[]> {
    const result = await this.analyzePatterns(data, tenantId);
    return result.patterns;
  }

  /**
   * Analyze extracted data to identify patterns
   */
  async analyzePatterns(data: ExtractedData[], tenantId: string): Promise<PatternAnalysisResult> {
    const startTime = Date.now();
    this.logger.log(`Analyzing patterns from ${data.length} extracted items`);

    const learningPatterns: LearningPattern[] = [];
    const questionGroups: QuestionGroup[] = [];

    // Extract and analyze questions
    const allQuestions = data.map(item => item.question);
    const questionPatterns = await this.analyzeQuestionPatterns(allQuestions);
    learningPatterns.push(...questionPatterns);

    // Extract and analyze answers
    const allAnswers = data.map(item => item.answer);
    const answerPatterns = await this.analyzeAnswerPatterns(allAnswers);
    learningPatterns.push(...answerPatterns);

    // Group similar questions
    const groups = await this.groupSimilarQuestions(allQuestions);
    questionGroups.push(...groups);

    // Convert LearningPattern[] to PatternMatch[]
    const patterns: PatternMatch[] = learningPatterns.map(lp => ({
      pattern: lp.pattern,
      type: lp.type,
      confidence: lp.confidence,
      frequency: lp.frequency,
      sources: [],
      keywords: lp.keywords || [],
      category: lp.category,
    }));

    return {
      patterns,
      groups: questionGroups,
      totalAnalyzed: data.length,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Extract questions from text
   */
  async extractQuestions(text: string): Promise<string[]> {
    if (!text) return [];

    const sentences = this.splitIntoSentences(text);
    const questions: string[] = [];

    for (const sentence of sentences) {
      if (this.isQuestion(sentence)) {
        questions.push(sentence.trim());
      }
    }

    return questions;
  }

  /**
   * Extract answers from text with context
   */
  async extractAnswers(text: string, context: string): Promise<string[]> {
    if (!text) return [];

    const sentences = this.splitIntoSentences(text);
    const answers: string[] = [];

    for (const sentence of sentences) {
      if (this.isAnswer(sentence, context)) {
        answers.push(sentence.trim());
      }
    }

    return answers;
  }

  /**
   * Extract keywords from text using advanced NLP techniques
   */
  async extractKeywords(text: string): Promise<string[]> {
    if (!text) return [];

    // Normalize text
    const normalizedText = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split into words
    const words = normalizedText.split(' ');

    // Filter stop words and short words
    const stopWords = this.getStopWords();
    const filteredWords = words.filter(word =>
      word.length > 2 &&
      !stopWords.has(word) &&
      !/^\d+$/.test(word)
    );

    // Calculate TF-IDF-like scores
    const wordFreq = new Map<string, number>();
    filteredWords.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Extract n-grams (2-grams and 3-grams)
    const ngrams = this.extractNGrams(filteredWords, 2, 3);

    // Combine single words and n-grams
    const allTerms = [...Array.from(wordFreq.keys()), ...ngrams];

    // Score and rank terms
    const scoredTerms = allTerms.map(term => ({
      term,
      score: this.calculateTermScore(term, text, wordFreq)
    }));

    // Return top keywords
    return scoredTerms
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(item => item.term);
  }

  /**
   * Find similar patterns in database
   */
  async findSimilarPatterns(pattern: string, tenantId: string, threshold: number = 0.7): Promise<PatternMatch[]> {
    const allPatterns = await this.patternRepository.find({
      where: { tenantId }
    });
    const similarPatterns: Array<{ pattern: LearningPattern; similarity: number }> = [];

    for (const existingPattern of allPatterns) {
      const similarity = await this.calculateSimilarityScore(pattern, existingPattern.pattern);
      if (similarity >= threshold) {
        similarPatterns.push({ pattern: existingPattern, similarity });
      }
    }

    return similarPatterns
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => ({
        pattern: item.pattern.pattern,
        type: item.pattern.type,
        confidence: item.similarity,
        frequency: item.pattern.frequency,
        sources: [],
        keywords: item.pattern.keywords || [],
        category: item.pattern.category,
      }));
  }

  /**
   * Group similar questions together
   */
  async groupSimilarQuestions(questions: string[]): Promise<QuestionGroup[]> {
    if (questions.length === 0) return [];

    const groups: QuestionGroup[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < questions.length; i++) {
      if (processed.has(i)) continue;

      const currentQuestion = questions[i];
      const similarQuestions = [currentQuestion];
      const keywords = await this.extractKeywords(currentQuestion);

      // Find similar questions
      for (let j = i + 1; j < questions.length; j++) {
        if (processed.has(j)) continue;

        const similarity = await this.calculateSimilarityScore(currentQuestion, questions[j]);
        if (similarity >= 0.7) {
          similarQuestions.push(questions[j]);
          processed.add(j);
        }
      }

      if (similarQuestions.length > 1) {
        const commonKeywords = await this.findCommonKeywords(similarQuestions);
        const group: QuestionGroup = {
          id: crypto.randomUUID(),
          representativeQuestion: this.selectRepresentativeQuestion(similarQuestions),
          questions: similarQuestions,
          commonPattern: commonKeywords.join(' '),
          confidence: 75, // Default confidence
          frequency: similarQuestions.length,
          category: this.inferCategory(similarQuestions),
        };

        groups.push(group);
      }

      processed.add(i);
    }

    return groups.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Calculate pattern confidence based on various factors
   */
  async calculatePatternConfidence(pattern: LearningPattern): Promise<number> {
    let confidence = 50; // Base confidence

    // Factor 1: Frequency
    if (pattern.frequency >= 5) confidence += 20;
    else if (pattern.frequency >= 3) confidence += 10;
    else if (pattern.frequency === 1) confidence -= 10;

    // Factor 2: Source diversity
    const uniqueSources = new Set(pattern.sources.map(s => s.id)).size;
    if (uniqueSources >= 3) confidence += 15;
    else if (uniqueSources >= 2) confidence += 10;

    // Factor 3: Average source relevance
    const avgRelevance = pattern.averageSourceRelevance;
    confidence += Math.round((avgRelevance - 0.5) * 20);

    // Factor 4: Pattern quality
    const patternLength = pattern.pattern.length;
    if (patternLength >= 20 && patternLength <= 200) confidence += 10;
    else if (patternLength < 10) confidence -= 15;

    // Factor 5: Keywords richness
    if (pattern.keywords.length >= 3) confidence += 5;

    // Factor 6: Category assignment
    if (pattern.category && pattern.category !== 'general') confidence += 5;

    return Math.max(1, Math.min(100, confidence));
  }

  /**
   * Calculate similarity score between two texts
   */
  async calculateSimilarityScore(text1: string, text2: string): Promise<number> {
    if (!text1 || !text2) return 0;

    // Normalize texts
    const norm1 = this.normalizeText(text1);
    const norm2 = this.normalizeText(text2);

    // Calculate different similarity metrics
    const jaccardSim = this.calculateJaccardSimilarity(norm1, norm2);
    const cosineSim = this.calculateCosineSimilarity(norm1, norm2);
    const levenshteinSim = this.calculateLevenshteinSimilarity(norm1, norm2);

    // Weighted combination
    return (jaccardSim * 0.4 + cosineSim * 0.4 + levenshteinSim * 0.2);
  }

  /**
   * Identify question-answer pairs from conversation
   */
  async identifyQuestionAnswerPairs(messages: Array<{
    content: string;
    type: 'user' | 'bot' | 'agent';
    timestamp: Date;
  }>): Promise<Array<{
    question: string;
    answer: string;
    confidence: number;
  }>> {
    const pairs: Array<{ question: string; answer: string; confidence: number }> = [];

    for (let i = 0; i < messages.length - 1; i++) {
      const currentMsg = messages[i];
      const nextMsg = messages[i + 1];

      // Look for user question followed by bot/agent answer
      if (currentMsg.type === 'user' &&
        (nextMsg.type === 'bot' || nextMsg.type === 'agent') &&
        this.isQuestion(currentMsg.content) &&
        this.isAnswer(nextMsg.content)) {

        const confidence = await this.calculatePairConfidence(currentMsg.content, nextMsg.content);

        pairs.push({
          question: currentMsg.content,
          answer: nextMsg.content,
          confidence,
        });
      }
    }

    return pairs;
  }

  // Private helper methods

  private async analyzeQuestionPatterns(questions: string[]): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    const questionFreq = new Map<string, number>();

    // Count question patterns
    for (const question of questions) {
      const normalized = this.normalizeText(question);
      const hash = this.generateHash(normalized);

      let existingPattern = patterns.find(p => p.patternHash === hash);
      if (existingPattern) {
        existingPattern.incrementFrequency();
      } else {
        const pattern = new LearningPattern();
        pattern.patternType = PatternType.QUESTION;
        pattern.pattern = normalized;
        pattern.patternHash = hash;
        pattern.frequency = 1;
        pattern.keywords = await this.extractKeywords(question);
        pattern.category = this.inferCategory([question]);

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  private async analyzeAnswerPatterns(answers: string[]): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];

    for (const answer of answers) {
      const normalized = this.normalizeText(answer);
      const hash = this.generateHash(normalized);

      let existingPattern = patterns.find(p => p.patternHash === hash);
      if (existingPattern) {
        existingPattern.incrementFrequency();
      } else {
        const pattern = new LearningPattern();
        pattern.patternType = PatternType.ANSWER;
        pattern.pattern = normalized;
        pattern.patternHash = hash;
        pattern.frequency = 1;
        pattern.keywords = await this.extractKeywords(answer);

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  private async findDuplicates(questions: string[]): Promise<Array<{
    original: string;
    duplicates: string[];
    similarity: number;
  }>> {
    const duplicates: Array<{ original: string; duplicates: string[]; similarity: number }> = [];
    const processed = new Set<number>();

    for (let i = 0; i < questions.length; i++) {
      if (processed.has(i)) continue;

      const original = questions[i];
      const duplicateList: string[] = [];

      for (let j = i + 1; j < questions.length; j++) {
        if (processed.has(j)) continue;

        const similarity = await this.calculateSimilarityScore(original, questions[j]);
        if (similarity >= 0.9) {
          duplicateList.push(questions[j]);
          processed.add(j);
        }
      }

      if (duplicateList.length > 0) {
        duplicates.push({
          original,
          duplicates: duplicateList,
          similarity: 0.9, // Minimum similarity threshold
        });
      }

      processed.add(i);
    }

    return duplicates;
  }

  private calculateStatistics(patterns: LearningPattern[]): any {
    const totalPatterns = patterns.length;
    const highConfidencePatterns = patterns.filter(p => p.confidence >= 80).length;
    const averageFrequency = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length
      : 0;

    // Count categories
    const categoryCount = new Map<string, number>();
    patterns.forEach(p => {
      if (p.category) {
        categoryCount.set(p.category, (categoryCount.get(p.category) || 0) + 1);
      }
    });

    const topCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    return {
      totalPatterns,
      highConfidencePatterns,
      averageFrequency: Math.round(averageFrequency * 100) / 100,
      topCategories,
    };
  }

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private isQuestion(text: string): boolean {
    if (!text || text.length < 5) return false;

    const lowerText = text.toLowerCase().trim();

    // Question patterns
    const questionPatterns = [
      /\?$/,
      /^(how|what|when|where|why|who|which|can|could|would|should|is|are|do|does|did)\s/,
      /(help|problem|issue|trouble|error)/,
    ];

    return questionPatterns.some(pattern => pattern.test(lowerText));
  }

  private isAnswer(text: string, context?: string): boolean {
    if (!text || text.length < 10) return false;

    const lowerText = text.toLowerCase();

    // Answer patterns
    const answerPatterns = [
      /(you can|try|here's how|to do this|follow these|solution|resolve)/,
      /(step|first|then|next|finally)/,
      /(should|will|need to|have to)/,
    ];

    return answerPatterns.some(pattern => pattern.test(lowerText));
  }

  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
  }

  private getStopWords(): Set<string> {
    return new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
  }

  private extractNGrams(words: string[], ...ngramSizes: number[]): string[] {
    const ngrams: string[] = [];

    for (const n of ngramSizes) {
      for (let i = 0; i <= words.length - n; i++) {
        const ngram = words.slice(i, i + n).join(' ');
        if (ngram.length > 5) { // Only meaningful n-grams
          ngrams.push(ngram);
        }
      }
    }

    return ngrams;
  }

  private calculateTermScore(term: string, text: string, wordFreq: Map<string, number>): number {
    const termFreq = wordFreq.get(term) || 0;
    const textLength = text.split(' ').length;

    // Simple TF score with length bonus
    let score = termFreq / textLength;

    // Bonus for longer terms (likely more specific)
    if (term.includes(' ')) {
      score *= 1.5;
    }

    return score;
  }

  private selectRepresentativeQuestion(questions: string[]): string {
    // Select the shortest clear question as representative
    return questions.reduce((shortest, current) =>
      current.length < shortest.length ? current : shortest
    );
  }

  private async findCommonKeywords(questions: string[]): Promise<string[]> {
    const allKeywords = new Map<string, number>();

    for (const question of questions) {
      const keywords = await this.extractKeywords(question);
      keywords.forEach(keyword => {
        allKeywords.set(keyword, (allKeywords.get(keyword) || 0) + 1);
      });
    }

    // Return keywords that appear in multiple questions
    return Array.from(allKeywords.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  private inferCategory(questions: string[]): string {
    const combinedText = questions.join(' ').toLowerCase();

    const categories = {
      'authentication': ['password', 'login', 'sign in', 'account', 'username'],
      'billing': ['payment', 'invoice', 'billing', 'subscription', 'price'],
      'technical': ['error', 'bug', 'not working', 'broken', 'issue'],
      'account': ['profile', 'settings', 'preferences', 'update'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private calculateJaccardSimilarity(text1: string, text2: string): number {
    const set1 = new Set(text1.split(' '));
    const set2 = new Set(text2.split(' '));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private calculateCosineSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');

    const allWords = [...new Set([...words1, ...words2])];

    const vector1 = allWords.map(word => words1.filter(w => w === word).length);
    const vector2 = allWords.map(word => words2.filter(w => w === word).length);

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }

  private calculateLevenshteinSimilarity(text1: string, text2: string): number {
    const distance = this.levenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    return maxLength > 0 ? 1 - (distance / maxLength) : 1;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private async calculatePairConfidence(question: string, answer: string): Promise<number> {
    let confidence = 50;

    // Question quality
    if (this.isQuestion(question)) confidence += 20;

    // Answer quality
    if (this.isAnswer(answer)) confidence += 20;

    // Length appropriateness
    if (question.length >= 10 && question.length <= 200) confidence += 5;
    if (answer.length >= 20 && answer.length <= 1000) confidence += 5;

    return Math.max(1, Math.min(100, confidence));
  }

  /**
   * Calculate similarity between two texts (required by interface)
   */
  calculateSimilarity(text1: string, text2: string): number {
    const normalized1 = this.normalizeText(text1);
    const normalized2 = this.normalizeText(text2);

    // Use Levenshtein similarity
    return this.calculateLevenshteinSimilarity(normalized1, normalized2);
  }
}