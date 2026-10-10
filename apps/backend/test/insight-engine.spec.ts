import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InsightEngineService } from '../src/modules/insight-engine/services/insight-engine.service';
import { StrategyService } from '../src/modules/strategy/services/strategy.service';
import { NeuralSignal } from '../src/modules/neural-grid/interfaces/neural-signal.interface';

/**
 * InsightEngineService unit tests: signal buffering rules (high-impact
 * only, AUTONOMOUS_REPORT exclusion), correlation analysis and manual
 * trigger bufferSize reporting.
 */
describe('InsightEngineService', () => {
    let service: InsightEngineService;
    const buffer = () => (service as any).signalBuffer as NeuralSignal[];

    const mockStrategy = { getInsight: jest.fn() };
    const mockEmitter = { emit: jest.fn() };

    const sig = (overrides: Partial<NeuralSignal> = {}): NeuralSignal => ({
        tenantId: 'acme',
        source: 'tickets',
        type: 'ticket.created',
        successScore: 2,
        ...overrides,
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InsightEngineService,
                { provide: StrategyService, useValue: mockStrategy },
                { provide: EventEmitter2, useValue: mockEmitter },
            ],
        }).compile();

        service = module.get(InsightEngineService);
        jest.clearAllMocks();
        mockStrategy.getInsight.mockResolvedValue({ insight: 'Market shifted; double down on SEO.' });
    });

    describe('handleSignalForAnalysis (buffering rules)', () => {
        it('buffers crawler signals regardless of score', () => {
            service.handleSignalForAnalysis(sig({ source: 'crawler', successScore: 1, type: 'competitor.update' }));
            expect(buffer()).toHaveLength(1);
        });

        it('buffers internal signals only when |successScore| >= 5', () => {
            service.handleSignalForAnalysis(sig({ successScore: 5 }));
            service.handleSignalForAnalysis(sig({ successScore: -7, type: 'ticket.escalated' }));
            service.handleSignalForAnalysis(sig({ successScore: 2 }));
            service.handleSignalForAnalysis(sig({ successScore: 0 }));
            expect(buffer()).toHaveLength(2);
        });

        it('never buffers AUTONOMOUS_REPORT signals (circular logic guard)', () => {
            service.handleSignalForAnalysis(sig({
                type: 'AUTONOMOUS_REPORT',
                source: 'system',
            }));
            expect(buffer()).toHaveLength(0);
        });

        it('keeps the buffer capped at 100 entries by dropping the oldest', () => {
            for (let i = 0; i < 105; i++) {
                service.handleSignalForAnalysis(sig({ source: 'crawler', type: `c.${i}` }));
            }
            expect(buffer()).toHaveLength(100);
            expect(buffer()[0].type).toBe('c.5');
        });
    });

    describe('performCorrelationAnalysis', () => {
        it('does nothing with fewer than two buffered signals', async () => {
            buffer().push(sig({ source: 'crawler' }));
            await service.performCorrelationAnalysis();
            expect(mockStrategy.getInsight).not.toHaveBeenCalled();
        });

        it('correlates external vs internal signals, emits AUTONOMOUS_REPORT and clears the buffer', async () => {
            buffer().push(sig({ source: 'crawler', type: 'competitor.update' }));
            buffer().push(sig({ source: 'tickets', successScore: 6 }));

            await service.performCorrelationAnalysis();

            expect(mockStrategy.getInsight).toHaveBeenCalledWith(
                'acme',
                expect.stringContaining('Tenant market trends'),
                expect.any(String),
            );
            expect(mockEmitter.emit).toHaveBeenCalledWith('neural.signal', expect.objectContaining({
                tenantId: 'acme',
                source: 'system',
                type: 'AUTONOMOUS_REPORT',
            }));
            expect(buffer()).toHaveLength(0);
        });

        it('keeps the buffer when report generation fails', async () => {
            buffer().push(sig({ source: 'crawler' }));
            buffer().push(sig({ successScore: 9 }));
            mockStrategy.getInsight.mockRejectedValue(new Error('LLM down'));

            await service.performCorrelationAnalysis();

            expect(mockEmitter.emit).not.toHaveBeenCalled();
            expect(buffer()).toHaveLength(2);
        });
    });

    describe('triggerManualAnalysis', () => {
        it('returns the current bufferSize after the run', async () => {
            const result = await service.triggerManualAnalysis('acme');
            expect(result).toEqual({ status: 'insufficient_data', bufferSize: 0 });

            buffer().push(sig({ source: 'crawler' }), sig({ source: 'crawler', type: 'c.2' }));
            const second = await service.triggerManualAnalysis('acme');
            // only external signals: correlation is skipped, buffer retained
            expect(second.bufferSize).toBe(2);
            expect(mockStrategy.getInsight).not.toHaveBeenCalled();
        });
    });
});
