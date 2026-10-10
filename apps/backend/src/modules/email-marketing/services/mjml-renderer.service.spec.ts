import { Test, TestingModule } from '@nestjs/testing';
import { MjmlRendererService } from './mjml-renderer.service';

describe('MjmlRendererService', () => {
    let service: MjmlRendererService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [MjmlRendererService],
        }).compile();

        service = module.get<MjmlRendererService>(MjmlRendererService);
    });

    describe('renderEmail', () => {
        it('should render MJML structure to HTML', async () => {
            const structure = {
                rows: [
                    {
                        type: 'section',
                        columns: [
                            {
                                blocks: [
                                    {
                                        type: 'text',
                                        properties: { content: 'Hello World' },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const result = await service.renderEmail(structure);

            expect(result).toHaveProperty('html');
            expect(result).toHaveProperty('mjml');
            expect(result.html).toContain('Hello World');
        });

        it('should handle image blocks', async () => {
            const structure = {
                rows: [
                    {
                        type: 'section',
                        columns: [
                            {
                                blocks: [
                                    {
                                        type: 'image',
                                        properties: {
                                            src: 'https://example.com/image.jpg',
                                            alt: 'Test Image',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const result = await service.renderEmail(structure);

            expect(result.html).toContain('https://example.com/image.jpg');
            expect(result.html).toContain('Test Image');
        });

        it('should handle button blocks', async () => {
            const structure = {
                rows: [
                    {
                        type: 'section',
                        columns: [
                            {
                                blocks: [
                                    {
                                        type: 'button',
                                        properties: {
                                            text: 'Click Me',
                                            href: 'https://example.com',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const result = await service.renderEmail(structure);

            expect(result.html).toContain('Click Me');
            expect(result.html).toContain('https://example.com');
        });

        it('should apply custom styles', async () => {
            const structure = {
                rows: [
                    {
                        type: 'section',
                        columns: [
                            {
                                blocks: [
                                    {
                                        type: 'text',
                                        properties: { content: 'Styled Text' },
                                        styles: {
                                            color: '#FF0000',
                                            fontSize: '20px',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const result = await service.renderEmail(structure);

            expect(result.mjml).toContain('color="#FF0000"');
            expect(result.mjml).toContain('font-size="20px"');
        });

        it('should handle multiple columns', async () => {
            const structure = {
                rows: [
                    {
                        type: 'section',
                        columns: [
                            {
                                blocks: [{ type: 'text', properties: { content: 'Column 1' } }],
                            },
                            {
                                blocks: [{ type: 'text', properties: { content: 'Column 2' } }],
                            },
                        ],
                    },
                ],
            };

            const result = await service.renderEmail(structure);

            expect(result.html).toContain('Column 1');
            expect(result.html).toContain('Column 2');
        });

        it('should throw error for invalid MJML', async () => {
            const invalidStructure = {
                rows: [{ type: 'invalid-type' }],
            };

            await expect(service.renderEmail(invalidStructure)).rejects.toThrow();
        });
    });

    describe('validateMJML', () => {
        it('should validate correct MJML', () => {
            const mjml = '<mjml><mj-body><mj-text>Hello</mj-text></mj-body></mjml>';

            const result = service.validateMJML(mjml);

            expect(result.isValid).toBe(true);
        });

        it('should reject invalid MJML', () => {
            const mjml = '<mjml><invalid-tag></invalid-tag></mjml>';

            const result = service.validateMJML(mjml);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});
