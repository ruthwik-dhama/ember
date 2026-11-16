// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Low-poly planet: an icosahedron displaced by deterministic noise, one flat colour per face.
import React, { useMemo } from "react";
import * as THREE from "three";

export const R = 2;
// Where the habitat dome sits on the planet (unit direction).
export const DOME_DIR = new THREE.Vector3(0.32, 0.5, 0.8).normalize();
export const DOME_POS = DOME_DIR.clone().multiplyScalar(R + 0.02);

const PALETTES = {
  moon: { low: "#555861", mid: "#8a8d96", high: "#bcbfc7", glow: "#8fa4c8", seed: 1.3 },
  mars: { low: "#6e3320", mid: "#b5562f", high: "#dc9060", glow: "#ff9a66", seed: 4.1 },
  earth: { low: "#1b4d7c", mid: "#2f7d4f", high: "#d4dccb", glow: "#6fb3ff", seed: 7.7, water: "#1f5f9e" },
};

// Mission gravity decides the world: 0.165 g Moon, 0.38 g Mars, 0 g / 1 g Earth (the ISS gets a ring station).
export function planetKind(mission) {
  const g = mission?.g ?? 0.165;
  if (g >= 0.27 && g < 0.7) return "mars";
  if (g > 0 && g < 0.27) return "moon";
  return "earth";
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const noise = (x, y, z, s) =>
  (Math.sin(x * 2.1 + s) * Math.cos(y * 2.3 - s * 0.7) + Math.sin(z * 2.9 + x * 1.3 + s * 1.7) * 0.6 +
    Math.sin((x + y + z) * 4.1 - s) * 0.3) / 1.9;

function heightAt(dir, kind) {
  const { seed } = PALETTES[kind];
  let h = noise(dir.x * 1.8, dir.y * 1.8, dir.z * 1.8, seed) * 0.16 + noise(dir.x * 5, dir.y * 5, dir.z * 5, seed) * 0.05;
  if (kind === "earth") h = Math.max(h, 0); // flat sea at sea level
  const pad = 1 - smooth(0.1, 0.3, dir.angleTo(DOME_DIR)); // flatten a landing pad under the dome
  return h * (1 - pad) + 0.0 * pad;
}

function buildGeometry(kind) {
  const p = PALETTES[kind];
  const g = new THREE.IcosahedronGeometry(R, 4); // non-indexed, so every face gets its own flat colour
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  const heights = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    heights[i] = heightAt(v, kind);
    v.multiplyScalar(R + heights[i]);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  const colors = new Float32Array(pos.count * 3);
  const low = new THREE.Color(p.low), mid = new THREE.Color(p.mid), high = new THREE.Color(p.high);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i += 3) {
    const h = (heights[i] + heights[i + 1] + heights[i + 2]) / 3;
    const t = Math.min(1, Math.max(0, (h + 0.02) / 0.2));
    if (kind === "earth" && h <= 0.002) c.set(p.water);
    else if (t < 0.5) c.copy(low).lerp(mid, t * 2);
    else c.copy(mid).lerp(high, (t - 0.5) * 2);
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (i + k) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export default function Planet({ kind }) {
  const geom = useMemo(() => buildGeometry(kind), [kind]);
  return (
    <group>
      <mesh geometry={geom}>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.07, 48, 32]} />
        <meshBasicMaterial color={PALETTES[kind].glow} transparent opacity={0.09} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}
