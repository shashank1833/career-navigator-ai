import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ParticleField = () => {
  const meshRef = useRef<THREE.Points>(null);
  const count = 800;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    const primaryColor = new THREE.Color("hsl(217, 91%, 60%)");
    const accentColor = new THREE.Color("hsl(187, 92%, 49%)");
    const secondaryColor = new THREE.Color("hsl(263, 70%, 50%)");
    const colorOptions = [primaryColor, accentColor, secondaryColor];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;

      const c = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * 0.15;
    meshRef.current.rotation.y = t * 0.3;
    meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    
    const posAttr = meshRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t + i * 0.01) * 0.002;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const FloatingGeometry = () => {
  const torusRef = useRef<THREE.Mesh>(null);
  const icosaRef = useRef<THREE.Mesh>(null);
  const octaRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (torusRef.current) {
      torusRef.current.rotation.x = t * 0.2;
      torusRef.current.rotation.y = t * 0.3;
      torusRef.current.position.y = Math.sin(t * 0.5) * 0.5;
    }
    if (icosaRef.current) {
      icosaRef.current.rotation.x = t * 0.15;
      icosaRef.current.rotation.z = t * 0.25;
      icosaRef.current.position.y = Math.cos(t * 0.4) * 0.3 + 1;
    }
    if (octaRef.current) {
      octaRef.current.rotation.y = t * 0.3;
      octaRef.current.rotation.z = t * 0.15;
      octaRef.current.position.y = Math.sin(t * 0.3 + 1) * 0.4 - 1;
    }
  });

  return (
    <>
      <mesh ref={torusRef} position={[-3, 0, -2]}>
        <torusKnotGeometry args={[0.6, 0.15, 100, 16]} />
        <meshStandardMaterial
          color="hsl(217, 91%, 60%)"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh ref={icosaRef} position={[3.5, 1, -3]}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          color="hsl(187, 92%, 49%)"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
      <mesh ref={octaRef} position={[0, -2, -4]}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial
          color="hsl(263, 70%, 50%)"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </>
  );
};

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="hsl(217, 91%, 60%)" />
        <pointLight position={[-5, -3, 3]} intensity={0.3} color="hsl(187, 92%, 49%)" />
        <ParticleField />
        <FloatingGeometry />
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
