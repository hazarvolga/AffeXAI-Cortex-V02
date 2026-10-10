export interface ExtractedData {
  id: string;
  sourceId: string;
  source: 'chat' | 'ticket';
  question: string;
  answer: string;
  context?: string;
  confidence: number;
  keywords: string[];
  category: string;
  extractedAt: Date;
  sessionDuration?: number;
  satisfactionScore?: number;
  metadata: {
    timestamp: Date;
    userId?: string;
    sessionDuration?: number;
    resolutionTime?: number;
    satisfactionScore?: number;
    category?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface ExtractionCriteria {
  minSessionDuration?: number;
  minResolutionTime?: number;
  requiredSatisfactionScore?: number;
  excludedCategories?: string[];
  includeCategories?: string[];
  maxAge?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  maxResults?: number;
  tenantId?: string;
  sourceIds?: string[];
}

export interface DataExtractor {
  extract(criteria: ExtractionCriteria): Promise<ExtractedData[]>;
  validateData(data: ExtractedData): boolean;
}

export interface NormalizedData {
  question: string;
  answer: string;
  confidence: number;
  category?: string;
  keywords: string[];
  source: 'chat' | 'ticket';
  sourceId: string;
  metadata: {
    originalQuestion?: string;
    originalAnswer?: string;
    processingSteps?: string[];
    qualityScore?: number;
    [key: string]: any;
  };
}

export interface DataNormalizer {
  normalize(data: ExtractedData): Promise<NormalizedData>;
  cleanText(text: string): string;
  extractKeywords(text: string): string[];
  calculateConfidence(data: ExtractedData): number;
}