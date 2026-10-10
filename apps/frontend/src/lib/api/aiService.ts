import { httpClient } from './http-client';

// AI Email Generation Types
export interface GenerateEmailSubjectDto {
  campaignName: string;
  product?: string;
  targetAudience?: string;
  tone?: string;
  keywords?: string[];
}

export interface GenerateEmailBodyDto {
  campaignName: string;
  product?: string;
  targetAudience?: string;
  tone?: string;
  keywords?: string[];
  subject?: string;
}

export interface GenerateEmailBothDto {
  campaignName: string;
  product?: string;
  targetAudience?: string;
  tone?: string;
  keywords?: string[];
}

export interface GeneratedEmailSubject {
  subject: string;
  alternatives: string[];
}

export interface GeneratedEmailBody {
  bodyHtml: string;
  bodyText: string;
}

export interface GeneratedEmailBoth {
  subject: string;
  subjectAlternatives: string[];
  bodyHtml: string;
  bodyText: string;
}

class AiService {
  /**
   * Generate email subject using AI
   */
  async generateEmailSubject(data: GenerateEmailSubjectDto): Promise<GeneratedEmailSubject> {
    return httpClient.postWrapped<GeneratedEmailSubject>('/ai/email/subject', data);
  }

  /**
   * Generate email body using AI
   */
  async generateEmailBody(data: GenerateEmailBodyDto): Promise<GeneratedEmailBody> {
    return httpClient.postWrapped<GeneratedEmailBody>('/ai/email/body', data);
  }

  /**
   * Generate both subject and body using AI
   */
  async generateEmailBoth(data: GenerateEmailBothDto): Promise<GeneratedEmailBoth> {
    return httpClient.postWrapped<GeneratedEmailBoth>('/ai/email/both', data);
  }
}

export const aiService = new AiService();
export default aiService;
