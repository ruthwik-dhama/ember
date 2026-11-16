// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Low-poly planet: an icosahedron displaced by deterministic noise and craters, one flat colour per face.
import React, { useMemo } from "react";
import * as THREE from "three";

export const R = 2;
// Where the habitat dome sits on the planet (unit direction).
export const DOME_DIR = new THREE.Vector3(0.32, 0.5, 0.8).normalize();
export const DOME_POS = DOME_DIR.clone().multiplyScalar(R + 0.02);

const PALETTES = {
  moon: { low: "#4a4b52", mid: "#8b8c93", high: "#cfcfd2", glow: "#aab4c8", haze: 0.035, seed: 1.3, craters: 26 },
  mars: { low: "#5f2b1c", mid: "#a8522f", high: "#d99a6c", glow: "#f0a070", haze: 0.08, seed: 4.1, craters: 12 },
  earth: { low: "#1b4d7c", mid: "#2f7d4f", high: "#d4dccb", glow: "#6fb3ff", haze: 0.1, seed: 7.7, water: "#1f5f9e", craters: 0 },
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

// Deterministic pseudo-random in [0, 1) from an integer.
const rand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Impact craters: fixed directions, a bowl and a raised rim. None near the habitat pad.
const craterCache = {};
function cratersFor(kind) {
  if (craterCache[kind]) return craterCache[kind];
  const out = [];
  const n = PALETTES[kind].craters;
  for (let i = 0; out.length < n && i < n * 6; i++) {
    const s = PALETTES[kind].seed * 100 + i * 3;
    const z = rand(s) * 2 - 1, a = rand(s + 1) * Math.PI * 2, r = Math.sqrt(1 - z * z);
    const dir = new THREE.Vector3(r * Math.cos(a), z, r * Math.sin(a));
    const size = 0.06 + Math.pow(rand(s + 2), 2.2) * 0.22; // mostly small, a few large
    if (dir.angleTo(DOME_DIR) < 0.5 + size) continue;
    out.push({ dir, size, depth: 0.012 + size * 0.13 });
  }
  return (craterCache[kind] = out);
}

export function heightAt(dir, kind) {
  const { seed } = PALETTES[kind];
  let h = noise(dir.x * 1.8, dir.y * 1.8, dir.z * 1.8, seed) * 0.06 + noise(dir.x * 5, dir.y * 5, dir.z * 5, seed) * 0.03
    + noise(dir.x * 13, dir.y * 13, dir.z * 13, seed) * 0.012;
  for (const c of cratersFor(kind)) {
    const t = dir.angleTo(c.dir) / c.size;
    if (t > 1.5) continue;
    if (t < 1) h -= c.depth * (1 - t * t);
    h += c.depth * 0.45 * Math.exp(-Math.pow((t - 1) / 0.16, 2)); // rim
  }
  if (kind === "earth") h = Math.max(h, 0); // flat sea at sea level
  const pad = 1 - smooth(0.24, 0.46, dir.angleTo(DOME_DIR)); // level ground for the base
  return h * (1 - pad) + 0.0 * pad;
}

function buildGeometry(kind) {
  const p = PALETTES[kind];
  const g = new THREE.IcosahedronGeometry(R, 18); // 20 x 19^2 = 7220 faces: fine enough to resolve craters // non-indexed, so every face gets its own flat colour
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
    const t = Math.min(1, Math.max(0, (h + 0.06) / 0.15));
    if (kind === "earth" && h <= 0.002) c.set(p.water);
    else if (t < 0.5) c.copy(low).lerp(mid, t * 2);
    else c.copy(mid).lerp(high, (t - 0.5) * 2);
    c.multiplyScalar(0.94 + rand(i) * 0.12); // facet-to-facet variation, like cut stone
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
        <meshBasicMaterial color={PALETTES[kind].glow} transparent opacity={PALETTES[kind].haze} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// A small distant world in the sky: Earth seen from the Moon, or a lumpy moonlet over Mars.
export function SkyBody({ kind }) {
  const geom = useMemo(() => (kind === "moon" ? buildGeometry("earth") : null), [kind]);
  if (kind === "moon") {
    return (
      <mesh geometry={geom} position={[-10, 5.5, -17]} scale={0.62} rotation={[0.3, 1.1, 0.2]}>
        <meshStandardMaterial vertexColors flatShading roughness={0.9} />
      </mesh>
    );
  }
  if (kind === "mars") {
    return (
      <mesh position={[-8, 4.5, -13]} scale={[0.55, 0.42, 0.46]} rotation={[0.4, 0.8, 0.1]}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#6b625b" flatShading roughness={1} />
      </mesh>
    );
  }
  return null;
}
