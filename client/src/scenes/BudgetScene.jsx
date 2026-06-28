import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * "Budget health" scene — one radial gauge per budgeted category: a faint full track ring
 * plus a status-colored fill arc whose sweep ∝ spend/budget. Distinct from the towers
 * (This Month) and lines (Trends). Bloom (in PersistentCanvas) carries the glow. Data
 * arrives as props (cents + pct); labels live in the DOM overlay. Self-fades by scroll:
 * visible while its section (index 3) is centered.
 *
 * Status thresholds mirror BudgetManager.statusInfo so it reads identically to the dashboard.
 */

const SECTION = 3;
const INNER = 0.28;
const OUTER = 0.42;
const SEGMENTS = 48;
const GAP = 0.25; // gap between adjacent gauges
const TRACK = '#3a414d'; // faint track ring (dim steel)

// sRGB approximations of the DESIGN.md OKLCH tokens (three's Color can't parse oklch()):
const ON_TRACK = '#9bd84a'; // ≈ Positive Lime   (pct < 80)
const AT_RISK = '#2ba8e6'; //  ≈ Console Blue     (80 ≤ pct ≤ 100)
const OVER = '#e8643a'; //     ≈ Outflow Orange   (pct > 100)

function statusColor(pct) {
  if (pct > 100) return OVER;
  if (pct >= 80) return AT_RISK;
  return ON_TRACK;
}

function sectionFocus(index) {
  if (typeof window === 'undefined') return 0;
  const h = window.innerHeight || 1;
  return Math.max(0, 1 - Math.abs(window.scrollY / h - index));
}

export default function BudgetScene({ budget = [] }) {
  const groupRef = useRef(null);

  const gauges = useMemo(() => {
    const n = budget.length;
    const step = OUTER * 2 + GAP;
    const totalW = n > 0 ? n * (OUTER * 2) + (n - 1) * GAP : 0;
    return budget.map((b, i) => {
      const frac = Math.min(b.pct, 100) / 100;
      const x = -totalW / 2 + OUTER + i * step;
      const segs = Math.max(2, Math.round(SEGMENTS * frac));
      const trackMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(TRACK),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const fillMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(statusColor(b.pct)),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      return { key: b.id ?? i, x, frac, segs, trackMat, fillMat };
    });
  }, [budget]);

  useEffect(
    () => () => {
      for (const g of gauges) {
        g.trackMat.dispose();
        g.fillMat.dispose();
      }
    },
    [gauges],
  );

  useFrame((state) => {
    const f = sectionFocus(SECTION);
    const grp = groupRef.current;
    if (grp) {
      grp.visible = f > 0.001 && gauges.length > 0;
      grp.position.y = (1 - f) * -0.4;
      grp.scale.setScalar(0.9 + f * 0.1);
    }
    const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 1.5) * 0.12;
    for (const g of gauges) {
      g.trackMat.opacity = f * 0.18;
      g.fillMat.opacity = f * pulse;
    }
  });

  return (
    <group ref={groupRef}>
      {gauges.map((g) => (
        <group key={g.key} position={[g.x, 0, 0]}>
          <mesh material={g.trackMat}>
            <ringGeometry args={[INNER, OUTER, SEGMENTS, 1]} />
          </mesh>
          <mesh material={g.fillMat}>
            <ringGeometry args={[INNER, OUTER, g.segs, 1, Math.PI / 2, -g.frac * Math.PI * 2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
