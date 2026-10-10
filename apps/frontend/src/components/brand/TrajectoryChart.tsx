"use client";

import { TrajectoryChart3D } from './TrajectoryChart3D';

interface TrajectorySegment {
    title: string;
    description: string;
    data: number[];
}

interface TrajectoryChartProps {
    trajectory: {
        historical: TrajectorySegment;
        current: TrajectorySegment;
        projected: TrajectorySegment;
    };
}

export const TrajectoryChart = ({ trajectory }: TrajectoryChartProps) => {
    return (
        <div className="space-y-12">
            {/* 3D Visualization */}
            <TrajectoryChart3D trajectory={trajectory} />

            {/* Content Sheets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8">
                {/* Historical */}
                <div className="space-y-6">
                    <div className="h-px w-8 bg-white/20"></div>
                    <h5 className="text-xs uppercase tracking-widest font-bold font-mono text-white/60">
                        {trajectory?.historical?.title ?? 'HISTORICAL COHERENCE'}
                    </h5>
                    <p className="text-[13px] text-white/50 leading-relaxed">
                        {trajectory?.historical?.description ?? 'Persistent growth trajectories established in baseline.'}
                    </p>
                </div>

                {/* Current */}
                <div className="space-y-6 md:transform md:translate-y-8">
                    <div className="h-px w-8 bg-primary"></div>
                    <h5 className="text-xs uppercase tracking-widest font-bold text-primary font-mono">
                        {trajectory?.current?.title ?? 'CURRENT CONVERGENCE'}
                    </h5>
                    <p className="text-[13px] text-white/80 leading-relaxed">
                        {trajectory?.current?.description ?? 'Narrative parity achieved across primary segments.'}
                    </p>
                </div>

                {/* Projected */}
                <div className="space-y-6 md:transform md:translate-y-16 opacity-50 text-white/40">
                    <div className="h-px w-8 bg-white/20"></div>
                    <h5 className="text-xs uppercase tracking-widest font-bold font-mono">
                        {trajectory?.projected?.title ?? 'PROJECTED TRAJECTORY'}
                    </h5>
                    <p className="text-[13px] text-white/50 leading-relaxed">
                        {trajectory?.projected?.description ?? 'Anticipated divergence as external pressures mount.'}
                    </p>
                </div>
            </div>
        </div>
    );
};
