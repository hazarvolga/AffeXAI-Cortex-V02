import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { NeuralGridService } from '../src/modules/neural-grid/services/neural-grid.service';
import { NeuralSignal } from '../src/modules/neural-grid/interfaces/neural-signal.interface';

/**
 * NeuralGridService unit tests: reward ledger aggregation on
 * neural.signal, non-blocking Cortex forwarding and admin reward views.
 */
describe('NeuralGridService', () => {
    let service: NeuralGridService;

    const mockHttp = { post: jest.fn(), get: jest.fn() };
    const mockConfig = { get: jest.fn().mockReturnValue('http://cortex:8000') };

    const signal = (overrides: Partial<NeuralSignal> = {}): NeuralSignal => ({
        tenantId: 'acme',
        source: 'forms',
        type: 'form.submitted',
        successScore: 2,
        ...overrides,
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NeuralGridService,
                { provide: HttpService, useValue: mockHttp },
                { provide: ConfigService, useValue: mockConfig },
            ],
        }).compile();

        service = module.get(NeuralGridService);
        jest.clearAllMocks();
        mockConfig.get.mockReturnValue('http://cortex:8000');
        mockHttp.post.mockReturnValue(of({ data: { accepted: true } }));
    });

    it('updates the tenant reward ledger when a signal carries a successScore', async () => {
        await service.handleNeuralSignal(signal({ successScore: 2 }));
        await service.handleNeuralSignal(signal({ successScore: -1 }));

        const snapshot = service.getRewardSnapshot('acme');
        expect(snapshot.totalReward).toBe(1);
        expect(snapshot.signalCount).toBe(2);
        expect(snapshot.lastSignalAt).toBeInstanceOf(Date);
    });

    it('forwards the signal to Cortex /signals/ingest', async () => {
        await service.handleNeuralSignal(signal());

        expect(mockHttp.post).toHaveBeenCalledWith(
            'http://cortex:8000/signals/ingest',
            expect.objectContaining({
                tenantId: 'acme',
                source: 'forms',
                type: 'form.submitted',
                data: expect.objectContaining({ successScore: 2 }),
            }),
        );
    });

    it('treats a Cortex outage as non-blocking: no throw, ledger still updated', async () => {
        mockHttp.post.mockReturnValue(throwError(() => new Error('cortex down')));

        await expect(service.handleNeuralSignal(signal({ successScore: 5 }))).resolves.toBeUndefined();

        expect(service.getRewardSnapshot('acme').totalReward).toBe(5);
    });

    it('ignores signals without a successScore for the ledger', async () => {
        await service.handleNeuralSignal(signal({ successScore: undefined }));
        expect(service.getRewardSnapshot('acme')).toEqual(
            expect.objectContaining({ totalReward: 0, signalCount: 0 }),
        );
    });

    it('rounds accumulated rewards to two decimals (floating point safety)', async () => {
        await service.handleNeuralSignal(signal({ successScore: 0.1 }));
        await service.handleNeuralSignal(signal({ successScore: 0.2 }));
        expect(service.getRewardSnapshot('acme').totalReward).toBe(0.3);
    });

    it('falls back to the "default" ledger key for tenant-less signals', async () => {
        await service.handleNeuralSignal(signal({ tenantId: undefined as any }));
        expect(service.getRewardSnapshot(undefined as any).totalReward).toBe(2);
        expect(service.getRewardSnapshot('default').signalCount).toBe(1);
    });

    it('getAllRewards returns one entry per rewarded tenant', async () => {
        await service.handleNeuralSignal(signal({ tenantId: 'acme', successScore: 3 }));
        await service.handleNeuralSignal(signal({ tenantId: 'globex', successScore: -2 }));

        const all = service.getAllRewards();
        expect(all).toHaveLength(2);
        expect(all.map(r => r.tenantId).sort()).toEqual(['acme', 'globex']);
        expect(all.find(r => r.tenantId === 'globex').totalReward).toBe(-2);
    });

    it('returns an empty snapshot for an unknown tenant', () => {
        expect(service.getRewardSnapshot('unknown')).toEqual(
            expect.objectContaining({ totalReward: 0, signalCount: 0 }),
        );
        expect(service.getAllRewards()).toEqual([]);
    });
});
