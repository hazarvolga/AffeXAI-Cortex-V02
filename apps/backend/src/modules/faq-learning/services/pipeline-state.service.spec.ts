import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { PipelineStateService } from "./pipeline-state.service";
import {
  PipelineState,
  PipelineStatus,
} from "../entities/pipeline-state.entity";

const TENANT = "acme";

describe("PipelineStateService", () => {
  let service: PipelineStateService;

  const baseState = () =>
    ({
      id: "state-1",
      tenantId: TENANT,
      status: PipelineStatus.STOPPED,
      dailyProcessingCount: 0,
      totalFaqsGenerated: 0,
      processingConfig: {
        mode: "manual",
        batchSize: 50,
        scheduleInterval: 3600,
      },
      updatedAt: new Date(),
    }) as PipelineState;

  const repository = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineStateService,
        { provide: getRepositoryToken(PipelineState), useValue: repository },
      ],
    }).compile();
    service = module.get(PipelineStateService);
  });

  describe("getState", () => {
    it("returns the tenant's latest state", async () => {
      const state = baseState();
      repository.findOne.mockResolvedValue(state);

      await expect(service.getState(TENANT)).resolves.toBe(state);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenantId: TENANT },
        order: { createdAt: "DESC" },
      });
    });

    it("creates a stopped, manual state for a tenant that has none", async () => {
      repository.findOne.mockResolvedValue(null);

      const state = await service.getState(TENANT);

      expect(state).toMatchObject({
        tenantId: TENANT,
        status: PipelineStatus.STOPPED,
        dailyProcessingCount: 0,
        processingConfig: { mode: "manual" },
      });
      expect(repository.save).toHaveBeenCalledWith(state);
    });
  });

  describe("updateStatus", () => {
    it("sets the status and records the run time when started", async () => {
      repository.findOne.mockResolvedValue(baseState());

      const state = await service.updateStatus(PipelineStatus.RUNNING, TENANT);

      expect(state.status).toBe(PipelineStatus.RUNNING);
      expect(state.lastRun).toBeInstanceOf(Date);
    });

    it("records error details", async () => {
      repository.findOne.mockResolvedValue(baseState());

      await service.markError(TENANT, { message: "Test Error" });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PipelineStatus.ERROR,
          lastError: expect.objectContaining({ message: "Test Error" }),
        }),
      );
    });
  });

  describe("start/stop", () => {
    it("starts and stops the pipeline for the given tenant", async () => {
      const spy = jest
        .spyOn(service, "updateStatus")
        .mockResolvedValue(baseState());

      await service.start(TENANT);
      await service.stop(TENANT);

      expect(spy).toHaveBeenNthCalledWith(1, PipelineStatus.RUNNING, TENANT);
      expect(spy).toHaveBeenNthCalledWith(2, PipelineStatus.STOPPED, TENANT);
    });
  });

  describe("counters", () => {
    it("increments and resets the daily count", async () => {
      repository.findOne.mockResolvedValueOnce(baseState());
      await service.incrementDailyCount(TENANT);
      expect(repository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ dailyProcessingCount: 1 }),
      );

      repository.findOne.mockResolvedValueOnce({
        ...baseState(),
        dailyProcessingCount: 10,
      });
      await service.resetDailyCount(TENANT);
      expect(repository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ dailyProcessingCount: 0 }),
      );
    });

    it("adds generated FAQs to the total", async () => {
      repository.findOne.mockResolvedValue({
        ...baseState(),
        totalFaqsGenerated: 4,
      });

      await service.incrementTotalFaqs(TENANT, 3);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ totalFaqsGenerated: 7 }),
      );
    });
  });

  it("merges config updates with the stored config", async () => {
    repository.findOne.mockResolvedValue(baseState());

    await service.updateConfig(TENANT, { batchSize: 100 });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        processingConfig: {
          mode: "manual",
          batchSize: 100,
          scheduleInterval: 3600,
        },
      }),
    );
  });

  it("reports whether the pipeline is running", async () => {
    repository.findOne.mockResolvedValue({
      ...baseState(),
      status: PipelineStatus.RUNNING,
    });

    await expect(service.isRunning(TENANT)).resolves.toBe(true);
  });
});
