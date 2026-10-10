'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// 3D Mesh Component
function WireframeTerrain({ data }: { data: any }) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Geometry: 32x32 grid for detailed waves
    const geometry = useMemo(() => new THREE.PlaneGeometry(10, 10, 32, 32), []);
    const originalPositions = useMemo(() => geometry.attributes.position.clone(), [geometry]);

    // Animation Loop
    useFrame(({ clock }) => {
        if (!meshRef.current) return;

        const time = clock.getElapsedTime();
        const positions = meshRef.current.geometry.attributes.position;
        const count = positions.count;

        for (let i = 0; i < count; i++) {
            // Get original grid positions
            const x = originalPositions.getX(i);
            const y = originalPositions.getY(i); // In PlaneGeometry, Y is actually the 2D plane coordinate

            // Calculate Z (Height) based on Wave Function + Pulse
            // Circular Pulse Effect
            const dist = Math.sqrt(x * x + y * y);

            // Primary Wave (Breathing)
            const wave1 = Math.sin(dist * 2.0 - time * 1.5) * 0.5;

            // Secondary Noise (Data Jitter)
            const jitter = Math.sin(x * 5.0 + time) * Math.cos(y * 3.0 + time) * 0.2;

            // Height mapping
            const z = wave1 + jitter;

            // Apply height
            positions.setZ(i, z);
        }

        positions.needsUpdate = true;

        // Gentle Rotation
        meshRef.current.rotation.z = time * 0.05;
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10, 32, 32]} />
            <meshStandardMaterial
                color="#00f0ff"
                wireframe={true}
                emissive="#00f0ff"
                emissiveIntensity={0.5}
                transparent={true}
                opacity={0.3}
            />
        </mesh>
    );
}

// Main Wrapper Component
export default function SentimentHeatmap() {
    return (
        <div className="w-full h-full min-h-[250px] relative rounded-lg overflow-hidden">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={45} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00f0ff" />

                <WireframeTerrain data={{}} />

                {/* Controls (Locked for subtle interaction) */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 2}
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                />

                {/* Background Haze to blend with Bento Card */}
                <fog attach="fog" args={['#161B22', 5, 20]} />
            </Canvas>

            {/* Overlay Gradient for seamless integration */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#161B22] via-transparent to-transparent pointer-events-none"></div>
        </div>
    );
}
