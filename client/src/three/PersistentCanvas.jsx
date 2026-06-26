import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import HeroScene from '../scenes/HeroScene.jsx';
import MonthScene from '../scenes/MonthScene.jsx';
import TrendsScene from '../scenes/TrendsScene.jsx';

/**
 * The single, persistent WebGL canvas — fixed behind all content. Renders the whole Act I
 * journey (hero waves → this-month towers → trend lines); each scene self-fades by scroll,
 * so all three stay mounted (they're light). Data scenes receive cents as props.
 *
 * Perf: the render loop runs through the journey and flips `frameloop` to "never" once the
 * opaque workspace docks over the canvas (IntersectionObserver on #workspace) or the tab is
 * hidden. One canvas, never per-section.
 */
export default function PersistentCanvas({ data }) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    let docked = false;
    let visible = !document.hidden;
    const apply = () => setActive(!docked && visible);

    const workspace = document.getElementById('workspace');
    let io;
    if (workspace && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          docked = e.isIntersecting && e.intersectionRatio >= 0.99;
          apply();
        },
        { threshold: [0, 0.5, 0.99, 1] },
      );
      io.observe(workspace);
    }
    const onVisibility = () => {
      visible = !document.hidden;
      apply();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <Canvas
      aria-hidden
      // style (not className): R3F sets position:relative inline on the wrapper, and
      // inline beats a Tailwind class — so the fixed/-z-10 layering must go here.
      style={{ position: 'fixed', inset: 0, zIndex: -10, pointerEvents: 'none' }}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 7], fov: 50 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0b0e13']} />
      <HeroScene />
      <MonthScene topCats={data?.topCats ?? []} />
      <TrendsScene trends={data?.trends ?? null} />
      <EffectComposer>
        <Bloom
          intensity={1.4}
          luminanceThreshold={0}
          luminanceSmoothing={0.9}
          radius={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
