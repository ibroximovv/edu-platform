import { useMemo, useRef } from 'react';
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber';
import { Environment, Float, Lightformer, RoundedBox, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const GOLD = '#fbbf24';

function GraduationCap(props: ThreeElements['group']) {
  const tassel = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (tassel.current) tassel.current.rotation.z = Math.sin(clock.elapsedTime * 1.6) * 0.12;
  });
  return (
    <group {...props}>
      <group rotation={[0, Math.PI / 4, 0]}>
        <RoundedBox args={[2.5, 0.12, 2.5]} radius={0.04} smoothness={4} castShadow>
          <meshPhysicalMaterial color="#241c52" roughness={0.35} metalness={0.25} clearcoat={0.8} clearcoatRoughness={0.2} />
        </RoundedBox>
      </group>
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.95, 1.08, 0.72, 48]} />
        <meshPhysicalMaterial color="#2d2366" roughness={0.4} metalness={0.2} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.08, 24]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} />
      </mesh>
      {/* cord to the corner */}
      <mesh position={[0.86, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 1.72, 8]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
      </mesh>
      <group ref={tassel} position={[1.72, 0.1, 0]}>
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -1.02, 0]}>
          <cylinderGeometry args={[0.06, 0.13, 0.38, 16]} />
          <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

function Book({ color, ...props }: { color: string } & ThreeElements['group']) {
  return (
    <group {...props}>
      <RoundedBox args={[1.6, 0.3, 1.15]} radius={0.05} smoothness={3}>
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.7} />
      </RoundedBox>
      <mesh position={[0.06, 0, 0]}>
        <boxGeometry args={[1.5, 0.22, 1.05]} />
        <meshStandardMaterial color="#fdf8ee" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Atom(props: ThreeElements['group']) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.6;
      ref.current.rotation.x += dt * 0.25;
    }
  });
  return (
    <group {...props}>
      <mesh>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>
      <group ref={ref}>
        {[0, Math.PI / 3, -Math.PI / 3].map((r, i) => (
          <mesh key={i} rotation={[Math.PI / 2, r, 0]}>
            <torusGeometry args={[0.8, 0.025, 12, 80]} />
            <meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={0.4} metalness={0.4} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Rig() {
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ pointer, camera }) => {
    target.set(pointer.x * 0.9, pointer.y * 0.5, 8);
    camera.position.lerp(target, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function AuthScene() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 8], fov: 42 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#a78bfa" />
      <pointLight position={[4, -3, 2]} intensity={20} color="#f472b6" />

      <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.2}>
        <GraduationCap position={[0.2, 0.9, 0]} rotation={[0.35, -0.5, 0.12]} scale={0.95} />
      </Float>

      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.8}>
        <group position={[-1.9, -1.55, -0.5]} rotation={[0.25, 0.6, -0.08]} scale={0.8}>
          <Book color="#7f6af3" position={[0, 0, 0]} />
          <Book color="#f472b6" position={[0.08, 0.31, 0.02]} rotation={[0, -0.15, 0]} />
          <Book color="#38bdf8" position={[-0.05, 0.62, -0.02]} rotation={[0, 0.12, 0]} />
        </group>
      </Float>

      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.5}>
        <Atom position={[2.3, -1.2, 0.4]} scale={0.9} />
      </Float>

      <Float speed={2.4} floatIntensity={2}>
        <mesh position={[-2.6, 1.7, -1]}>
          <icosahedronGeometry args={[0.45, 0]} />
          <meshPhysicalMaterial color="#c4b5fd" roughness={0.1} metalness={0.1} clearcoat={1} flatShading />
        </mesh>
      </Float>
      <Float speed={1.8} floatIntensity={1.6}>
        <mesh position={[2.7, 1.9, -1.2]} rotation={[0.6, 0.2, 0]}>
          <torusGeometry args={[0.38, 0.14, 24, 60]} />
          <meshPhysicalMaterial color="#fbbf24" roughness={0.2} metalness={0.5} clearcoat={1} />
        </mesh>
      </Float>
      <Float speed={3} floatIntensity={2.2}>
        <mesh position={[-0.6, -2.4, 1]}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshPhysicalMaterial color="#38bdf8" roughness={0.1} clearcoat={1} />
        </mesh>
      </Float>

      <Sparkles count={70} scale={[9, 6, 4]} size={2.2} speed={0.35} color="#e9d5ff" opacity={0.8} />

      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 4, 4]} scale={[8, 2, 1]} color="#ffffff" />
        <Lightformer intensity={1.5} position={[-5, 0, 2]} scale={[2, 6, 1]} color="#c4b5fd" />
        <Lightformer intensity={1.2} position={[5, -1, 2]} scale={[2, 6, 1]} color="#f9a8d4" />
      </Environment>
      <Rig />
    </Canvas>
  );
}
