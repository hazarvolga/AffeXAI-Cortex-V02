import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { SignalSource } from "./interfaces/signal.interface";
import { CreateSignalDto } from "./dto/signal.dto";
import { BccSignal } from "./entities/bcc-signal.entity";

@Injectable()
export class BccService {
  private readonly logger = new Logger(BccService.name);

  constructor(
    @InjectRepository(BccSignal)
    private readonly signalRepository: Repository<BccSignal>,
  ) { }

  async emit(
    tenantId: string,
    userId: string | undefined,
    dto: CreateSignalDto,
  ): Promise<BccSignal> {
    const signal = this.signalRepository.create({
      ...dto,
      tenantId,
      userId,
    });

    const savedSignal = await this.signalRepository.save(signal);

    // Log the signal with special BCC formatting
    this.logger.log(
      `[SIGNAL-PERSISTED] Source: ${signal.source} | Type: ${signal.type} | Intensity: ${signal.intensity}`,
    );

    return savedSignal;
  }

  async getStatus(tenantId: string) {
    // Current time range for health dots: Last 5 minutes
    const now = new Date();
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Fetch recent signals for this tenant
    const recentSignals = await this.signalRepository.find({
      where: {
        tenantId,
        createdAt: MoreThanOrEqual(fiveMinsAgo),
      },
    });

    const status: Record<
      string,
      { intensity: number; level: "low" | "medium" | "high" }
    > = {};

    Object.values(SignalSource).forEach((source) => {
      const sourceSignals = recentSignals.filter((s) => s.source === source);
      if (sourceSignals.length === 0) {
        status[source] = { intensity: 0, level: "low" };
        return;
      }

      const avgIntensity =
        sourceSignals.reduce((acc, s) => acc + s.intensity, 0) /
        sourceSignals.length;
      status[source] = {
        intensity: avgIntensity,
        level:
          avgIntensity > 0.7 ? "high" : avgIntensity > 0.3 ? "medium" : "low",
      };
    });

    return status;
  }

  async getTopology(tenantId: string) {
    const now = new Date();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const signals = await this.signalRepository.find({
      where: {
        tenantId,
        createdAt: MoreThanOrEqual(tenMinsAgo),
      },
      take: 100,
      order: { createdAt: "DESC" },
    });

    // Map signals to 3D space points
    const points = signals.map((s, idx) => {
      // Deterministic but distributed placement
      const angle = (idx / 20) * Math.PI * 2;
      const radius = 5 + (idx % 5);

      return {
        x: 10 + Math.cos(angle) * radius,
        y: s.intensity * 50, // Height is based on intensity
        z: 10 + Math.sin(angle) * radius,
        source: s.source
      };
    });

    return {
      points,
      config: {
        scale: 1,
        colorHigh: "#13ecec",
        colorLow: "#a855f7"
      }
    };
  }
}
