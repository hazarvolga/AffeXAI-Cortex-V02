import { BaseApiService } from './base-service';

export interface BrandResonance {
    status: 'Stable' | 'Volatile' | 'Critical';
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
    status: 'Monitored' | 'Critical' | 'Resolved' | 'Stable';
    indicatorColor: string;
    openTickets: number;
}

export interface TrajectorySegment {
    title: string;
    description: string;
    data: number[];
}

export interface Trajectory {
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
    resonance: BrandResonance;
    convergence: SignalConvergence;
    friction: ReputationalFriction;
    trajectory: Trajectory;
    topology: Topology;
    lastUpdated: string;
}

class BrandService extends BaseApiService<BrandIntelligence> {
    constructor() {
        super({ endpoint: '/brand' });
    }

    async getBrandIntelligence(): Promise<BrandIntelligence> {
        return this.client.get<BrandIntelligence>(`${this.endpoint}/intelligence`);
    }
}

export const brandService = new BrandService();
