import { useMemo, useRef } from 'react';
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber';
import { Environment, Float, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

function useSparkleGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    const k = 0.14;
    s.moveTo(0, 1);
    s.quadraticCurveTo(k, k, 1, 0);
    s.quadraticCurveTo(k, -k, 0, -1);
    s.quadraticCurveTo(-k, -k, -1, 0);
    s.quadraticCurveTo(-k, k, 0, 1);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 8, curveSegments: 32 });
    g.center();
    return g;
  }, []);
}

function Star({ geometry, speed = 0.4, ...props }: { geometry: THREE.BufferGeometry; speed?: number } & ThreeElements['mesh']) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed;
  });
  return (
    <mesh ref={ref} geometry={geometry} {...props}>
      <meshPhysicalMaterial color="#ffffff" emissive="#c4b5fd" emissiveIntensity={0.25} roughness={0.12} metalness={0.15} clearcoat={1} clearcoatRoughness={0.1} iridescence={0.6} iridescenceIOR={1.4} />
    </mesh>
  );
}

function Tilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ pointer }) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, pointer.x * 0.35, 0.05);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -pointer.y * 0.25, 0.05);
  });
  return <group ref={ref}>{children}</group>;
}

/** Glossy 3D sparkles used in dashboard hero banners. Transparent background. */
export default function HeroStars() {
  const geo = useSparkleGeometry();
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 6], fov: 40 }} gl={{ alpha: true, antialias: true }} style={{ pointerEvents: 'none' }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <pointLight position={[-3, -2, 2]} intensity={15} color="#f0abfc" />
      <Tilt>
        <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.8}>
          <Star geometry={geo} position={[0.4, 0.1, 0]} scale={1.35} speed={0.5} />
        </Float>
        <Float speed={2.2} floatIntensity={1.4}>
          <Star geometry={geo} position={[-1.7, 0.9, -0.5]} scale={0.45} speed={-0.8} />
        </Float>
        <Float speed={2.6} floatIntensity={1.6}>
          <Star geometry={geo} position={[2.1, -0.9, -0.3]} scale={0.35} speed={1} />
        </Float>
        <Float speed={1.8} floatIntensity={1}>
          <mesh position={[-1.3, -1.1, 0.2]}>
            <sphereGeometry args={[0.16, 32, 32]} />
            <meshPhysicalMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.3} roughness={0.2} clearcoat={1} />
          </mesh>
        </Float>
      </Tilt>
      <Environment resolution={64}>
        <Lightformer intensity={2.5} position={[0, 3, 4]} scale={[6, 2, 1]} />
        <Lightformer intensity={1.5} position={[-4, 0, 2]} scale={[2, 5, 1]} color="#ddd6fe" />
      </Environment>
    </Canvas>
  );
}
