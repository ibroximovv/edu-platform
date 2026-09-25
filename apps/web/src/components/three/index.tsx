import { Component, lazy, Suspense, useMemo, type ReactNode } from 'react';
import { useUIStore } from '@/stores/ui.store';

const AuthScene = lazy(() => import('./AuthScene'));
const HeroStars = lazy(() => import('./HeroStars'));
const PodiumScene = lazy(() => import('./PodiumScene'));

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Renders a lazily-loaded 3D scene only when WebGL is available and 3D is enabled. */
function Guard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const enabled = useUIStore((s) => s.enable3d);
  const supported = useMemo(hasWebGL, []);
  const reduced = useMemo(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  if (!enabled || !supported || reduced) return <>{fallback}</>;
  return (
    <SceneBoundary fallback={fallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </SceneBoundary>
  );
}

export function Auth3D({ fallback }: { fallback?: ReactNode }) {
  return (
    <Guard fallback={fallback}>
      <AuthScene />
    </Guard>
  );
}

export function Hero3D({ fallback }: { fallback?: ReactNode }) {
  return (
    <Guard fallback={fallback}>
      <HeroStars />
    </Guard>
  );
}

export function Podium3D({ people, fallback }: { people: Parameters<typeof PodiumScene>[0]['people']; fallback?: ReactNode }) {
  return (
    <Guard fallback={fallback}>
      <PodiumScene people={people} />
    </Guard>
  );
}
