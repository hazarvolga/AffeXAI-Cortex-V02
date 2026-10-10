export class BrandResonanceDto {
  status: 'Stable' | 'Volatile' | 'Critical';
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
  status: 'Monitored' | 'Critical' | 'Resolved' | 'Stable';
  indicatorColor: string; // e.g. "bg-primary" or hex
  openTickets: number;
}

export class TrajectorySegmentDto {
  title: string;
  description: string;
  data: number[]; // Array of values representing the trajectory segment
}

export class TrajectoryDto {
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

export class BrandIntelligenceDto {
  resonance: BrandResonanceDto;
  convergence: SignalConvergenceDto;
  friction: ReputationalFrictionDto;
  trajectory: TrajectoryDto;
  topology: TopologyDto;
  lastUpdated: Date;
}
