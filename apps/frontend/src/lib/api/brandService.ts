import { BaseApiService } from "./base-service";

export interface BrandResonance {
  status: "Stable" | "Volatile" | "Critical";
  value: string;
  description: string;
}

export interface SignalConvergence {
  title: string;
  subtitle: string;
  deltaDescription: string;
}

export interface ReputationalFriction {
  title: string;
  description: string;
  status: "Monitored" | "Critical" | "Resolved" | "Stable";
  indicatorColor: string;
  openTickets: number;
}

export interface TrajectorySegment {
  title: string;
  description: string;
  data: number[];
}

export interface Trajectory {
  /** False when there is too little real history; every series is then empty. */
  sufficientData?: boolean;
  historical: TrajectorySegment;
  current: TrajectorySegment;
  projected: TrajectorySegment;
}

export interface TopologyPoint {
  x: number;
  y: number;
  z: number;
}

export interface TopologyConfig {
  scale: number;
  colorHigh: string;
  colorLow: string;
}

export interface Topology {
  points: TopologyPoint[];
  config: TopologyConfig;
}

export interface BrandIntelligence {
  /** null when the source could not be read; see dataQuality. */
  resonance: BrandResonance | null;
  convergence: SignalConvergence | null;
  friction: ReputationalFriction | null;
  trajectory: Trajectory;
  topology: Topology;
  /** Where each block comes from; anything but "live" must not be shown as a measurement. */
  dataQuality?: {
    resonance: "live" | "unavailable";
    convergence: "live" | "unavailable";
    friction: "live" | "unavailable";
    trajectory: "live" | "insufficient" | "unavailable";
    topology: "unavailable";
  };
  lastUpdated: string;
}

class BrandService extends BaseApiService<BrandIntelligence> {
  constructor() {
    super({ endpoint: "/brand" });
  }

  async getBrandIntelligence(): Promise<BrandIntelligence> {
    return this.client.get<BrandIntelligence>(`${this.endpoint}/intelligence`);
  }
}

export const brandService = new BrandService();
