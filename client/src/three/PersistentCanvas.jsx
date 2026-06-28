import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import HeroScene from '../scenes/HeroScene.jsx';
import MonthScene from '../scenes/MonthScene.jsx';
import TrendsScene from '../scenes/TrendsScene.jsx';
import BudgetScene from '../scenes/BudgetScene.jsx';

/**
 * The single, persistent WebGL canvas — fixed behind all content, and transparent (alpha clear,
 * no opaque background) so the shared Aurora ambient (components/AmbientBackground) shows through
 * as the common base in both acts. Renders the Act I journey (hero signal-waves → this-month
 * towers → trend lines → budget rings); each scene self-fades by scroll, so all stay mounted
 * (they're light). Data scenes receive cents as props.
 *
 * Perf: the loop runs through the journey and flips `frameloop` to "never" once Act II (the
 * working app) reaches the top (IntersectionObserver on #act2) or the tab is hidden — the
 * cinematic scenes are Act I only; the CSS aurora carries the workspace. One canvas, never
 * per-section.
 */
export default function PersistentCanvas({ data }) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    let docked = false;
    let visible = !document.hidden;
    const apply = () => setActive(!docked && visible);

    // Pause once Act II (the working app) reaches the top of the viewport — the cinematic
    // journey is behind us. The bottom margin collapses the root to a thin strip at the top.
    const act2 = document.getElementById('act2');
    let io;
    if (act2 && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          docked = entries[0].isIntersecting;
          apply();
        },
        { rootMargin: '0px 0px -99% 0px' },
      );
      io.observe(act2);
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
      // alpha: transparent clear so the Aurora ambient behind the canvas is the shared base.
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <HeroScene />
      <MonthScene topCats={data?.topCats ?? []} />
      <TrendsScene trends={data?.trends ?? null} />
      <BudgetScene budget={data?.budget ?? []} />
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
