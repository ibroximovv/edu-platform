import { createRef, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { generatedAvatar } from '@/lib/avatar';

export interface PodiumPerson {
  id: string;
  name: string;
  score: string;
  avatarUrl?: string | null;
}

const PLACES = [
  { x: 0, h: 1.9, color: '#7f6af3', label: '1', medal: '#fbbf24' },
  { x: -1.75, h: 1.3, color: '#94a3b8', label: '2', medal: '#e2e8f0' },
  { x: 1.75, h: 0.95, color: '#f59e0b', label: '3', medal: '#fdba74' },
];

/** Big white digit rendered to a canvas texture (no DOM overlay, no font download). */
function useDigitTexture(text: string) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.font = '900 190px "Plus Jakarta Sans Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.25)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 128, 140);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);
}

function Column({ place, index, anchor }: { place: (typeof PLACES)[number]; index: number; anchor: RefObject<THREE.Object3D | null> }) {
  const ref = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const digit = useDigitTexture(place.label);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    start.current ??= clock.elapsedTime;
    const t = Math.min(1, (clock.elapsedTime - start.current - index * 0.15) / 0.9);
    const e = t <= 0 ? 0.001 : 1 - Math.pow(1 - t, 3);
    ref.current.scale.y = e;
  });
  return (
    <group position={[place.x, -1.4, 0]}>
      <group ref={ref}>
        <RoundedBox args={[1.5, place.h, 1.5]} radius={0.1} smoothness={4} position={[0, place.h / 2, 0]}>
          <meshPhysicalMaterial color={place.color} roughness={0.25} metalness={0.15} clearcoat={1} clearcoatRoughness={0.15} />
        </RoundedBox>
        <mesh position={[0, place.h / 2, 0.76]}>
          <planeGeometry args={[0.95, 0.95]} />
          <meshBasicMaterial map={digit} transparent toneMapped={false} />
        </mesh>
      </group>
      <object3D ref={anchor} position={[0, place.h + 0.15, 0]} />
    </group>
  );
}

function Confetti({ count = 140 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const parts = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 9,
        y: Math.random() * 7 - 1,
        z: (Math.random() - 0.5) * 4,
        speed: 0.4 + Math.random() * 0.8,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 4,
      })),
    [count],
  );
  const colors = useMemo(() => {
    const palette = ['#7f6af3', '#f472b6', '#38bdf8', '#fbbf24', '#34d399'].map((c) => new THREE.Color(c));
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) palette[i % palette.length].toArray(arr, i * 3);
    return arr;
  }, [count]);
  useFrame((_, dt) => {
    if (!mesh.current) return;
    parts.forEach((p, i) => {
      p.y -= p.speed * dt;
      p.rot += p.spin * dt;
      if (p.y < -2) p.y = 5;
      dummy.position.set(p.x + Math.sin(p.y * 2 + i) * 0.15, p.y, p.z);
      dummy.rotation.set(p.rot, p.rot * 0.7, 0);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.08, 0.14]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </planeGeometry>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function Sway(props: ThreeElements['group']) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, Math.sin(clock.elapsedTime * 0.3) * 0.18 + pointer.x * 0.2, 0.05);
  });
  return <group ref={ref} {...props} />;
}

/** Projects 3D anchors to screen space and moves the DOM labels (cheap alternative to drei <Html>). */
function Projector({ anchors, labels }: { anchors: RefObject<THREE.Object3D | null>[]; labels: RefObject<HTMLDivElement | null>[] }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    anchors.forEach((a, i) => {
      const el = labels[i].current;
      if (!a.current || !el) return;
      v.setFromMatrixPosition(a.current.matrixWorld).project(camera);
      el.style.transform = `translate(-50%, -100%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
      el.style.opacity = '1';
    });
  });
  return null;
}

export default function PodiumScene({ people }: { people: PodiumPerson[] }) {
  const anchors = useMemo(() => PLACES.map(() => createRef<THREE.Object3D>()), []);
  const labels = useMemo(() => PLACES.map(() => createRef<HTMLDivElement>()), []);
  return (
    <div className="relative size-full">
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 1.4, 7.2], fov: 38 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 6, 5]} intensity={2.2} />
        <pointLight position={[-4, 2, 3]} intensity={18} color="#c4b5fd" />
        <Sway>
          {PLACES.map((p, i) => (
            <Column key={p.label} place={p} index={i} anchor={anchors[i]} />
          ))}
        </Sway>
        <ContactShadows position={[0, -1.41, 0]} opacity={0.35} scale={10} blur={2.6} far={3} />
        <Confetti />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 4, 4]} scale={[8, 2, 1]} />
          <Lightformer intensity={1} position={[-5, 1, 2]} scale={[2, 6, 1]} color="#e9d5ff" />
        </Environment>
        <Projector anchors={anchors} labels={labels} />
      </Canvas>
      {PLACES.map((place, i) => {
        const person = people[i];
        if (!person) return null;
        const size = i === 0 ? 64 : 52;
        return (
          <div key={place.label} ref={labels[i]} className="pointer-events-none absolute left-0 top-0 flex w-36 flex-col items-center gap-1 opacity-0 transition-opacity duration-500">
            <div className="relative">
              {i === 0 && <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">👑</span>}
              <img src={person.avatarUrl && !person.avatarUrl.startsWith('idb://') ? person.avatarUrl : generatedAvatar(person.id)} alt="" className="rounded-full bg-white shadow-xl" style={{ width: size, height: size, border: `3px solid ${place.medal}` }} />
            </div>
            <div className="max-w-full truncate text-center text-xs font-extrabold text-fg">{person.name}</div>
            <div className="rounded-lg px-2 py-px text-[11px] font-bold text-white" style={{ background: place.color }}>
              {person.score}
            </div>
          </div>
        );
      })}
    </div>
  );
}
