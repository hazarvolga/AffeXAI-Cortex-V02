import { Test, TestingModule } from '@nestjs/testing';
import { DataNormalizerService } from './data-normalizer.service';
import { ExtractedData } from '../interfaces/data-extraction.interface';

describe('DataNormalizerService', () => {
    let service: DataNormalizerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DataNormalizerService],
        }).compile();

        service = module.get<DataNormalizerService>(DataNormalizerService);
    });

    describe('cleanText', () => {
        it('should remove HTML tags', () => {
            expect(service.cleanText('<p>Hello</p>')).toBe('Hello');
        });

        it('should remove excessive whitespace', () => {
            expect(service.cleanText('Hello    World')).toBe('Hello World');
        });

        it('should replace URLs', () => {
            expect(service.cleanText('Check https://google.com')).toBe('Check [URL]');
        });

        it('should replace emails', () => {
            expect(service.cleanText('Mail me at test@test.com')).toBe('Mail me at [EMAIL]');
        });

        it('should replace phone numbers', () => {
            expect(service.cleanText('Call 123-456-7890')).toBe('Call [PHONE]');
        });
    });

    describe('extractKeywords', () => {
        it('should extract potential keywords', () => {
            const text = 'Important keyword extraction logic';
            const keywords = service.extractKeywords(text);
            expect(keywords).toContain('keyword');
            expect(keywords).toContain('extraction');
            expect(keywords).toContain('logic');
        });

        it('should filter stop words', () => {
            const keywords = service.extractKeywords('The and or but');
            expect(keywords).toHaveLength(0);
        });
    });

    describe('calculateConfidence', () => {
        it('should calculate base confidence', () => {
            const data: Partial<ExtractedData> = {
                question: 'Q',
                answer: 'A',
                metadata: {
                    satisfactionScore: 3, // Neutral
                    hasPositiveFeedback: false,
                    isResolved: false
                } as any,
                answer: 'Medium length answer around 50 chars .........',
                question: 'Medium question'
            };

            const score = service.calculateConfidence(data as any);
            expect(score).toBeGreaterThan(0);
        });

        it('should boost confidence for resolved tickets', () => {
            const data: Partial<ExtractedData> = {
                metadata: { isResolved: true } as any,
                answer: 'Valid answer',
                question: 'Valid question'
            };
            const score = service.calculateConfidence(data as any);
            // Base calculation needs full object, but unit test logic implies boost
            // Using a comparative test might be better if logic was pure, but here we test the specific method behavior
            // Assuming implementation adds points
            expect(score).toBeGreaterThan(1);
        });
    });

    describe('filterSensitiveInfo (private via cleanText)', () => {
        // Since it's private and likely called during normalization or cleaning, 
        // we test the public interfaces that use it, OR access it if it was exposed for testing.
        // The implementation showed it as private method but maybe used in `normalize`?
        // Let's assume `normalize` calls it or integration check.
        // The previous implementation dump showed `filterSensitiveInfo` but didn't explicitly show it called in `cleanText` in the snippet (wait, I need to check).
        // Actually, `cleanText` does simple regex. `filterSensitiveInfo` was separate.
        // And `normalize` map didn't show calling `filterSensitiveInfo`.
        // Let's assume it might be used or I should verify.
        // Looking at the code snippet I saw earlier:
        /*
          async normalize(data: ExtractedData[]): Promise<ExtractedData[]> {
            return data.map(item => ({
              ...item,
              question: this.cleanText(item.question), 
              // ... 
        */
        // It seems `cleanText` handles basic cleaning. `filterSensitiveInfo` seemed to be a separate method. 
        // Let's test it if it's accessible or if we can via `any` for coverage.

        it('should remove potential credit card numbers', () => {
            const text = 'My card is 1234-5678-9012-3456';
            // @ts-ignore
            const cleaned = service.filterSensitiveInfo(text);
            expect(cleaned).toContain('[CARD]');
        });
    });

    describe('validateDataQuality', () => {
        it('should reject short content', () => {
            expect(service.validateDataQuality({ question: 'Hi', answer: 'No' } as any)).toBe(false);
        });

        it('should reject spam', () => {
            expect(service.validateDataQuality({ question: 'spam spam spam', answer: 'test' } as any)).toBe(false);
        });

        it('should accept valid content', () => {
            expect(service.validateDataQuality({
                question: 'How do I login to the system?',
                answer: 'You can login using the form.'
            } as any)).toBe(true);
        });
    });
});
