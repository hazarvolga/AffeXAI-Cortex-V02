"use client";

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface TopologyPoint {
    x: number;
    y: number;
    z: number;
}

interface ThreeResonanceFieldProps {
    data?: {
        points: TopologyPoint[];
        config: {
            scale: number;
            colorHigh: string;
            colorLow: string;
        };
    };
}

const TopologyMesh = ({ data }: ThreeResonanceFieldProps) => {
    const meshRef = useRef<THREE.Points>(null);
    const particlesCount = data?.points?.length || 400;

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    const { positions, colors } = useMemo(() => {
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);
        const colorHigh = new THREE.Color(data?.config?.colorHigh || '#ff8c00');
        const colorLow = new THREE.Color(data?.config?.colorLow || '#13ecda');

        if (data?.points) {
            data.points.forEach((p, i) => {
                const i3 = i * 3;
                positions[i3] = (p.x - 10) * 0.5; // Center X
                positions[i3 + 1] = p.y * 0.1;    // Scale Y (Height)
                positions[i3 + 2] = (p.z - 10) * 0.5; // Center Z

                // Lerp color based on height
                const normalizedHeight = Math.min(1, p.y / 50);
                const mixedColor = colorLow.clone().lerp(colorHigh, normalizedHeight);

                colors[i3] = mixedColor.r;
                colors[i3 + 1] = mixedColor.g;
                colors[i3 + 2] = mixedColor.b;
            });
        } else {
            // Fallback Grid
            for (let i = 0; i < particlesCount; i++) {
                const i3 = i * 3;
                const x = (i % 20) - 10;
                const z = Math.floor(i / 20) - 10;
                positions[i3] = x * 0.5;
                positions[i3 + 1] = 0;
                positions[i3 + 2] = z * 0.5;

                colors[i3] = colorLow.r;
                colors[i3 + 1] = colorLow.g;
                colors[i3 + 2] = colorLow.b;
            }
        }

        return { positions, colors };
    }, [data, particlesCount]);

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.15}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

const GridFloor = () => {
    return (
        <gridHelper
            args={[20, 20, 0x13ecda, 0x13ecda]}
            position={[0, -2, 0]}
            rotation={[0, 0, 0]}
        >
            <meshBasicMaterial transparent opacity={0.1} color="#13ecda" />
        </gridHelper>
    );
};

export const ThreeResonanceField = ({ data }: ThreeResonanceFieldProps) => {
    return (
        <div className="w-full h-full min-h-[300px] relative">
            <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={45} />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                    maxPolarAngle={Math.PI / 2.2}
                />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#ff8c00" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#13ecda" />

                <TopologyMesh data={data} />
                <GridFloor />

                <Environment preset="city" />
            </Canvas>

            {/* Overlay UI */}
            <div className="absolute bottom-4 left-4 pointer-events-none">
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                    <span className="w-2 h-2 rounded-full bg-[#ff8c00] animate-pulse"></span>
                    ACTIVE TOPOLOGY FIELD
                </div>
            </div>
        </div>
    );
};
