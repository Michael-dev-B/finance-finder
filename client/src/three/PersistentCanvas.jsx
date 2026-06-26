import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import HeroScene from '../scenes/HeroScene.jsx';

/**
 * The single, persistent WebGL canvas — fixed behind all content. Renders the hero
 * signal-wave scene with brand bloom.
 *
 * Perf: the render loop runs only while the hero is on screen AND the tab is visible.
 * When the opaque workspace docks over the canvas (hero offscreen) or the tab is hidden,
 * `frameloop` flips to "never" and the GPU rests. One canvas, never per-section.
 */
export default function PersistentCanvas() {
  const [active, setActive] = useState(true);

  useEffect(() => {
    let inView = true;
    let visible = !document.hidden;
    const apply = () => setActive(inView && visible);

    const hero = document.getElementById('hero');
    let io;
    if (hero && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          inView = entries.some((e) => e.isIntersecting);
          apply();
        },
        { threshold: 0 },
      );
      io.observe(hero);
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
