"use client";

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Stars, Float as FloatDrei, MeshDistortMaterial, GradientTexture, Line } from '@react-three/drei';
import * as THREE from 'three';

interface TrajectoryData {
    historical: { data: number[] };
    current: { data: number[] };
    projected: { data: number[] };
}

const AnimatedCurve = ({ points, color, opacity = 1, lineWidth = 2, dashed = false }: { points: THREE.Vector3[], color: string, opacity?: number, lineWidth?: number, dashed?: boolean }) => {
    const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
    const curvePoints = useMemo(() => curve.getPoints(100), [curve]);

    return (
        <Line
            points={curvePoints}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            dashed={dashed}
            dashScale={dashed ? 5 : 0}
            dashSize={dashed ? 0.2 : 0}
            gapSize={dashed ? 0.1 : 0}
        />
    );
};

const TrajectoryScene = ({ trajectory }: { trajectory: TrajectoryData }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Convert raw numerical data to 3D points
    // We'll map the x-axis to time, and y-axis to the sentiment value
    const points = useMemo(() => {
        const historical = trajectory.historical.data.map((v, i) => new THREE.Vector3(i * 0.5 - 6, v * 5 - 2.5, 0));
        const current = trajectory.current.data.map((v, i) => new THREE.Vector3((i + trajectory.historical.data.length - 1) * 0.5 - 6, v * 5 - 2.5, 0));
        const projected = trajectory.projected.data.map((v, i) => new THREE.Vector3((i + trajectory.historical.data.length + trajectory.current.data.length - 2) * 0.5 - 6, v * 5 - 2.5, 0));

        return { historical, current, projected };
    }, [trajectory]);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
            groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Historical Line */}
            <AnimatedCurve points={points.historical} color="#ffffff" opacity={0.3} lineWidth={1.5} />

            {/* Current Line (Glowing/Bolder) */}
            <AnimatedCurve points={points.current} color="#00f2fe" opacity={1} lineWidth={4} />

            {/* Projected Line (Dashed) */}
            <AnimatedCurve points={points.projected} color="#00f2fe" opacity={0.5} lineWidth={2} dashed />

            {/* Decorative pulse at the current point */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh position={points.current[points.current.length - 1]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial color="#00f2fe" />
                </mesh>
                <mesh position={points.current[points.current.length - 1]}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshBasicMaterial color="#00f2fe" transparent opacity={0.3} />
                </mesh>
            </Float>

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
        </group>
    );
};

export const TrajectoryChart3D = ({ trajectory }: { trajectory: any }) => {
    if (!trajectory) return null;

    return (
        <div className="w-full h-[400px] relative rounded-3xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            {/* Title Overlays */}
            <div className="absolute top-8 left-8 z-10 space-y-1">
                <h4 className="text-sm font-mono uppercase tracking-[0.3em] text-white/40">Sentiment Trajectory</h4>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,242,254,0.8)]" />
                    <span className="text-xl font-light text-white tracking-tight">Predictive Intelligence Active</span>
                </div>
            </div>

            <Canvas gl={{ alpha: true }} dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={35} />
                <TrajectoryScene trajectory={trajectory} />
            </Canvas>

            {/* Legend */}
            <div className="absolute bottom-8 right-8 z-10 flex gap-6 text-[10px] uppercase tracking-widest font-mono text-white/30">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-white/30" />
                    <span>Historical</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-primary" />
                    <span className="text-white/60">Current</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-[1px] border-t border-dashed border-primary/60" />
                    <span>Projected</span>
                </div>
            </div>
        </div>
    );
};
