import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipelineState, PipelineStatus } from '../entities/pipeline-state.entity';

@Injectable()
export class PipelineStateService {
  private readonly logger = new Logger(PipelineStateService.name);

  constructor(
    @InjectRepository(PipelineState)
    private readonly pipelineStateRepository: Repository<PipelineState>,
  ) { }

  /**
   * Get or create the pipeline state singleton
   */
  async getState(tenantId: string): Promise<PipelineState> {
    // Find the most recent state for this tenant
    const state = await this.pipelineStateRepository.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    if (!state) {
      // Create initial state
      const newState = this.pipelineStateRepository.create({
        tenantId,
        status: PipelineStatus.STOPPED,
        dailyProcessingCount: 0,
        totalFaqsGenerated: 0,
        processingConfig: {
          mode: 'manual',
          batchSize: 50,
          scheduleInterval: 3600,
        },
      });
      await this.pipelineStateRepository.save(newState);
      this.logger.log(`Created initial pipeline state for tenant ${tenantId}`);
      return newState;
    }

    return state;
  }

  /**
   * Update pipeline status
   */
  async updateStatus(
    status: PipelineStatus,
    tenantId: string,
    error?: { message: string; stack?: string },
  ): Promise<PipelineState> {
    const state = await this.getState(tenantId);

    state.status = status;
    state.updatedAt = new Date();

    if (status === PipelineStatus.RUNNING) {
      state.lastRun = new Date();
    }

    if (error) {
      state.lastError = {
        message: error.message,
        timestamp: new Date(),
        stack: error.stack,
      };
    }

    return await this.pipelineStateRepository.save(state);
  }

  /**
   * Start the pipeline
   */
  async start(tenantId: string): Promise<PipelineState> {
    this.logger.log(`Starting FAQ Learning pipeline for tenant ${tenantId}`);
    return await this.updateStatus(PipelineStatus.RUNNING, tenantId);
  }

  /**
   * Stop the pipeline
   */
  async stop(tenantId: string): Promise<PipelineState> {
    this.logger.log(`Stopping FAQ Learning pipeline for tenant ${tenantId}`);
    return await this.updateStatus(PipelineStatus.STOPPED, tenantId);
  }

  /**
   * Mark pipeline as error
   */
  async markError(tenantId: string, error: { message: string; stack?: string }): Promise<PipelineState> {
    this.logger.error(`Pipeline encountered error for tenant ${tenantId}:`, error.message);
    return await this.updateStatus(PipelineStatus.ERROR, tenantId, error);
  }

  /**
   * Increment daily processing count
   */
  async incrementDailyCount(tenantId: string): Promise<void> {
    const state = await this.getState(tenantId);
    state.dailyProcessingCount += 1;
    await this.pipelineStateRepository.save(state);
  }

  /**
   * Increment total FAQs generated
   */
  async incrementTotalFaqs(tenantId: string, count: number = 1): Promise<void> {
    const state = await this.getState(tenantId);
    state.totalFaqsGenerated += count;
    await this.pipelineStateRepository.save(state);
  }

  /**
   * Reset daily count (called at midnight)
   */
  async resetDailyCount(tenantId: string): Promise<void> {
    const state = await this.getState(tenantId);
    state.dailyProcessingCount = 0;
    await this.pipelineStateRepository.save(state);
  }

  /**
   * Check if pipeline is currently running
   */
  async isRunning(tenantId: string): Promise<boolean> {
    const state = await this.getState(tenantId);
    return state.status === PipelineStatus.RUNNING;
  }

  /**
   * Update processing config
   */
  async updateConfig(tenantId: string, config: {
    mode?: 'manual' | 'real-time' | 'batch' | 'scheduled';
    batchSize?: number;
    scheduleInterval?: number;
  }): Promise<PipelineState> {
    const state = await this.getState(tenantId);
    state.processingConfig = {
      ...state.processingConfig,
      ...config,
    };
    return await this.pipelineStateRepository.save(state);
  }
}
