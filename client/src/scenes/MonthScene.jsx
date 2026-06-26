import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * "This Month" scene — the top spending categories as a row of glowing towers, height ∝
 * spend, colored by each category's own stored colour. Bloom (in PersistentCanvas) carries
 * the glow. Data arrives as props (cents); labels live in the DOM overlay, so no in-canvas
 * text. Self-fades by scroll: only visible while its section (index 1) is centered.
 */

const SECTION = 1;
const MAX_HEIGHT = 3.2;
const BAR_WIDTH = 0.55;
const GAP = 0.35;
const MUTED = '#8892a6';

function hexColor(colour) {
  return colour && colour.startsWith('#') ? colour : MUTED;
}

function sectionFocus(index) {
  if (typeof window === 'undefined') return 0;
  const h = window.innerHeight || 1;
  return Math.max(0, 1 - Math.abs(window.scrollY / h - index));
}

export default function MonthScene({ topCats = [] }) {
  const groupRef = useRef(null);

  const bars = useMemo(() => {
    const max = topCats.reduce((m, c) => Math.max(m, c.cents), 0) || 1;
    const n = topCats.length;
    const totalW = n * BAR_WIDTH + Math.max(0, n - 1) * GAP;
    return topCats.map((c, i) => {
      const height = Math.max(0.05, (c.cents / max) * MAX_HEIGHT);
      const x = -totalW / 2 + BAR_WIDTH / 2 + i * (BAR_WIDTH + GAP);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hexColor(c.colour)),
        transparent: true,
        opacity: 0,
      });
      return { key: c.id ?? i, x, height, material };
    });
  }, [topCats]);

  useEffect(
    () => () => {
      for (const b of bars) b.material.dispose();
    },
    [bars],
  );

  useFrame(() => {
    const f = sectionFocus(SECTION);
    const g = groupRef.current;
    if (g) {
      g.visible = f > 0.001;
      g.position.y = -1.4 + (1 - f) * -0.4;
    }
    for (const b of bars) b.material.opacity = f;
  });

  return (
    <group ref={groupRef}>
      {bars.map((b) => (
        <mesh key={b.key} position={[b.x, b.height / 2, 0]} material={b.material}>
          <boxGeometry args={[BAR_WIDTH, b.height, BAR_WIDTH]} />
        </mesh>
      ))}
    </group>
  );
}
