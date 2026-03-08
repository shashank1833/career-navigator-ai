import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const BrainSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 4]} />
        <MeshDistortMaterial
          color="hsl(217, 91%, 60%)"
          wireframe
          transparent
          opacity={0.35}
          distort={0.3}
          speed={2}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.9, 3]} />
        <MeshDistortMaterial
          color="hsl(187, 92%, 49%)"
          wireframe
          transparent
          opacity={0.2}
          distort={0.4}
          speed={3}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color="hsl(263, 70%, 50%)"
          transparent
          opacity={0.3}
          emissive="hsl(263, 70%, 50%)"
          emissiveIntensity={0.5}
        />
      </mesh>
    </Float>
  );
};

const OrbitingRings = () => {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1.current) {
      ring1.current.rotation.x = Math.PI * 0.4 + Math.sin(t * 0.3) * 0.1;
      ring1.current.rotation.z = t * 0.4;
    }
    if (ring2.current) {
      ring2.current.rotation.x = Math.PI * 0.6 + Math.cos(t * 0.2) * 0.1;
      ring2.current.rotation.z = -t * 0.3;
    }
  });

  return (
    <>
      <mesh ref={ring1}>
        <torusGeometry args={[1.8, 0.015, 16, 100]} />
        <meshStandardMaterial
          color="hsl(217, 91%, 60%)"
          transparent
          opacity={0.3}
          emissive="hsl(217, 91%, 60%)"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[2.1, 0.01, 16, 100]} />
        <meshStandardMaterial
          color="hsl(187, 92%, 49%)"
          transparent
          opacity={0.2}
          emissive="hsl(187, 92%, 49%)"
          emissiveIntensity={0.2}
        />
      </mesh>
    </>
  );
};

interface HeroBrainProps {
  size?: "sm" | "md" | "lg";
}

const HeroBrain = ({ size = "md" }: HeroBrainProps) => {
  const dimensions = {
    sm: "h-32 w-32",
    md: "h-48 w-48",
    lg: "h-64 w-64",
  };

  return (
    <div className={`${dimensions[size]} mx-auto`}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={0.8} color="hsl(217, 91%, 60%)" />
        <pointLight position={[-3, -2, 2]} intensity={0.4} color="hsl(187, 92%, 49%)" />
        <BrainSphere />
        <OrbitingRings />
      </Canvas>
    </div>
  );
};

export default HeroBrain;
