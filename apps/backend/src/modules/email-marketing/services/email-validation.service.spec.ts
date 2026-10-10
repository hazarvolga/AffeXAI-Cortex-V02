import { Test, TestingModule } from '@nestjs/testing';
import { EmailValidationService } from './email-validation.service';

describe('EmailValidationService', () => {
    let service: EmailValidationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EmailValidationService],
        }).compile();

        service = module.get<EmailValidationService>(EmailValidationService);
    });

    describe('validateEmail', () => {
        it('should validate a valid email', async () => {
            const result = await service.validateEmail('test@example.com');

            expect(result).toHaveProperty('isValid');
            expect(result.isValid).toBe(true);
        });

        it('should reject invalid email format', async () => {
            const result = await service.validateEmail('invalid-email');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid email format');
        });

        it('should reject email without @ symbol', async () => {
            const result = await service.validateEmail('testexample.com');

            expect(result.isValid).toBe(false);
        });

        it('should reject email without domain', async () => {
            const result = await service.validateEmail('test@');

            expect(result.isValid).toBe(false);
        });

        it('should accept email with subdomain', async () => {
            const result = await service.validateEmail('test@mail.example.com');

            expect(result.isValid).toBe(true);
        });

        it('should accept email with plus addressing', async () => {
            const result = await service.validateEmail('test+tag@example.com');

            expect(result.isValid).toBe(true);
        });

        it('should reject disposable email domains', async () => {
            const result = await service.validateEmail('test@tempmail.com');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Disposable email domain');
        });
    });

    describe('checkDomain', () => {
        it('should validate domain with MX records', async () => {
            const result = await service.checkDomain('example.com');

            expect(result).toHaveProperty('hasMX');
        });

        it('should detect invalid domain', async () => {
            const result = await service.checkDomain('invalid-domain-12345.com');

            expect(result.hasMX).toBe(false);
        });
    });

    describe('checkSyntax', () => {
        it('should validate email syntax', () => {
            const result = service.checkSyntax('test@example.com');

            expect(result).toBe(true);
        });

        it('should reject invalid syntax', () => {
            const result = service.checkSyntax('test@');

            expect(result).toBe(false);
        });
    });
});
