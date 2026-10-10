import { Test, TestingModule } from '@nestjs/testing';
import { DataPrivacyService } from './data-privacy.service';

describe('DataPrivacyService', () => {
    let service: DataPrivacyService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DataPrivacyService],
        }).compile();

        service = module.get<DataPrivacyService>(DataPrivacyService);
    });

    describe('detectPII', () => {
        it('should detect email addresses', async () => {
            const result = await service.detectPII('Contact me at test@example.com');

            expect(result.hasPII).toBe(true);
            expect(result.detectedTypes).toContain('email');
            expect(result.locations).toHaveLength(1);
        });

        it('should detect phone numbers', async () => {
            const result = await service.detectPII('Call 555-123-4567');

            expect(result.hasPII).toBe(true);
            expect(result.detectedTypes).toContain('phone');
        });

        it('should return no PII for clean text', async () => {
            const result = await service.detectPII('Hello world this is clean text');

            expect(result.hasPII).toBe(false);
            expect(result.confidence).toBe(100);
        });
    });

    describe('anonymizeText', () => {
        it('should redoact PII with default replacement', async () => {
            const result = await service.anonymizeText('Email: user@test.com', { preserveFormat: false });

            expect(result.anonymizedText).toContain('[EMAIL_REDACTED]');
            expect(result.originalText).toBe('Email: user@test.com');
        });

        it('should preserve format if requested', async () => {
            const result = await service.anonymizeText('user@test.com');
            // Default char is *
            expect(result.anonymizedText).toMatch(/\*+@test.com/);
        });
    });

    describe('filterSensitiveData', () => {
        it('should redact sensitive object fields', async () => {
            const data = {
                username: 'user',
                password: 'secretPassword',
                profile: {
                    apiKey: '12345'
                }
            };

            const filtered = await service.filterSensitiveData(data);

            expect(filtered.password).toBe('[REDACTED]');
            // @ts-ignore
            expect(filtered.profile.apiKey).toBe('[REDACTED]');
            expect(filtered.username).toBe('user');
        });

        it('should anonymize strings in data', async () => {
            const data = { bio: 'Contact: test@email.com' };
            const filtered = await service.filterSensitiveData(data);

            // Depending on implementation, it might anonymize strings contained in values
            // outline showed: if (typeof data === 'string') calls anonymizeText
            // But verify if object loop calls it on value strings
            // Outline: else filtered[key] = await this.filterSensitiveData(value);
            // Recursion calls string handler.

            expect(filtered.bio).not.toContain('test@email.com');
        });
    });

    describe('checkGDPRCompliance', () => {
        it('should return issues for non-compliance', async () => {
            const result = await service.checkGDPRCompliance({
                hasUserConsent: false,
                allowsDataDeletion: true,
                hasPrivacyPolicy: true,
                encryptsData: true
            });

            expect(result.isCompliant).toBe(false);
            expect(result.issues).toContain('User consent not obtained for data processing');
        });

        it('should pass if all checks met', async () => {
            const result = await service.checkGDPRCompliance({
                hasUserConsent: true,
                allowsDataDeletion: true,
                hasPrivacyPolicy: true,
                encryptsData: true,
                dataRetentionPeriod: 30
            });

            expect(result.isCompliant).toBe(true);
        });
    });

    describe('validateDataSecurity', () => {
        it('should detect PII in payload', async () => {
            const result = await service.validateDataSecurity({ email: 'test@test.com' });
            expect(result.isSecure).toBe(false);
            expect(result.vulnerabilities[0]).toContain('Contains PII');
        });
    });
});
