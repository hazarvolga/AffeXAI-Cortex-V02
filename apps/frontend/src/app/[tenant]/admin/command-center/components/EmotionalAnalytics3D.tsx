'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function WaveMesh() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (meshRef.current) {
            const time = clock.getElapsedTime();
            const position = meshRef.current.geometry.attributes.position;

            for (let i = 0; i < position.count; i++) {
                const x = position.getX(i);
                const y = position.getY(i);
                // Calculate Z based on sine wave over time to simulate "emotional flux"
                const z = Math.sin(x * 2 + time) * 0.2 + Math.cos(y * 2 + time) * 0.2;
                position.setZ(i, z);
            }
            position.needsUpdate = true;

            // Rotate slowly
            meshRef.current.rotation.z = time * 0.05;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, 3, 32, 32]} />
            <meshStandardMaterial
                color="#ff8c00"
                wireframe
                emissive="#ff4500"
                emissiveIntensity={0.5}
            />
        </mesh>
    );
}

export function EmotionalAnalytics3D() {
    return (
        <div className="w-full h-full min-h-[200px]">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 2, 4]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <WaveMesh />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                <gridHelper args={[10, 10, 0x333333, 0x111111]} />
            </Canvas>
        </div>
    );
}
