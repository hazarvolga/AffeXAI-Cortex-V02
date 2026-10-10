import { InsightEngineService } from './insight-engine.service';
import { NeuralSignal } from '../../neural-grid/interfaces/neural-signal.interface';

describe('insight tenant correlation', () => {
  const strategy = { getInsight: jest.fn() };
  const emitter = { emit: jest.fn() };
  let service: InsightEngineService;
  const add = (tenantId: string, source: NeuralSignal['source'], context: string) => service.handleSignalForAnalysis({ tenantId, source, type: 'test', successScore: 7, context });
  beforeEach(() => { jest.resetAllMocks(); strategy.getInsight.mockResolvedValue({ insight: 'Tenant-specific recommendation' }); service = new InsightEngineService(strategy as any, emitter as any); });
  it('does not correlate one tenant external signal with another tenant internal signal', async () => {
    add('a', 'crawler', 'A external'); add('b', 'tickets', 'B private');
    await service.performCorrelationAnalysis();
    expect(strategy.getInsight).not.toHaveBeenCalled(); expect(emitter.emit).not.toHaveBeenCalled();
  });
  it('manual analysis selects only its authenticated tenant and preserves other tenants', async () => {
    add('a', 'crawler', 'A external'); add('a', 'tickets', 'A private'); add('b', 'crawler', 'B external'); add('b', 'tickets', 'B private');
    await service.triggerManualAnalysis('a');
    expect(strategy.getInsight).toHaveBeenCalledTimes(1);
    const args = strategy.getInsight.mock.calls[0]; expect(args[0]).toBe('a'); expect(JSON.stringify(args)).not.toContain('B private');
    expect(emitter.emit).toHaveBeenCalledWith('neural.signal', expect.objectContaining({ tenantId: 'a', type: 'AUTONOMOUS_REPORT' }));
    await service.triggerManualAnalysis('b'); expect(strategy.getInsight.mock.calls[1][0]).toBe('b');
  });
  it('retains failed tenant data and reports failure to manual callers', async () => {
    add('a', 'crawler', 'A external'); add('a', 'tickets', 'A private'); strategy.getInsight.mockRejectedValueOnce(new Error('Provider failed'));
    await expect(service.triggerManualAnalysis('a')).rejects.toThrow();
    expect(emitter.emit).not.toHaveBeenCalled();
    await service.triggerManualAnalysis('a'); expect(emitter.emit).toHaveBeenCalledTimes(1);
  });
  it('does not duplicate overlapping analysis or erase signals arriving during a request', async () => {
    add('a', 'crawler', 'old external'); add('a', 'tickets', 'old internal');
    let finish: (value: unknown) => void;
    strategy.getInsight.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const pending = service.triggerManualAnalysis('a');
    await service.triggerManualAnalysis('a'); expect(strategy.getInsight).toHaveBeenCalledTimes(1);
    add('a', 'crawler', 'new external'); add('a', 'tickets', 'new internal');
    finish!({ insight: 'Finished' }); await pending;
    await service.triggerManualAnalysis('a'); expect(strategy.getInsight).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(strategy.getInsight.mock.calls[1])).toContain('new internal');
  });
});
