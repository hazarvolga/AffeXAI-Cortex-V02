export class BrandResonanceDto {
  status: "Stable" | "Volatile" | "Critical";
  value: string; // e.g. "0.04%"
  description: string;
}

export class SignalConvergenceDto {
  title: string;
  subtitle: string;
  deltaDescription: string;
}

export class ReputationalFrictionDto {
  title: string;
  description: string;
  status: "Monitored" | "Critical" | "Resolved" | "Stable";
  indicatorColor: string; // e.g. "bg-primary" or hex
  openTickets: number;
}

export class TrajectorySegmentDto {
  title: string;
  description: string;
  data: number[]; // Array of values representing the trajectory segment
}

export class TrajectoryDto {
  /** False when there is too little real history; all series are then empty. */
  sufficientData: boolean;
  historical: TrajectorySegmentDto;
  current: TrajectorySegmentDto;
  projected: TrajectorySegmentDto;
}

export class TopologyPointDto {
  x: number;
  y: number;
  z: number;
}

export class TopologyConfigDto {
  scale: number;
  colorHigh: string;
  colorLow: string;
}

export class TopologyDto {
  points: TopologyPointDto[];
  config: TopologyConfigDto;
}

/** Where each block of the response comes from, so the UI never shows a guess as a measurement. */
export type SourceQuality = "live" | "unavailable";

export class BrandDataQualityDto {
  resonance: SourceQuality;
  convergence: SourceQuality;
  friction: SourceQuality;
  trajectory: "live" | "insufficient" | "unavailable";
  /** Per-platform engagement history is not collected yet. */
  topology: "unavailable";
}

export class BrandIntelligenceDto {
  /** null when the source (social engagement, campaigns, tickets) could not be read. */
  resonance: BrandResonanceDto | null;
  convergence: SignalConvergenceDto | null;
  friction: ReputationalFrictionDto | null;
  trajectory: TrajectoryDto;
  topology: TopologyDto;
  dataQuality: BrandDataQualityDto;
  lastUpdated: Date;
}
