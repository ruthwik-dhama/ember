// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// 3D habitat, smoke playback, fire placement. Owner: Kartavya. Backend z is up; three.js y is up.
import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ROOM_M, DX_M } from "./room.js";

const [L, W, H] = ROOM_M;
// backend (x, y, z) -> three (x - L/2, z, y - W/2), so the room box sits centred on the grid.
const toThree = (x, y, z) => [x - L / 2, z, y - W / 2];

function frameAt(frames, t) {
  let f = null;
  for (const fr of frames || []) if (fr.t_s <= t) f = fr;
  return f;
}

function Smoke({ frame }) {
  const geom = useMemo(() => {
    const vox = frame ? frame.voxels : [];
    const pos = new Float32Array(vox.length * 3);
    const col = new Float32Array(vox.length * 3);
    const smoke = new THREE.Color("#c9ccd1"), dust = new THREE.Color("#c08a4a");
    vox.forEach(([i, j, k, conc, smokeFrac], n) => {
      pos.set(toThree((i + 0.5) * DX_M, (j + 0.5) * DX_M, (k + 0.5) * DX_M), n * 3);
      const c = dust.clone().lerp(smoke, smokeFrac).multiplyScalar(Math.min(1, 0.4 + conc * 3));
      col.set([c.r, c.g, c.b], n * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [frame]);
  return (
    <points geometry={geom}>
      <pointsMaterial size={DX_M * 0.9} vertexColors transparent opacity={0.45} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// alarmed: set of detector ids whose alarm time <= current t.
export default function HabitatView({ frames, t = 0, detectors = [], fires = [], alarmed = new Set(), onPlaceFire }) {
  const frame = frameAt(frames, t);
  return (
    <div style={{ height: 380, border: "1px solid var(--line)", borderRadius: 8 }}>
      <Canvas camera={{ position: [L, H * 2, W * 2] }}>
        <ambientLight intensity={0.8} />
        <mesh position={[0, H / 2, 0]}>
          <boxGeometry args={[L, H, W]} />
          <meshBasicMaterial color="#ff7a3d" wireframe />
        </mesh>
        <gridHelper args={[Math.max(L, W), 12, "#444", "#2a2e35"]} />
        {/* click the floor to place the fire; ignore drags (those orbit the camera) */}
        {onPlaceFire && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}
            onClick={(e) => { if (e.delta > 4) return; e.stopPropagation(); onPlaceFire(e.point.x + L / 2, e.point.z + W / 2); }}>
            <planeGeometry args={[L, W]} />
            <meshBasicMaterial color="#ff7a3d" transparent opacity={0.08} />
          </mesh>
        )}
        {fires.map((f, n) => (
          <mesh key={`f${n}`} position={toThree(f.x, f.y, f.z)}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={t >= (f.t_ignite_s || 0) ? "#ff3b1f" : "#553322"} />
          </mesh>
        ))}
        {detectors.map((d) => (
          <mesh key={d.id} position={toThree(d.x, d.y, d.z)}>
            <boxGeometry args={[0.2, 0.08, 0.2]} />
            <meshBasicMaterial color={alarmed.has(d.id) ? "#ff2d55" : "#3ddc84"} />
          </mesh>
        ))}
        <Smoke frame={frame} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
