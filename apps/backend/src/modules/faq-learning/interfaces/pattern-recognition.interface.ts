import { PatternType } from '../entities/learning-pattern.entity';
import { ExtractedData } from './data-extraction.interface';

export interface PatternMatch {
  pattern: string;
  type: PatternType;
  confidence: number;
  frequency: number;
  sources: Array<{
    type: 'chat' | 'ticket';
    id: string;
    relevance: number;
  }>;
  keywords: string[];
  category?: string;
}

export interface PatternRecognitionConfig {
  minFrequency: number;
  minConfidence: number;
  similarityThreshold: number;
  maxPatterns: number;
  enableClustering: boolean;
  clusteringThreshold: number;
}

export interface PatternRecognizer {
  identifyPatterns(data: Array<{
    text: string;
    type: PatternType;
    sourceId: string;
    sourceType: 'chat' | 'ticket';
  }>): Promise<PatternMatch[]>;

  findSimilarPatterns(pattern: string, threshold: number): Promise<PatternMatch[]>;

  calculateSimilarity(text1: string, text2: string): number;

  clusterPatterns(patterns: PatternMatch[]): Promise<PatternMatch[][]>;
}

export interface BatchProcessingJob {
  id: string;
  type: 'pattern_recognition' | 'data_extraction' | 'faq_generation';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata: {
    totalItems?: number;
    processedItems?: number;
    criteria?: any;
    results?: any;
  };
}

export interface BatchProcessor {
  processDataExtraction(criteria: any): Promise<BatchProcessingJob>;
  processPatternRecognition(dataIds: string[]): Promise<BatchProcessingJob>;
  processFaqGeneration(patternIds: string[]): Promise<BatchProcessingJob>;
  getJobStatus(jobId: string): Promise<BatchProcessingJob>;
  cancelJob(jobId: string): Promise<boolean>;
}

export interface QuestionGroup {
  id?: string;
  questions: string[];
  commonPattern: string;
  representativeQuestion?: string;
  confidence: number;
  frequency?: number;
  category?: string;
}

export interface SimilarityResult {
  text1: string;
  text2: string;
  similarity: number;
  isMatch: boolean;
}

export interface PatternAnalysisResult {
  patterns: PatternMatch[];
  groups: QuestionGroup[];
  totalAnalyzed: number;
  processingTime: number;
}

export interface IPatternRecognitionService {
  identifyPatterns(data: ExtractedData[], tenantId: string): Promise<PatternMatch[]>;
  findSimilarPatterns(pattern: string, tenantId: string, threshold: number): Promise<PatternMatch[]>;
  calculateSimilarity(text1: string, text2: string): number;
  analyzePatterns(data: ExtractedData[], tenantId: string): Promise<PatternAnalysisResult>;
}
