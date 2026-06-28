import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * "Trends" scene — recent months as three glowing additive lines (income / expense / net),
 * same BufferGeometry-line technique as the hero. Income & expense use the semantic income
 * (lime) / expense (orange) colours for their actual meaning; net uses brand blue. Data
 * arrives as props (cents). Self-fades by scroll: visible while its section (index 2) is
 * centered.
 */

const SECTION = 2;
const WIDTH = 9;
const HEIGHT = 3;

// sRGB approximations of the DESIGN.md OKLCH tokens (three's Color can't parse oklch()):
const INCOME = '#9bd84a'; // ≈ Positive Lime  oklch(80% 0.16 88)
const EXPENSE = '#e8643a'; // ≈ Outflow Orange oklch(65% 0.20 22)
const NET = '#2ba8e6'; //    ≈ Console Blue    oklch(74% 0.18 225)

function sectionFocus(index) {
  if (typeof window === 'undefined') return 0;
  const h = window.innerHeight || 1;
  return Math.max(0, 1 - Math.abs(window.scrollY / h - index));
}

function buildLine(values, max, color, z) {
  const n = values.length;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = n <= 1 ? 0 : -WIDTH / 2 + (WIDTH * i) / (n - 1);
    positions[i * 3 + 1] = (values[i] / max) * HEIGHT;
    positions[i * 3 + 2] = z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Line(geometry, material);
}

export default function TrendsScene({ trends }) {
  const groupRef = useRef(null);

  const lines = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    const max =
      trends.reduce((m, t) => Math.max(m, t.income, t.expense, Math.abs(t.net)), 0) || 1;
    return [
      buildLine(trends.map((t) => t.income), max, INCOME, 0.2),
      buildLine(trends.map((t) => t.expense), max, EXPENSE, 0),
      buildLine(trends.map((t) => t.net), max, NET, -0.2),
    ];
  }, [trends]);

  useEffect(
    () => () => {
      for (const l of lines) {
        l.geometry.dispose();
        l.material.dispose();
      }
    },
    [lines],
  );

  useFrame((state) => {
    const f = sectionFocus(SECTION);
    const g = groupRef.current;
    if (g) {
      g.visible = f > 0.001 && lines.length > 0;
      g.position.y = -HEIGHT / 2 + (1 - f) * -0.4;
      g.rotation.x = (1 - f) * 0.3;
    }
    const t = state.clock.elapsedTime;
    for (const l of lines) {
      l.material.opacity = f * 0.95;
      l.position.z = Math.sin(t * 0.4) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </group>
  );
}
