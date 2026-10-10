import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NeuralSignal } from '../../neural-grid/interfaces/neural-signal.interface';
import { StrategyService } from '../../strategy/services/strategy.service';

@Injectable()
export class InsightEngineService {
  private readonly logger = new Logger(InsightEngineService.name);
  private signalBuffer: NeuralSignal[] = [];
  private analyzing: ReadonlySet<string> = new Set();

  constructor(private readonly strategyService: StrategyService, private readonly eventEmitter: EventEmitter2) {}

  @OnEvent('neural.signal')
  handleSignalForAnalysis(signal: NeuralSignal) {
    if (!signal?.tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(signal.tenantId) || signal.type === 'AUTONOMOUS_REPORT') return;
    if (signal.source !== 'crawler' && !(typeof signal.successScore === 'number' && Math.abs(signal.successScore) >= 5)) return;
    const tenantSignals = [...this.signalBuffer.filter(item => item.tenantId === signal.tenantId), { ...signal, timestamp: signal.timestamp ?? new Date() }].slice(-100);
    this.signalBuffer = [...this.signalBuffer.filter(item => item.tenantId !== signal.tenantId), ...tenantSignals];
  }

  @Cron(CronExpression.EVERY_HOUR)
  async performCorrelationAnalysis() {
    for (const tenantId of new Set(this.signalBuffer.map(signal => signal.tenantId))) {
      try { await this.analyzeTenant(tenantId); }
      catch { this.logger.warn('Tenant correlation failed; buffered signals retained for retry'); }
    }
  }

  private async analyzeTenant(tenantId: string): Promise<string> {
    if (this.analyzing.has(tenantId)) return 'in_progress';
    const snapshot = this.signalBuffer.filter(signal => signal.tenantId === tenantId);
    if (!snapshot.some(signal => signal.source === 'crawler') || !snapshot.some(signal => signal.source !== 'crawler')) return 'insufficient_data';
    this.analyzing = new Set([...this.analyzing, tenantId]);
    try {
      const evidence = snapshot.map(signal => ({ source: signal.source, type: signal.type,
        context: (signal.context ?? signal.content ?? '').slice(0, 500), timestamp: signal.timestamp }));
      const result = await this.strategyService.getInsight(tenantId,
        'Tenant market trends and internal performance correlation', JSON.stringify(evidence).slice(0, 32768));
      if (!result?.insight?.trim()) throw new Error('No analysis result');
      this.eventEmitter.emit('neural.signal', { tenantId, source: 'system', type: 'AUTONOMOUS_REPORT',
        context: result.insight, timestamp: new Date() } satisfies NeuralSignal);
      // Remove only the analyzed snapshot; preserve other tenants and concurrently arriving signals.
      const completed = new Set(snapshot);
      this.signalBuffer = this.signalBuffer.filter(signal => !completed.has(signal));
      return 'completed';
    } finally {
      this.analyzing = new Set([...this.analyzing].filter(id => id !== tenantId));
    }
  }

  async triggerManualAnalysis(tenantId: string) {
    if (!tenantId || !/^[A-Za-z0-9_-]{1,128}$/.test(tenantId)) throw new BadRequestException('Tenant context required');
    const status = await this.analyzeTenant(tenantId);
    return { status, bufferSize: this.signalBuffer.filter(signal => signal.tenantId === tenantId).length };
  }
}
